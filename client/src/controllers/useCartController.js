// Owner: Member 5 — Cart React controller hook for cart interactions.
import { useState, useEffect, useCallback } from 'react';
import cartModel from '../models/cartModel.js';

export function useCartController(tenantId = 'default') {
  const [cart, setCart] = useState({
    items: [],
    pricing: { subtotal: 0, shipping: 0, tax: 0, total: 0, currency: 'USD' },
    itemCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshCart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await cartModel.getCart(tenantId);
      setCart(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addItem = useCallback(async (product, quantity = 1) => {
    try {
      setError(null);
      const updated = await cartModel.addItem({
        productId: product.id || product.productId,
        title: product.title || product.name,
        price: product.price,
        image: product.image,
        quantity
      }, tenantId);
      setCart(updated);
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [tenantId]);

  const updateQuantity = useCallback(async (productId, quantity) => {
    try {
      setError(null);
      const updated = await cartModel.updateItemQuantity(productId, quantity, tenantId);
      setCart(updated);
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [tenantId]);

  const removeItem = useCallback(async (productId) => {
    try {
      setError(null);
      const updated = await cartModel.removeItem(productId, tenantId);
      setCart(updated);
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [tenantId]);

  const clearCart = useCallback(async () => {
    try {
      setError(null);
      const updated = await cartModel.clearCart(tenantId);
      setCart(updated);
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [tenantId]);

  // Demo helper to easily seed test products when catalog is still being developed by M3/M4
  const addDemoItem = useCallback(async () => {
    const demoCatalog = [
      { id: 'prod_1', title: 'Minimalist Ceramic Mug', price: 24.00, image: '☕' },
      { id: 'prod_2', title: 'Organic Cotton Tote Bag', price: 18.50, image: '👜' },
      { id: 'prod_3', title: 'Desk Ambient Lamp', price: 45.00, image: '💡' },
      { id: 'prod_4', title: 'Recycled Leather Notebook', price: 15.00, image: '📓' }
    ];
    const randomItem = demoCatalog[Math.floor(Math.random() * demoCatalog.length)];
    return await addItem(randomItem, 1);
  }, [addItem]);

  return {
    cart,
    loading,
    error,
    refreshCart,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    addDemoItem
  };
}

export default useCartController;
