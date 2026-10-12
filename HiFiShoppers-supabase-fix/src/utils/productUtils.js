export const FREE_SHIPPING_THRESHOLD = 2500;
export const FLAT_SHIPPING = 199;

export function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getStockStatus(stock) {
  if (stock <= 0) {
    return { label: 'Out of stock', className: 'status-out' };
  }

  if (stock <= 10) {
    return { label: 'Low stock', className: 'status-low' };
  }

  return { label: 'In stock', className: 'status-in' };
}

// Converts a Supabase `products` row (joined with categories) to the shape the UI uses.
export function mapDbProduct(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    sku: row.sku,
    category: row.categories?.name ?? 'Uncategorised',
    category_id: row.category_id,
    price: Number(row.selling_price ?? 0),
    mrp: Number(row.mrp_price ?? 0),
    stock: Number(row.stock_quantity ?? 0),
    image: row.primary_image || row.image_urls?.[0] || '',
    images: row.image_urls || [],
    shortDescription: row.short_description || '',
    description: row.description || '',
    isFeatured: !!row.is_featured,
    isNewArrival: !!row.is_new_arrival,
    tags: row.tags || [],
    brand: row.brand || '',
    warranty: row.warranty_details || '',
    status: row.status,
  };
}

export function calcTotals(cart) {
  const subtotal = cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
  const shipping = cart.length === 0 || subtotal > FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING;
  return { subtotal, shipping, total: subtotal + shipping };
}
