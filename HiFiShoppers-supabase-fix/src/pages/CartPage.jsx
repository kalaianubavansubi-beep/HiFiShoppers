import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus } from 'lucide-react';
import { formatCurrency } from '../utils/productUtils';
import { useStore } from '../context/StoreContext';
import { placeOrder } from '../lib/api';

export default function CartPage() {
  const { cart, removeItem, updateQty, subtotal, shipping, total, clearCart, backendConfigured, reloadCatalog } = useStore();
  const [form, setForm] = useState({ customerName: '', phone: '', shippingAddress: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState(null);

  const orderSummary = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  const setField = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!backendConfigured || cart.length === 0) return;
    setBusy(true);
    setError('');
    try {
      const result = await placeOrder({ ...form, items: cart });
      setConfirmation(result);
      clearCart();
      await reloadCatalog(); // refresh stock levels after the order
    } catch (err) {
      setError(err.message);
      await reloadCatalog();
    } finally {
      setBusy(false);
    }
  };

  if (confirmation) {
    return (
      <div className="container page-shell cart-page">
        <div className="empty-state">
          <h2>Thank you — your order is placed.</h2>
          <p>Order number: <strong>{confirmation.order_number}</strong></p>
          <p>Total payable on delivery: {formatCurrency(confirmation.total_amount)}</p>
          <Link to="/products" className="button button-primary">Continue shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container page-shell cart-page">
      <div className="section-head">
        <div>
          <span className="eyebrow">Checkout</span>
          <h1>Your cart</h1>
        </div>
      </div>

      {cart.length === 0 ? (
        <div className="empty-state">
          <h2>Your cart is empty.</h2>
          <Link to="/products" className="button button-primary">Continue shopping</Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            {cart.map((item) => (
              <div className="cart-item" key={item.id}>
                {item.image ? <img src={item.image} alt={item.name} /> : <div className="image-placeholder cart-thumb" aria-hidden="true" />}
                <div className="cart-body">
                  <div>
                    <h3>{item.name}</h3>
                    <p>{item.category}</p>
                  </div>
                  <div className="qty-controls">
                    <button onClick={() => updateQty(item.id, item.quantity - 1)} aria-label="Decrease quantity" disabled={item.quantity <= 1}>
                      <Minus size={16} />
                    </button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, item.quantity + 1)} aria-label="Increase quantity" disabled={item.quantity >= item.stock}>
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
                <div className="cart-price-wrap">
                  <strong>{formatCurrency(item.price * item.quantity)}</strong>
                  <button className="text-button" onClick={() => removeItem(item.id)}>
                    <Trash2 size={15} />
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <aside className="checkout-panel">
            <h3>Order summary</h3>
            <div className="summary-row"><span>Items</span><span>{orderSummary}</span></div>
            <div className="summary-row"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
            <div className="summary-row"><span>Shipping</span><span>{shipping === 0 ? 'Free' : formatCurrency(shipping)}</span></div>
            <div className="summary-row total-row"><span>Total</span><span>{formatCurrency(total)}</span></div>

            <form className="checkout-form" onSubmit={onSubmit}>
              <input type="text" placeholder="Full name" value={form.customerName} onChange={setField('customerName')} required />
              <input type="tel" placeholder="Phone number" value={form.phone} onChange={setField('phone')} required />
              <textarea rows="4" placeholder="Shipping address" value={form.shippingAddress} onChange={setField('shippingAddress')} required />
              {!backendConfigured && (
                <p className="form-status">Checkout needs a configured Supabase backend (demo catalog is browse-only).</p>
              )}
              {error && <p className="form-status" role="alert">{error}</p>}
              <button type="submit" className="button button-primary" disabled={busy || !backendConfigured}>
                {busy ? 'Placing order…' : 'Place order (Cash on delivery)'}
              </button>
            </form>
          </aside>
        </div>
      )}
    </div>
  );
}
