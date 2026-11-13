// Owner: Member 5 — MVC model for orders.
// Minimal in-memory version added by Member 1 so order ownership checks can be built and
// demonstrated. M5 extends it with totals, order state and tenant IDs.
const ordersById = new Map();
let nextOrderNumber = 1;

const orderModel = {
  create({ customerId, items }) {
    const order = {
      // Sequential on purpose: IDs are guessable, so access control must not rely on them.
      id: String(nextOrderNumber++),
      customerId,
      items: items.map(({ productId, quantity }) => ({ productId, quantity })),
      status: 'placed',
      createdAt: new Date().toISOString(),
    };
    ordersById.set(order.id, order);
    return order;
  },

  findById(id) {
    return ordersById.get(id) || null;
  },

  listByCustomer(customerId) {
    return [...ordersById.values()].filter((order) => order.customerId === customerId);
  },

  list() {
    return [...ordersById.values()];
  },
};

export default orderModel;
