import { useMemo, useState } from 'react';
import { useStore } from '../context/StoreContext';
import ProductCard from '../components/ProductCard';
import { formatCurrency } from '../utils/productUtils';

export default function ProductsPage() {
  const { products } = useStore();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('featured');

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    let next = products.filter((product) => {
      if (!normalized) return true;
      return [product.name, product.category, ...(product.tags || [])]
        .join(' ')
        .toLowerCase()
        .includes(normalized);
    });

    if (sort === 'price-low') next = [...next].sort((a, b) => a.price - b.price);
    if (sort === 'price-high') next = [...next].sort((a, b) => b.price - a.price);
    if (sort === 'newest') next = [...next].sort((a, b) => Number(b.isNewArrival) - Number(a.isNewArrival));

    return next;
  }, [products, query, sort]);

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
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search products"
          className="search-input"
        />
        <select value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="featured">Featured</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="newest">Newest</option>
        </select>
      </div>

      <div className="results-bar">
        <span>{filteredProducts.length} products</span>
        <span>All prices in INR</span>
      </div>

      <div className="product-grid">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
