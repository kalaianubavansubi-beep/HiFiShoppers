-- 001_initial_schema.sql
-- Reproducible Supabase schema for HiFiShoppers

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  full_name text,
  role text not null default 'customer' check (role in ('customer', 'admin', 'manager')),
  is_active boolean not null default true,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text unique not null,
  sku text unique not null,
  short_description text,
  description text,
  selling_price numeric(12,2) not null check (selling_price >= 0),
  mrp_price numeric(12,2) check (mrp_price is null or mrp_price >= selling_price),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  is_featured boolean not null default false,
  is_new_arrival boolean not null default false,
  tags text[] not null default '{}',
  search_keywords text[] not null default '{}',
  brand text,
  model_number text,
  color_variants text[] default '{}',
  size_variants text[] default '{}',
  warranty_details text,
  shipping_information text,
  return_policy text,
  authenticity_info text,
  specifications jsonb default '{}',
  image_urls text[] not null default '{}',
  primary_image text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null,
  alt_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  user_id uuid references public.profiles(id) on delete set null,
  customer_name text not null,
  phone text not null,
  shipping_address text not null,
  subtotal numeric(12,2) not null default 0,
  shipping_charge numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  payment_status text not null default 'pending' check (payment_status in ('pending','paid','failed','cod')),
  fulfillment_status text not null default 'pending' check (fulfillment_status in ('pending','processing','shipped','delivered','cancelled')),
  tracking_info text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null,
  total_price numeric(12,2) not null,
  created_at timestamptz not null default now()
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  delta integer not null,
  reason text not null,
  related_order_id uuid references public.orders(id),
  created_at timestamptz not null default now()
);

create table if not exists public.store_settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_products_status on public.products(status);
create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_products_featured on public.products(is_featured);
create index if not exists idx_products_new_arrival on public.products(is_new_arrival);
create index if not exists idx_orders_customer on public.orders(customer_name);
create index if not exists idx_orders_created_at on public.orders(created_at desc);
create index if not exists idx_product_images_product on public.product_images(product_id, sort_order);

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.store_settings enable row level security;

create policy "Public profiles are viewable by owner or admin"
  on public.profiles
  for select
  using (auth.uid() = id or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','manager')
  ));

create policy "Users can update their own profile"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Admins can manage categories"
  on public.categories
  for all
  using (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','manager')
  ))
  with check (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','manager')
  ));

create policy "Published products are public"
  on public.products
  for select
  using (status = 'published');

create policy "Admins manage products"
  on public.products
  for all
  using (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','manager')
  ))
  with check (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','manager')
  ));

create policy "Public product images for published products"
  on public.product_images
  for select
  using (exists (
    select 1 from public.products p where p.id = product_id and p.status = 'published'
  ));

create policy "Admins manage product images"
  on public.product_images
  for all
  using (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','manager')
  ))
  with check (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','manager')
  ));

create policy "Customers can view own orders"
  on public.orders
  for select
  using (auth.uid() = user_id or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','manager')
  ));

create policy "Customers can insert their own orders"
  on public.orders
  for insert
  with check (auth.uid() = user_id or user_id is null);

create policy "Admins manage orders"
  on public.orders
  for update
  using (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','manager')
  ));

create policy "Admins manage order items"
  on public.order_items
  for all
  using (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','manager')
  ))
  with check (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','manager')
  ));

create policy "Admins manage inventory movements"
  on public.inventory_movements
  for all
  using (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','manager')
  ))
  with check (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','manager')
  ));

create policy "Admins manage store settings"
  on public.store_settings
  for all
  using (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','manager')
  ))
  with check (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','manager')
  ));

create function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger handle_profiles_updated_at
before update on public.profiles
for each row execute procedure public.update_updated_at_column();

create trigger handle_categories_updated_at
before update on public.categories
for each row execute procedure public.update_updated_at_column();

create trigger handle_products_updated_at
before update on public.products
for each row execute procedure public.update_updated_at_column();

create trigger handle_orders_updated_at
before update on public.orders
for each row execute procedure public.update_updated_at_column();

create trigger handle_store_settings_updated_at
before update on public.store_settings
for each row execute procedure public.update_updated_at_column();
