import { describe, expect, it } from 'vitest';
import { formatCurrency, slugify, getStockStatus } from './productUtils';

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
});
