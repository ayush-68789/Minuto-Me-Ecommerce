// Owner: M5
// Always recompute totals on the server from DB prices -- never trust the client.
const calcTotals = (items, shippingFee = 0) => {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  return { subtotal, shippingFee, total: subtotal + shippingFee };
};

export default calcTotals;
