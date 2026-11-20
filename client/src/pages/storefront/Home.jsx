// Owner: M3 -- storefront landing: renders the sections the owner enabled, in their order
import { useRef, useState } from 'react';
import { useStore } from '../../context/StoreContext';
import useCart from '../../hooks/useCart';
import { AddedToast, Perks, StoreSections } from '../../components/storefront/sections';

export { Perks, AddedToast };

export default function Home() {
  const { store, products } = useStore();
  const { addItem } = useCart(store.slug);
  const [added, setAdded] = useState(null);
  const timer = useRef();

  const onAdd = (p) => {
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
