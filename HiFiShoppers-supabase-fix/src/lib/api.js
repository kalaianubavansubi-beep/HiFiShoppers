import { supabase, supabaseConfigProblems } from './supabase';
import { mapDbProduct, slugify } from '../utils/productUtils';

const requireClient = () => {
  if (!supabase) throw new Error(`Supabase is not configured. ${supabaseConfigProblems.join(' ')}`);
  return supabase;
};

const unwrap = ({ data, error }) => {
  if (error) throw new Error(error.message);
  return data;
};

// ---------- Storefront ----------
export async function fetchProducts() {
  const client = requireClient();
  // RLS returns only published rows to the public, and all rows to admins.
  const rows = unwrap(
    await client.from('products').select('*, categories(name)').order('created_at', { ascending: false }),
  );
  return rows.map(mapDbProduct);
}

export async function fetchCategories() {
  const client = requireClient();
  return unwrap(await client.from('categories').select('id, name, slug, description').order('name'));
}

export async function placeOrder({ customerName, phone, shippingAddress, items }) {
  const client = requireClient();
  const rows = unwrap(
    await client.rpc('place_order', {
      p_customer_name: customerName,
      p_phone: phone,
      p_shipping_address: shippingAddress,
      p_items: items.map((item) => ({ product_id: item.id, quantity: item.quantity })),
    }),
  );
  return Array.isArray(rows) ? rows[0] : rows;
}

// ---------- Auth ----------
export function describeAuthError(error) {
  const message = String(error?.message || error || '');
  if (/invalid login credentials/i.test(message)) return 'Wrong email or password. Check that this user exists in Supabase > Authentication > Users.';
  if (/email not confirmed/i.test(message)) return 'This email is not confirmed yet. In Supabase > Authentication > Users, confirm the user (or turn off "Confirm email").';
  if (/failed to fetch|networkerror|load failed/i.test(message)) return 'Cannot reach Supabase. Check VITE_SUPABASE_URL is exactly your Project URL and the project is not paused.';
  if (/invalid api key|apikey/i.test(message)) return 'Supabase rejected the API key. Re-copy the anon/publishable key from Project Settings > API (it must belong to the same project as the URL).';
  if (/rate limit|too many/i.test(message)) return 'Too many attempts. Wait a minute and try again.';
  return message || 'Sign-in failed.';
}

export async function signIn(email, password) {
  const client = requireClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(describeAuthError(error));
  return data;
}

export async function signOut() {
  if (supabase) await supabase.auth.signOut();
}

export async function fetchProfile(userId) {
  const client = requireClient();
  const { data, error } = await client
    .from('profiles')
    .select('id, email, role, is_active')
    .eq('id', userId)
    .maybeSingle();
  if (error) {
    const missingTable = /relation .*profiles.* does not exist|could not find the table/i.test(error.message);
    throw new Error(
      missingTable
        ? 'Database tables are missing. Run supabase/migrations/001 and 002 in the Supabase SQL Editor.'
        : error.message,
    );
  }
  return data;
}

// ---------- Admin (all calls are enforced by RLS, not by this UI) ----------
export async function saveProduct(form) {
  const client = requireClient();
  const payload = {
    name: form.name.trim(),
    slug: form.slug?.trim() || slugify(form.name),
    sku: form.sku.trim(),
    category_id: form.category_id || null,
    short_description: form.short_description || null,
    description: form.description || null,
    selling_price: Number(form.selling_price),
    mrp_price: form.mrp_price === '' || form.mrp_price == null ? null : Number(form.mrp_price),
    stock_quantity: Math.max(0, parseInt(form.stock_quantity, 10) || 0),
    status: form.status,
    is_featured: !!form.is_featured,
    is_new_arrival: !!form.is_new_arrival,
    brand: form.brand || null,
    warranty_details: form.warranty_details || null,
    primary_image: form.primary_image || null,
    image_urls: form.primary_image ? [form.primary_image] : [],
  };

  if (form.id) {
    return unwrap(await client.from('products').update(payload).eq('id', form.id).select().single());
  }
  return unwrap(await client.from('products').insert(payload).select().single());
}

export async function deleteProduct(id) {
  const client = requireClient();
  unwrap(await client.from('products').delete().eq('id', id));
}

export async function uploadProductImage(file) {
  const client = requireClient();
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
  if (!allowed.includes(file.type)) throw new Error('Only JPG, PNG, WebP or AVIF images are allowed.');
  if (file.size > 5 * 1024 * 1024) throw new Error('Image must be 5 MB or smaller.');

  const ext = file.type.split('/')[1].replace('jpeg', 'jpg');
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await client.storage.from('product-images').upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return client.storage.from('product-images').getPublicUrl(path).data.publicUrl;
}

export async function fetchOrders() {
  const client = requireClient();
  return unwrap(
    await client
      .from('orders')
      .select('*, order_items(quantity, unit_price, products(name))')
      .order('created_at', { ascending: false })
      .limit(100),
  );
}

export async function updateOrderStatus(id, fulfillmentStatus) {
  const client = requireClient();
  unwrap(await client.from('orders').update({ fulfillment_status: fulfillmentStatus }).eq('id', id));
}

export async function createCategory(name, description) {
  const client = requireClient();
  return unwrap(
    await client.from('categories').insert({ name: name.trim(), slug: slugify(name), description: description || null }).select().single(),
  );
}

export async function deleteCategory(id) {
  const client = requireClient();
  unwrap(await client.from('categories').delete().eq('id', id));
}
