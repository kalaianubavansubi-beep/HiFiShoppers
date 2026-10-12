// Supplied product photos (source of truth) and which catalog product each set belongs to.
// Files live in public/images/products/<folder>/ and are served from /images/products/...
//
// To attach a photo set to a product, add its slug to PHOTO_ASSIGNMENTS below.
// Works for both the demo catalog and live Supabase products (matched by product slug).
// Product names, prices, SKUs and stock are never touched by this file.

const set = (folder, count, alt) =>
  Array.from({ length: count }, (_, i) => ({
    src: `/images/products/${folder}/${folder}-${String(i + 1).padStart(2, '0')}.webp`,
    alt: `${alt} – photo ${i + 1}`,
  }));

export const PHOTO_SETS = {
  'smart-watch-ultra-buds-combo': set('smart-watch-ultra-buds-combo', 9, 'Smart Watch Ultra with wireless earbuds'),
  'c-watch-steel-strap-earbuds-combo': set('c-watch-steel-strap-earbuds-combo', 8, 'Square smartwatch with steel strap and black earbuds'),
  'boat-airdopes-prime-realme-neo-combo': set('boat-airdopes-prime-realme-neo-combo', 5, 'boAt Airdopes Prime earbuds and realme Buds Wireless 3 Neo neckband'),
  'marshall-willen-speaker': set('marshall-willen-speaker', 4, 'Marshall Willen portable Bluetooth speaker'),
  'c-watch-sport-band': set('c-watch-sport-band', 11, 'Smartwatch with black sport band'),
  'black-pro-style-earbuds': set('black-pro-style-earbuds', 5, 'Black wireless earbuds with charging case'),
  'pro-3-anc-style-earbuds': set('pro-3-anc-style-earbuds', 5, 'ANC wireless earbuds with free silicone case'),
};

// product slug -> photo set.
// Only the Marshall speaker is assigned: it is the one existing catalog product whose brand and category
// match a supplied set. The other six sets are ready but intentionally unassigned until you confirm which
// product each belongs to – e.g. add  'your-product-slug': 'c-watch-sport-band',  below.
export const PHOTO_ASSIGNMENTS = {
  'marshall-ember-mini': 'marshall-willen-speaker', // CONFIRM: photos show the Marshall Willen model
};

export function applyPhotos(product, assignments = PHOTO_ASSIGNMENTS, sets = PHOTO_SETS) {
  const photos = sets[assignments[product.slug]];
  if (!photos) return { ...product, gallery: galleryFor(product) };
  return { ...product, image: photos[0].src, gallery: photos };
}

function galleryFor(product) {
  const urls = product.images?.length ? product.images : product.image ? [product.image] : [];
  return urls.map((src, i) => ({ src, alt: `${product.name} – photo ${i + 1}` }));
}
