import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="container empty-state">
      <h1>404 — Page not found</h1>
      <p>The product, category, or admin route you requested does not exist.</p>
      <Link to="/" className="button button-primary">
        Return home
      </Link>
    </div>
  );
}
