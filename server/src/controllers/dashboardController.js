// Owner: M2 - Products & Dashboard
import Product from '../models/Product.js';
import Store from '../models/Store.js';

/**
 * Get comprehensive dashboard metrics and overview for the merchant
 */
export const getDashboardSummary = async (req, res, next) => {
  try {
    const storeId =
      req.query.store ||
      req.query.storeId ||
      req.headers['x-store-id'] ||
      req.user?.store;

    let store = null;
    if (storeId) {
      store = await Store.findById(storeId);
    } else if (req.user) {
      store = await Store.findOne({ owner: req.user._id });
    }

    const filter = {};
    if (store) {
      filter.store = store._id;
    } else if (req.user && req.user.role !== 'admin') {
      filter.owner = req.user._id;
    }

    const [
      totalProducts,
      activeProducts,
      draftProducts,
      outOfStockProducts,
      lowStockProducts,
      recentProducts,
      categories,
    ] = await Promise.all([
      Product.countDocuments(filter),
      Product.countDocuments({ ...filter, status: 'active' }),
      Product.countDocuments({ ...filter, status: 'draft' }),
      Product.countDocuments({ ...filter, stock: 0 }),
      Product.find({ ...filter, stock: { $gt: 0, $lte: 5 } })
        .sort({ stock: 1 })
        .limit(5)
        .select('name price stock category imageUrl'),
      Product.find(filter)
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name price stock category status createdAt imageUrl'),
      Product.aggregate([
        { $match: filter },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 },
      ]),
    ]);

    // Calculate inventory valuation
    const valuationResult = await Product.aggregate([
      { $match: filter },
      { $group: { _id: null, totalValue: { $sum: { $multiply: ['$price', '$stock'] } } } },
    ]);
    const inventoryValuation = valuationResult[0]?.totalValue || 0;

    // Simulated weekly trend metrics for dashboard charts
    const salesTrends = [
      { day: 'Mon', revenue: 420, orders: 12 },
      { day: 'Tue', revenue: 680, orders: 18 },
      { day: 'Wed', revenue: 540, orders: 14 },
      { day: 'Thu', revenue: 920, orders: 25 },
      { day: 'Fri', revenue: 1150, orders: 31 },
      { day: 'Sat', revenue: 1480, orders: 42 },
      { day: 'Sun', revenue: 1210, orders: 35 },
    ];

    const totalRevenue = salesTrends.reduce((acc, curr) => acc + curr.revenue, 0);
    const totalOrders = salesTrends.reduce((acc, curr) => acc + curr.orders, 0);

    return res.status(200).json({
      success: true,
      store: store
        ? {
            id: store._id,
            name: store.name,
            slug: store.slug,
            category: store.category,
            currency: store.currency,
          }
        : null,
      stats: {
        totalProducts,
        activeProducts,
        draftProducts,
        outOfStockProducts,
        lowStockCount: lowStockProducts.length,
        inventoryValuation,
        totalRevenue,
        totalOrders,
        averageOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
      },
      lowStockAlerts: lowStockProducts,
      recentProducts,
      categories: categories.map((c) => ({ category: c._id || 'Uncategorized', count: c.count })),
      salesTrends,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * Get all low-stock items for alerting
 */
export const getLowStockAlerts = async (req, res, next) => {
  try {
    const storeId =
      req.query.store ||
      req.query.storeId ||
      req.headers['x-store-id'] ||
      req.user?.store;

    const filter = { stock: { $lte: 5 } };
    if (storeId) {
      filter.store = storeId;
    } else if (req.user && req.user.role !== 'admin') {
      filter.owner = req.user._id;
    }

    const items = await Product.find(filter)
      .sort({ stock: 1 })
      .select('name price stock category imageUrl status');

    return res.status(200).json({
      success: true,
      count: items.length,
      items,
    });
  } catch (err) {
    return next(err);
  }
};

export default {
  getDashboardSummary,
  getLowStockAlerts,
};
