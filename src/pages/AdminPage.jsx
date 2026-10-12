import { useState } from 'react';
import { LogIn, ShieldAlert, LogOut } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import ProtectedRoute from '../components/ProtectedRoute';

export default function AdminPage() {
  const { user, setUser } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');

  const isAuthorized = !!user && (user.email?.includes('admin') || user.email?.includes('manager'));

  const onDemoLogin = (event) => {
    event.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setStatus('Use a valid email address to continue.');
      return;
    }

    setUser({ id: 'demo-admin', email: email.trim() });
    setStatus('Demo admin session created. Configure Supabase Auth to enable production authorization.');
  };

  const onLogout = () => {
    setUser(null);
    setStatus('You have been logged out from the local admin session.');
  };

  if (!user) {
    return (
      <div className="container page-shell auth-shell">
        <div className="auth-card">
          <div className="auth-header">
            <ShieldAlert size={28} />
            <h1>Admin access</h1>
          </div>
          <p>Use Supabase Auth for production access. This UI supports a demo local session before database auth is configured.</p>
          <form onSubmit={onDemoLogin} className="auth-form">
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Admin email" />
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" />
            <button type="submit" className="button button-primary">
              <LogIn size={18} />
              Demo login
            </button>
          </form>
          {status && <p className="form-status">{status}</p>}
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="container page-shell auth-shell">
        <div className="auth-card">
          <h2>Unauthorized</h2>
          <p>This account does not have admin access. Please sign in with an authorized Supabase admin profile.</p>
          <button className="button button-secondary" onClick={onLogout}>
            <LogOut size={18} />
            Log out
          </button>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="container page-shell admin-shell">
        <div className="admin-header">
          <div>
            <span className="eyebrow">Admin dashboard</span>
            <h1>HiFiShoppers control center</h1>
          </div>
          <button className="button button-secondary" onClick={onLogout}>
            <LogOut size={18} />
            Log out
          </button>
        </div>

        <div className="admin-grid">
          <article className="admin-card">
            <h3>Products</h3>
            <strong>128</strong>
            <span>Published catalog items</span>
          </article>
          <article className="admin-card">
            <h3>Inventory</h3>
            <strong>86%</strong>
            <span>Healthy stock coverage</span>
          </article>
          <article className="admin-card">
            <h3>Orders</h3>
            <strong>42</strong>
            <span>New in the last 7 days</span>
          </article>
        </div>

        <div className="admin-panel">
          <div className="admin-panel-block">
            <h2>Product management</h2>
            <ul>
              <li>Add new products</li>
              <li>Update selling price and stock</li>
              <li>Publish or archive catalog entries</li>
              <li>Upload multi-image galleries</li>
            </ul>
          </div>
          <div className="admin-panel-block">
            <h2>Order management</h2>
            <ul>
              <li>View incoming orders</li>
              <li>Track fulfillment state</li>
              <li>Mark as processed or shipped</li>
              <li>Review payment status</li>
            </ul>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
