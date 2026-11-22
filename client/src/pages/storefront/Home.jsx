// Owner: M3 -- storefront landing: renders the sections the owner enabled, in their order
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import useCart from '../../hooks/useCart';
import useAuth from '../../hooks/useAuth';
import { AddedToast, Perks, StoreSections } from '../../components/storefront/sections';

export { Perks, AddedToast };

export default function Home() {
  const { store, products } = useStore();
  const { addItem } = useCart(store.slug);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [added, setAdded] = useState(null);
  const timer = useRef();
  const canShop = user?.role === 'customer' && String(user.customerStore) === String(store?._id);

  const onAdd = (p) => {
    if (!canShop) {
      navigate(`/store/${store.slug}/login`, { state: { from: `/store/${store.slug}/product/${p._id}` } });
      return;
    }
    addItem(p, 1);
    setAdded(p);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(null), 2600);
  };

  return (
    <>
      <StoreSections store={store} products={products} onAdd={onAdd} />
      <AddedToast item={added} store={store} onClose={() => setAdded(null)} />
    </>
  );
}
