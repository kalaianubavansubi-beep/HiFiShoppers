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
