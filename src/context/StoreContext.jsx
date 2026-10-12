import React from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { demoProducts, demoCategories } from '../lib/demoData';
import { supabase } from '../lib/supabase';

const StoreContext = createContext(null);

const readCart = () => {
  try {
    const raw = localStorage.getItem('hifishoppers-cart');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const formatProduct = (product) => ({
  ...product,
  price: Number(product.price ?? product.selling_price ?? 0),
  mrp: Number(product.mrp ?? product.mrp_price ?? 0),
});

export function StoreProvider({ children }) {
  const [cart, setCart] = useState(readCart);
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState(demoProducts.map(formatProduct));
  const [categories] = useState(demoCategories);

  useEffect(() => {
    localStorage.setItem('hifishoppers-cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (!supabase) {
      setUser({ id: 'guest', email: 'guest@hifishoppers.shop' });
      return;
    }

    const syncSession = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
    };

    syncSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const addToCart = (product, quantity = 1) => {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        const nextQty = existing.quantity + quantity;
        return current.map((item) =>
          item.id === product.id ? { ...item, quantity: Math.min(nextQty, product.stock) } : item,
        );
      }

      return [...current, { ...product, quantity: Math.min(quantity, product.stock) }];
    });
  };

  const updateQty = (productId, nextQty) => {
    setCart((current) =>
      current
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: Math.max(1, Math.min(nextQty, item.stock || 30)) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const removeItem = (productId) => {
    setCart((current) => current.filter((item) => item.id !== productId));
  };

  const clearCart = () => setCart([]);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0),
    [cart],
  );

  const shipping = subtotal > 2500 ? 0 : cart.length ? 199 : 0;
  const total = subtotal + shipping;

  const value = {
    cart,
    products,
    categories,
    user,
    setUser,
    setProducts,
    addToCart,
    updateQty,
    removeItem,
    clearCart,
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
