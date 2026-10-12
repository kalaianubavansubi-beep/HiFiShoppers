import { describe, expect, it } from 'vitest';
import { formatCurrency, slugify, getStockStatus, mapDbProduct, calcTotals } from './productUtils';

describe('product utils', () => {
  it('formats INR values correctly', () => {
    expect(formatCurrency(1999)).toBe('₹1,999');
  });

  it('creates SEO-friendly slugs', () => {
    expect(slugify('Realme Buds Air 5 Pro')).toBe('realme-buds-air-5-pro');
  });

  it('marks low stock accurately', () => {
    expect(getStockStatus(0).label).toBe('Out of stock');
    expect(getStockStatus(7).label).toBe('Low stock');
    expect(getStockStatus(42).label).toBe('In stock');
  });

  it('maps a database product row to the UI shape', () => {
    const product = mapDbProduct({
      id: 'u1',
      name: 'Buds',
      slug: 'buds',
      selling_price: '2999.00',
      mrp_price: '4999.00',
      stock_quantity: 5,
      primary_image: null,
      image_urls: ['https://x/y.jpg'],
      categories: { name: 'Wireless Earbuds' },
      is_featured: true,
    });
    expect(product).toMatchObject({ price: 2999, mrp: 4999, stock: 5, image: 'https://x/y.jpg', category: 'Wireless Earbuds', isFeatured: true });
  });

  it('calculates cart totals and free shipping threshold', () => {
    expect(calcTotals([])).toEqual({ subtotal: 0, shipping: 0, total: 0 });
    expect(calcTotals([{ price: 1000, quantity: 2 }])).toEqual({ subtotal: 2000, shipping: 199, total: 2199 });
    expect(calcTotals([{ price: 1300, quantity: 2 }])).toEqual({ subtotal: 2600, shipping: 0, total: 2600 });
  });
});
