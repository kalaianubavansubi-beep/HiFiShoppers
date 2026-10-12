import { useMemo, useState } from 'react';
import { Search, ShoppingBag, Menu, User, ShieldCheck } from 'lucide-react';
import { NavLink, Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

export default function Layout({ children }) {
  const { cart, user } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { to: '/', label: 'Home' },
    { to: '/products', label: 'Products' },
        { to: '/cart', label: 'Cart' },
  ];

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  );

  return (
    <div className="site-shell">
      <div className="announcement-bar">
        <p>Free shipping on orders above ₹2,500 • New arrivals every Friday</p>
      </div>

      <header className="site-header">
        <div className="container nav-wrap">
          <Link to="/" className="brand">
            <span className="brand-mark">H</span>
            <span>HiFiShoppers</span>
          </Link>

          <nav className={`nav ${mobileOpen ? 'open' : ''}`}>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="nav-actions">
            <Link to="/products" className="icon-button" aria-label="Search products">
              <Search size={18} />
            </Link>
            <Link to={user ? '/admin' : '/login'} className="icon-button" aria-label="Account">
              <User size={18} />
            </Link>
            <Link to="/cart" className="cart-pill" aria-label="Shopping cart">
              <ShoppingBag size={18} />
              <span>{cartCount}</span>
            </Link>
            <button className="mobile-toggle" onClick={() => setMobileOpen((value) => !value)} aria-label="Open menu">
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="site-footer">
        <div className="container footer-grid">
          <div>
            <h4>HiFiShoppers</h4>
            <p>Premium electronics and audio accessories curated for everyday performance.</p>
          </div>
          <div>
            <h5>Support</h5>
            <ul>
              <li>Shipping & Returns</li>
              <li>Privacy Policy</li>
              <li>Terms & Conditions</li>
            </ul>
          </div>
          <div>
            <h5>Contact</h5>
            <ul>
              <li>+91 98765 43210</li>
              <li>support@hifishoppers.shop</li>
              <li>Bengaluru, India</li>
            </ul>
          </div>
          <div>
            <h5>Authorized Access</h5>
            <div className="footer-badge">
              <ShieldCheck size={16} />
              <span>{user ? user.email : 'Not signed in'}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
