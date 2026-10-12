-- 002_security_and_checkout.sql
-- Repairs the policies in 001 (recursive RLS, privilege escalation, missing public reads),
-- adds a server-side checkout function and storage policies.
-- Safe to run after 001. Idempotent: policies/functions are dropped and recreated.
-- Does NOT delete or modify any table data.

-- ---------------------------------------------------------------
-- 1. Admin check helper (SECURITY DEFINER avoids the infinite
--    recursion that 001's profiles policy causes by querying profiles
--    from inside a profiles policy).
-- ---------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.is_active
      and p.role in ('admin', 'manager')
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------
-- 2. Create a profile row automatically for every new auth user
--    (001 never linked profiles.id to auth.users, so nobody had a role).
-- ---------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Back-fill profiles for auth users that already exist.
insert into public.profiles (id, email)
select u.id, u.email from auth.users u
on conflict (id) do nothing;

-- ---------------------------------------------------------------
-- 3. Profiles: fix recursion and block self-promotion to admin.
-- ---------------------------------------------------------------
drop policy if exists "Public profiles are viewable by owner or admin" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;

create policy "Profiles viewable by owner or admin"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Column-level privileges: customers may only change their name/avatar, never `role` or `is_active`.
revoke update on public.profiles from anon, authenticated;
grant update (full_name, avatar_url) on public.profiles to authenticated;

-- ---------------------------------------------------------------
-- 4. Replace the recursive admin policies with is_admin().
-- ---------------------------------------------------------------
drop policy if exists "Admins can manage categories" on public.categories;
create policy "Admins can manage categories" on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Categories are public" on public.categories;
create policy "Categories are public" on public.categories
  for select using (true);

drop policy if exists "Admins manage products" on public.products;
create policy "Admins manage products" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage product images" on public.product_images;
create policy "Admins manage product images" on public.product_images
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Customers can view own orders" on public.orders;
create policy "Customers can view own orders" on public.orders
  for select using (auth.uid() = user_id or public.is_admin());

-- 001 let ANYONE insert an order with arbitrary totals. Orders are now created only
-- through public.place_order(), which prices the order on the server.
drop policy if exists "Customers can insert their own orders" on public.orders;

drop policy if exists "Admins manage orders" on public.orders;
create policy "Admins manage orders" on public.orders
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Customers can view own order items" on public.order_items;
create policy "Customers can view own order items" on public.order_items
  for select using (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );

drop policy if exists "Admins manage order items" on public.order_items;
create policy "Admins manage order items" on public.order_items
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage inventory movements" on public.inventory_movements;
create policy "Admins manage inventory movements" on public.inventory_movements
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage store settings" on public.store_settings;
create policy "Admins manage store settings" on public.store_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------
-- 5. Server-side checkout. Prices, stock and shipping are computed in
--    the database, never trusted from the browser.
--    p_items = [{"product_id": "<uuid>", "quantity": 2}, ...]
-- ---------------------------------------------------------------
create or replace function public.place_order(
  p_customer_name text,
  p_phone text,
  p_shipping_address text,
  p_items jsonb
)
returns table (order_id uuid, order_number text, total_amount numeric)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty integer;
  v_subtotal numeric(12,2) := 0;
  v_shipping numeric(12,2) := 0;
  v_order_id uuid;
  v_order_number text;
  v_user uuid := auth.uid();
begin
  if coalesce(trim(p_customer_name), '') = '' or coalesce(trim(p_phone), '') = ''
     or coalesce(trim(p_shipping_address), '') = '' then
    raise exception 'Name, phone and shipping address are required';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Cart is empty';
  end if;

  if v_user is not null and not exists (select 1 from public.profiles where id = v_user) then
    v_user := null;
  end if;

  v_order_number := 'HFS-' || to_char(now(), 'YYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  insert into public.orders (order_number, user_id, customer_name, phone, shipping_address,
                             subtotal, shipping_charge, total_amount, payment_status)
  values (v_order_number, v_user, trim(p_customer_name), trim(p_phone), trim(p_shipping_address),
          0, 0, 0, 'cod')
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'quantity')::integer;
    if v_qty is null or v_qty <= 0 then
      raise exception 'Invalid quantity';
    end if;

    select * into v_product
    from public.products
    where id = (v_item->>'product_id')::uuid and status = 'published'
    for update;

    if not found then
      raise exception 'A product in your cart is no longer available';
    end if;
    if v_product.stock_quantity < v_qty then
      raise exception 'Not enough stock for %', v_product.name;
    end if;

    insert into public.order_items (order_id, product_id, quantity, unit_price, total_price)
    values (v_order_id, v_product.id, v_qty, v_product.selling_price, v_product.selling_price * v_qty);

    update public.products set stock_quantity = stock_quantity - v_qty where id = v_product.id;

    insert into public.inventory_movements (product_id, delta, reason, related_order_id)
    values (v_product.id, -v_qty, 'order', v_order_id);

    v_subtotal := v_subtotal + v_product.selling_price * v_qty;
  end loop;

  v_shipping := case when v_subtotal > 2500 then 0 else 199 end;

  update public.orders
  set subtotal = v_subtotal, shipping_charge = v_shipping, total_amount = v_subtotal + v_shipping
  where id = v_order_id;

  return query select v_order_id, v_order_number, v_subtotal + v_shipping;
end;
$$;

revoke all on function public.place_order(text, text, text, jsonb) from public;
grant execute on function public.place_order(text, text, text, jsonb) to anon, authenticated;

-- ---------------------------------------------------------------
-- 6. Storage bucket + policies for product images.
-- ---------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Product images are public" on storage.objects;
create policy "Product images are public" on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists "Admins upload product images" on storage.objects;
create policy "Admins upload product images" on storage.objects
  for insert with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "Admins update product images" on storage.objects;
create policy "Admins update product images" on storage.objects
  for update using (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "Admins delete product images" on storage.objects;
create policy "Admins delete product images" on storage.objects
  for delete using (bucket_id = 'product-images' and public.is_admin());

-- ---------------------------------------------------------------
-- 7. FIRST ADMIN (run manually once, after creating the user in Supabase Auth):
--    update public.profiles set role = 'admin' where email = 'you@example.com';
-- ---------------------------------------------------------------
