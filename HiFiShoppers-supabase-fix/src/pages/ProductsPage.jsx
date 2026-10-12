import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import ProductCard from '../components/ProductCard';

export default function ProductsPage() {
  const { products, categories, loading, loadError } = useStore();
  const [params, setParams] = useSearchParams();
  const [sort, setSort] = useState('featured');
  const query = params.get('q') || '';
  const category = params.get('category') || '';

  const updateParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    let next = products.filter((product) => {
      if (category && product.category !== category) return false;
      if (!normalized) return true;
      return [product.name, product.category, product.brand, ...(product.tags || [])]
        .join(' ')
        .toLowerCase()
        .includes(normalized);
    });

    if (sort === 'featured') next = [...next].sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));
    if (sort === 'price-low') next = [...next].sort((a, b) => a.price - b.price);
    if (sort === 'price-high') next = [...next].sort((a, b) => b.price - a.price);
    if (sort === 'newest') next = [...next].sort((a, b) => Number(b.isNewArrival) - Number(a.isNewArrival));

    return next;
  }, [products, query, category, sort]);

  return (
    <div className="container page-shell">
      <div className="section-head">
        <div>
          <span className="eyebrow">Complete catalog</span>
          <h1>Discover premium products</h1>
        </div>
      </div>

      <div className="filter-bar">
        <input
          type="text"
          value={query}
          onChange={(event) => updateParam('q', event.target.value)}
          placeholder="Search products"
          className="search-input"
          aria-label="Search products"
        />
        <select value={category} onChange={(event) => updateParam('category', event.target.value)} aria-label="Filter by category">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>
        <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort products">
          <option value="featured">Featured</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="newest">Newest</option>
        </select>
      </div>

      <div className="results-bar">
        <span>{loading ? 'Loading…' : `${filteredProducts.length} products`}</span>
        <span>All prices in INR</span>
      </div>

      {loadError && <p className="form-status" role="alert">Could not load products: {loadError}</p>}

      <div className="product-grid">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {!loading && !loadError && filteredProducts.length === 0 && (
        <div className="empty-state"><h2>No products match your search.</h2></div>
      )}
    </div>
  );
}
