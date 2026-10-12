import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { demoProducts, demoCategories } from '../lib/demoData';
import { supabase } from '../lib/supabase';
import { fetchCategories, fetchProfile, fetchProducts, signOut as apiSignOut } from '../lib/api';
import { calcTotals } from '../utils/productUtils';
import { applyPhotos } from '../lib/productPhotos';

const StoreContext = createContext(null);

const CART_KEY = 'hifishoppers-cart';

const readCart = () => {
  try {
    const raw = localStorage.getItem(CART_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const isBackendConfigured = Boolean(supabase);

export function StoreProvider({ children }) {
  const [cart, setCart] = useState(readCart);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState('');
  const [authReady, setAuthReady] = useState(!supabase);
  const [products, setProducts] = useState(supabase ? [] : demoProducts.map((item) => applyPhotos(item)));
  const [categories, setCategories] = useState(supabase ? [] : demoCategories);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {
      /* storage unavailable (private mode) – cart just won't persist */
    }
  }, [cart]);

  const reloadCatalog = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    setLoadError('');
    try {
      const [nextProducts, nextCategories] = await Promise.all([fetchProducts(), fetchCategories()]);
      setProducts(nextProducts.map((item) => applyPhotos(item)));
      setCategories(nextCategories);
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auth session
  useEffect(() => {
    if (!supabase) return undefined;

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setAuthReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Role comes from the database `profiles` table (never from the email address).
  useEffect(() => {
    if (!supabase || !user) {
      setProfile(null);
      setProfileError('');
      return undefined;
    }
    let cancelled = false;
    setProfileError('');
    fetchProfile(user.id)
      .then((row) => {
        if (cancelled) return;
        setProfile(row);
        if (!row) setProfileError('No profile row exists for this user. Run migration 002 (it back-fills profiles), then set role = admin.');
      })
      .catch((error) => {
        if (cancelled) return;
        setProfile(null);
        setProfileError(error.message);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const isAdmin = Boolean(profile?.is_active && ['admin', 'manager'].includes(profile?.role));

  // Reload catalog on mount and whenever the session changes (admins also see drafts).
  useEffect(() => {
    reloadCatalog();
  }, [reloadCatalog, user?.id]);

  // Keep cart prices/stock in sync with the catalog and drop unavailable items.
  useEffect(() => {
    if (!products.length) return;
    setCart((current) =>
      current.flatMap((item) => {
        const live = products.find((p) => p.id === item.id);
        if (!live || live.stock <= 0) return [];
        return [{ ...live, quantity: Math.min(item.quantity, live.stock) }];
      }),
    );
  }, [products]);

  const addToCart = (product, quantity = 1) => {
    if (!product || product.stock <= 0) return false;
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        return current.map((item) =>
          item.id === product.id ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock) } : item,
        );
      }
      return [...current, { ...product, quantity: Math.min(quantity, product.stock) }];
    });
    return true;
  };

  const updateQty = (productId, nextQty) => {
    setCart((current) =>
      current.map((item) =>
        item.id === productId ? { ...item, quantity: Math.max(1, Math.min(nextQty, item.stock || 1)) } : item,
      ),
    );
  };

  const removeItem = (productId) => setCart((current) => current.filter((item) => item.id !== productId));
  const clearCart = () => setCart([]);

  const signOut = async () => {
    await apiSignOut();
    setUser(null);
    setProfile(null);
  };

  const { subtotal, shipping, total } = useMemo(() => calcTotals(cart), [cart]);

  const value = {
    cart,
    products,
    categories,
    user,
    profile,
    profileError,
    isAdmin,
    authReady,
    loading,
    loadError,
    backendConfigured: isBackendConfigured,
    reloadCatalog,
    addToCart,
    updateQty,
    removeItem,
    clearCart,
    signOut,
    subtotal,
    shipping,
    total,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);

  if (!context) {
    throw new Error('useStore must be used within StoreProvider');
  }

  return context;
}
