import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronRight, Sparkles } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { useStore } from '../context/StoreContext';

export default function HomePage() {
  const { products, categories } = useStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const featuredProducts = useMemo(() => products.filter((item) => item.isFeatured).slice(0, 4), [products]);
  const newArrivals = useMemo(() => products.filter((item) => item.isNewArrival).slice(0, 4), [products]);

  return (
    <>
      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Curated premium audio</span>
            <h1>Experience sound without compromise.</h1>
            <p>
              Premium headphones, wireless earbuds, smartwatches, speakers and accessories built for everyday performance.
            </p>
            <div className="hero-actions">
              <Link to="/products" className="button button-primary">
                Shop now
                <ArrowRight size={18} />
              </Link>
            </div>
            <ul className="feature-pills">
              <li>Free shipping</li>
              <li>2-year support</li>
              <li>Authenticity checked</li>
            </ul>
          </div>

          <div className="hero-visual">
            <div className="hero-glow" />
            <div className="hero-card product-showcase">
              <img
                src="https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=900&q=80"
                alt="Premium headphones"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="search-section">
        <div className="container search-shell">
          <form
            className="search-form"
            onSubmit={(event) => {
              event.preventDefault();
              navigate(query.trim() ? `/products?q=${encodeURIComponent(query.trim())}` : '/products');
            }}
          >
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search smartwatches, speakers, earbuds, and more"
              className="search-input"
            />
            <button type="submit" className="button button-primary">Search</button>
          </form>
        </div>
      </section>

      <section className="section-block">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Browse categories</span>
              <h2>Premium collections</h2>
            </div>
            <Link to="/products" className="text-link">
              Browse all <ChevronRight size={16} />
            </Link>
          </div>

          <div className="category-grid">
            {categories.map((category) => (
              <Link key={category.id} to={`/products?category=${encodeURIComponent(category.name)}`} className="category-card">
                <div className="category-icon">
                  <Sparkles size={20} />
                </div>
                <h3>{category.name}</h3>
                <p>{category.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section-block alt-block">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">New arrivals</span>
              <h2>Fresh picks</h2>
            </div>
          </div>
          <div className="product-grid">
            {newArrivals.map((product) => (
              <ProductCard product={product} key={product.id} />
            ))}
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Best sellers</span>
              <h2>Most loved</h2>
            </div>
          </div>
          <div className="product-grid">
            {featuredProducts.map((product) => (
              <ProductCard product={product} key={product.id} />
            ))}
          </div>
        </div>
      </section>

      <section className="section-block news-block">
        <div className="container newsletter-box">
          <div>
            <span className="eyebrow">Newsletter</span>
            <h2>Get the latest drops before anyone else.</h2>
          </div>
          <p className="newsletter-note">Email signup is not connected to a mailing service yet. Reach us at support@hifishoppers.shop.</p>
        </div>
      </section>
    </>
  );
}
