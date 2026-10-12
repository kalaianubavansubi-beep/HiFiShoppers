import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { PHOTO_SETS, PHOTO_ASSIGNMENTS, applyPhotos } from './productPhotos';

describe('product photos', () => {
  it('every referenced photo file exists in public/', () => {
    for (const photos of Object.values(PHOTO_SETS)) {
      for (const photo of photos) expect(existsSync(`public${photo.src}`)).toBe(true);
    }
  });

  it('every assignment points at a real photo set', () => {
    for (const setName of Object.values(PHOTO_ASSIGNMENTS)) expect(PHOTO_SETS[setName]).toBeDefined();
  });

  it('replaces image and gallery only, keeping product data intact', () => {
    const original = { id: 'p', slug: 'marshall-ember-mini', name: 'Marshall Ember Mini', price: 5499, stock: 12, image: 'old.jpg' };
    const next = applyPhotos(original);
    expect(next.image).toMatch(/marshall-willen-speaker-01\.webp$/);
    expect(next.gallery.length).toBe(4);
    expect(next).toMatchObject({ id: 'p', name: 'Marshall Ember Mini', price: 5499, stock: 12 });
  });

  it('leaves unassigned products with their existing image', () => {
    const next = applyPhotos({ slug: 'other', name: 'Other', image: 'keep.jpg' });
    expect(next.image).toBe('keep.jpg');
    expect(next.gallery).toEqual([{ src: 'keep.jpg', alt: 'Other – photo 1' }]);
  });
});
