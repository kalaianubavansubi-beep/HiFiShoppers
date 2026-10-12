import { useCallback, useEffect, useState } from 'react';
import { LogOut, Plus, Trash2, Pencil } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import {
  createCategory,
  deleteCategory,
  deleteProduct,
  fetchOrders,
  saveProduct,
  updateOrderStatus,
  uploadProductImage,
} from '../lib/api';
import { formatCurrency } from '../utils/productUtils';

const emptyForm = {
  id: null, name: '', slug: '', sku: '', category_id: '', short_description: '', description: '',
  selling_price: '', mrp_price: '', stock_quantity: 0, status: 'draft', is_featured: false,
  is_new_arrival: false, brand: '', warranty_details: '', primary_image: '',
};

const ORDER_STATES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function AdminPage() {
  const { products, categories, reloadCatalog, signOut } = useStore();
  const [form, setForm] = useState(emptyForm);
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  const loadOrders = useCallback(async () => {
    try {
      setOrders(await fetchOrders());
    } catch (error) {
      setMessage(error.message);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const run = async (task, success) => {
    setBusy(true);
    setMessage('');
    try {
      await task();
      if (success) setMessage(success);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };

  const setField = (key) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [key]: value }));
  };

  const onSubmit = (event) => {
    event.preventDefault();
    run(async () => {
      await saveProduct(form);
      await reloadCatalog();
      setForm(emptyForm);
    }, form.id ? 'Product updated.' : 'Product created.');
  };

  const onEdit = (product) =>
    setForm({
      id: product.id, name: product.name, slug: product.slug, sku: product.sku || '',
      category_id: product.category_id || '', short_description: product.shortDescription,
      description: product.description, selling_price: product.price, mrp_price: product.mrp || '',
      stock_quantity: product.stock, status: product.status || 'draft', is_featured: product.isFeatured,
      is_new_arrival: product.isNewArrival, brand: product.brand, warranty_details: product.warranty,
      primary_image: product.image,
    });

  const onDelete = (product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    run(async () => {
      await deleteProduct(product.id);
      await reloadCatalog();
    }, 'Product deleted.');
  };

  const onUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    run(async () => {
      const url = await uploadProductImage(file);
      setForm((current) => ({ ...current, primary_image: url }));
    }, 'Image uploaded. Save the product to apply it.');
  };

  const onOrderStatus = (order, status) =>
    run(async () => {
      await updateOrderStatus(order.id, status);
      await loadOrders();
    }, 'Order status updated.');

  const onAddCategory = (event) => {
    event.preventDefault();
    if (!newCategory.trim()) return;
    run(async () => {
      await createCategory(newCategory);
      setNewCategory('');
      await reloadCatalog();
    }, 'Category added.');
  };

  const onDeleteCategory = (category) => {
    if (!window.confirm(`Delete category "${category.name}"? Products keep existing but become uncategorised.`)) return;
    run(async () => {
      await deleteCategory(category.id);
      await reloadCatalog();
    }, 'Category deleted.');
  };

  const lowStock = products.filter((p) => p.stock <= 10).length;

  return (
    <div className="container page-shell admin-shell">
      <div className="admin-header">
        <div>
          <span className="eyebrow">Admin dashboard</span>
          <h1>HiFiShoppers control center</h1>
        </div>
        <button className="button button-secondary" onClick={signOut}>
          <LogOut size={18} />
          Log out
        </button>
      </div>

      {message && <p className="form-status" role="status">{message}</p>}

      <div className="admin-grid">
        <article className="admin-card"><h3>Products</h3><strong>{products.length}</strong><span>{products.filter((p) => p.status === 'published').length} published</span></article>
        <article className="admin-card"><h3>Low / no stock</h3><strong>{lowStock}</strong><span>10 units or fewer</span></article>
        <article className="admin-card"><h3>Orders</h3><strong>{orders.length}</strong><span>Latest 100 loaded</span></article>
      </div>

      <section className="admin-panel-block">
        <h2>{form.id ? 'Edit product' : 'Add product'}</h2>
        <form className="admin-form" onSubmit={onSubmit}>
          <input placeholder="Name" value={form.name} onChange={setField('name')} required />
          <input placeholder="SKU" value={form.sku} onChange={setField('sku')} required />
          <input placeholder="Slug (auto if blank)" value={form.slug} onChange={setField('slug')} />
          <select value={form.category_id} onChange={setField('category_id')}>
            <option value="">No category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input type="number" min="0" step="0.01" placeholder="Selling price (INR)" value={form.selling_price} onChange={setField('selling_price')} required />
          <input type="number" min="0" step="0.01" placeholder="MRP (INR)" value={form.mrp_price} onChange={setField('mrp_price')} />
          <input type="number" min="0" step="1" placeholder="Stock" value={form.stock_quantity} onChange={setField('stock_quantity')} required />
          <select value={form.status} onChange={setField('status')}>
            <option value="draft">Draft (hidden)</option>
            <option value="published">Published</option>
            <option value="archived">Archived (hidden)</option>
          </select>
          <input placeholder="Brand" value={form.brand} onChange={setField('brand')} />
          <input placeholder="Warranty" value={form.warranty_details} onChange={setField('warranty_details')} />
          <input className="span-2" placeholder="Short description" value={form.short_description} onChange={setField('short_description')} />
          <textarea className="span-2" rows="3" placeholder="Description" value={form.description} onChange={setField('description')} />
          <label className="check"><input type="checkbox" checked={form.is_featured} onChange={setField('is_featured')} /> Featured</label>
          <label className="check"><input type="checkbox" checked={form.is_new_arrival} onChange={setField('is_new_arrival')} /> New arrival</label>
          <div className="span-2 upload-row">
            <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={onUpload} />
            {form.primary_image && <img src={form.primary_image} alt="Preview" className="upload-preview" />}
          </div>
          <div className="span-2 admin-form-actions">
            <button type="submit" className="button button-primary" disabled={busy}>
              <Plus size={16} />{form.id ? 'Save changes' : 'Create product'}
            </button>
            {form.id && <button type="button" className="button button-secondary" onClick={() => setForm(emptyForm)}>Cancel edit</button>}
          </div>
        </form>
      </section>

      <section className="admin-panel-block">
        <h2>Products</h2>
        <div className="table-scroll">
          <table className="admin-table">
            <thead><tr><th>Photo</th><th>Name</th><th>Status</th><th>Price</th><th>Stock</th><th /></tr></thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>{p.image ? <img src={p.image} alt={p.name} className="admin-thumb" loading="lazy" /> : '—'}</td>
                  <td>{p.name}</td>
                  <td>{p.status}</td>
                  <td>{formatCurrency(p.price)}</td>
                  <td>{p.stock}</td>
                  <td className="row-actions">
                    <button className="icon-button" aria-label={`Edit ${p.name}`} onClick={() => onEdit(p)}><Pencil size={16} /></button>
                    <button className="icon-button" aria-label={`Delete ${p.name}`} onClick={() => onDelete(p)}><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && <tr><td colSpan="6">No products yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-panel-block">
        <h2>Categories</h2>
        <form className="inline-form" onSubmit={onAddCategory}>
          <input placeholder="New category name" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
          <button className="button button-primary" type="submit" disabled={busy}>Add</button>
        </form>
        <ul className="plain-list">
          {categories.map((c) => (
            <li key={c.id}>{c.name} <button className="text-button" onClick={() => onDeleteCategory(c)}>Delete</button></li>
          ))}
        </ul>
      </section>

      <section className="admin-panel-block">
        <h2>Orders</h2>
        <div className="table-scroll">
          <table className="admin-table">
            <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>{o.order_number}<br /><small>{new Date(o.created_at).toLocaleDateString('en-IN')}</small></td>
                  <td>{o.customer_name}<br /><small>{o.phone}</small></td>
                  <td>{(o.order_items || []).map((i) => `${i.products?.name ?? 'Item'} ×${i.quantity}`).join(', ')}</td>
                  <td>{formatCurrency(o.total_amount)}</td>
                  <td>
                    <select value={o.fulfillment_status} onChange={(e) => onOrderStatus(o, e.target.value)} disabled={busy}>
                      {ORDER_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td colSpan="5">No orders yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
