import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus } from 'lucide-react';
import { formatCurrency } from '../utils/productUtils';
import { useStore } from '../context/StoreContext';

export default function CartPage() {
  const { cart, removeItem, updateQty, subtotal, shipping, total, clearCart } = useStore();

  const orderSummary = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  );

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
                <img src={item.image} alt={item.name} />
                <div className="cart-body">
                  <div>
                    <h3>{item.name}</h3>
                    <p>{item.category}</p>
                  </div>
                  <div className="qty-controls">
                    <button onClick={() => updateQty(item.id, item.quantity - 1)} aria-label="Decrease quantity">
                      <Minus size={16} />
                    </button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, item.quantity + 1)} aria-label="Increase quantity">
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
            <div className="summary-row">
              <span>Items</span>
              <span>{orderSummary}</span>
            </div>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span>{shipping === 0 ? 'Free' : formatCurrency(shipping)}</span>
            </div>
            <div className="summary-row total-row">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>

            <form className="checkout-form">
              <input type="text" placeholder="Full name" required />
              <input type="tel" placeholder="Phone number" required />
              <textarea rows="4" placeholder="Shipping address" required />
              <button type="button" className="button button-primary" onClick={clearCart}>
                Place order
              </button>
            </form>
          </aside>
        </div>
      )}
    </div>
  );
}
