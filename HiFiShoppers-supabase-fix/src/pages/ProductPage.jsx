import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Truck, ShoppingCart } from 'lucide-react';
import { formatCurrency, getStockStatus } from '../utils/productUtils';
import { useStore } from '../context/StoreContext';

export default function ProductPage() {
  const { slug } = useParams();
  const { products, addToCart, loading } = useStore();
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);

  const product = useMemo(() => products.find((item) => item.slug === slug), [products, slug]);

  if (!product && loading) {
    return <div className="container page-shell"><p>Loading product…</p></div>;
  }

  if (!product) {
    return (
      <div className="container empty-state">
        <h2>Product not found</h2>
        <Link to="/products" className="button button-primary">Back to catalog</Link>
      </div>
    );
  }

  const stockStatus = getStockStatus(product.stock);
  const gallery = product.gallery || [];

  return (
    <div className="container page-shell">
      <Link to="/products" className="back-link">
        <ArrowLeft size={16} />
        Back to products
      </Link>

      <div className="product-detail-grid">
        <div className="detail-gallery">
          {gallery.length ? (
            <img
              src={gallery[Math.min(activeIndex, gallery.length - 1)].src}
              alt={gallery[Math.min(activeIndex, gallery.length - 1)].alt}
              className="detail-main-image"
              width="900"
              height="1200"
              decoding="async"
            />
          ) : (
            <div className="detail-main-image image-placeholder" aria-hidden="true" />
          )}
          {gallery.length > 1 && (
            <div className="detail-thumbs" role="list">
              {gallery.map((photo, index) => (
                <button
                  key={photo.src}
                  type="button"
                  role="listitem"
                  className={index === activeIndex ? 'thumb active' : 'thumb'}
                  onClick={() => setActiveIndex(index)}
                  aria-label={`Show photo ${index + 1}`}
                >
                  <img src={photo.src} alt={photo.alt} loading="lazy" decoding="async" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="detail-copy">
          <span className="eyebrow">{product.category}</span>
          <h1>{product.name}</h1>
          <div className="price-row detail-pricing">
            <strong>{formatCurrency(product.price)}</strong>
            {product.mrp > product.price && <span>{formatCurrency(product.mrp)}</span>}
          </div>

          <div className="stock-status-row">
            <span className={`status-badge ${stockStatus.className}`}>{stockStatus.label}</span>
            <span>{product.stock} units available</span>
          </div>

          <p className="detail-description">{product.shortDescription}</p>

          <div className="detail-actions">
            <button className="button button-primary" disabled={product.stock <= 0} onClick={() => addToCart(product, 1)}>
              <ShoppingCart size={18} />
              {product.stock <= 0 ? 'Out of stock' : 'Add to cart'}
            </button>
            <button
              className="button button-secondary"
              disabled={product.stock <= 0}
              onClick={() => {
                if (addToCart(product, 1)) navigate('/cart');
              }}
            >
              Buy now
            </button>
          </div>

          <div className="detail-features">
            <div>
              <Truck size={18} />
              <span>Free shipping over ₹2,500</span>
            </div>
            <div>
              <ShieldCheck size={18} />
              <span>Verified authenticity</span>
            </div>
          </div>
        </div>
      </div>

      <section className="detail-section">
        <h2>Product description</h2>
        <p>{product.description}</p>
      </section>

      <section className="detail-section">
        <h2>Specifications</h2>
        <ul className="spec-list">
          <li>Brand: {product.brand || 'HiFiShoppers curated'}</li>
          <li>Warranty: {product.warranty || '1 year manufacturer coverage'}</li>
          <li>Category: {product.category}</li>
          <li>Tags: {product.tags?.join(', ') || 'Premium quality'}</li>
        </ul>
      </section>
    </div>
  );
}
