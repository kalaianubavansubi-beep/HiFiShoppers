import { Link } from 'react-router-dom';
import { ArrowRight, Star } from 'lucide-react';
import { formatCurrency } from '../utils/productUtils';

export default function ProductCard({ product }) {
  return (
    <article className="product-card">
      <Link to={`/products/${product.slug}`} className="product-image-wrap">
        <img src={product.image} alt={product.name} className="product-image" />
      </Link>

      <div className="product-meta">
        <div className="product-labels">
          {product.isFeatured && <span>Featured</span>}
          {product.isNewArrival && <span>New</span>}
        </div>

        <h3>{product.name}</h3>
        <div className="rating-row">
          <Star size={14} fill="currentColor" />
          <span>{product.rating || 4.8}</span>
        </div>
        <p>{product.shortDescription}</p>
        <div className="price-row">
          <strong>{formatCurrency(product.price)}</strong>
          {product.mrp > product.price && <span>{formatCurrency(product.mrp)}</span>}
        </div>
        <div className="product-actions">
          <Link to={`/products/${product.slug}`} className="button button-secondary">
            View details
          </Link>
          <Link to={`/products/${product.slug}`} className="button button-primary">
            Shop now
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
}
