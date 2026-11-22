// Owner: M4 (Product Management & Dashboard)
import Product from '../models/Product.js';
import Store from '../models/Store.js';
import Order from '../models/Order.js';
import { designUpdate, resolveMyStore } from './storeController.js';
import { logAudit } from '../utils/auditLogger.js';

// The logged-in owner's store -- never trust a store id sent by the client
const resolveStore = resolveMyStore;

// GET /api/dashboard/stats
// Comprehensive dashboard metrics covering products, inventory, orders, revenue, and store details
export const getStats = async (req, res, next) => {
  try {
    const store = await resolveStore(req);
    if (!store) {
      return res.status(404).json({ success: false, message: 'No store found for this account' });
    }

    const storeId = store._id;

    // Fetch product metrics, order metrics, and category distincts concurrently
    const [
      totalProducts,
      activeProducts,
      inactiveProducts,
      outOfStockProducts,
      lowStockProducts,
      recentProducts,
      orders,
      categories,
      inventoryAgg,
    ] = await Promise.all([
      Product.countDocuments({ store: storeId }),
      Product.countDocuments({ store: storeId, isActive: true }),
      Product.countDocuments({ store: storeId, isActive: false }),
      Product.countDocuments({ store: storeId, stock: 0 }),
      Product.countDocuments({ store: storeId, stock: { $gt: 0, $lte: 5 } }),
      Product.find({ store: storeId }).sort({ createdAt: -1 }).limit(5).lean(),
      Order.find({ store: storeId }).sort({ createdAt: -1 }).limit(100).lean(),
      Product.distinct('category', { store: storeId }),
      Product.aggregate([
        { $match: { store: storeId } },
        {
          $group: {
            _id: null,
            totalUnits: { $sum: '$stock' },
            inventoryValuation: { $sum: { $multiply: ['$price', '$stock'] } },
          },
        },
      ]),
    ]);

    const inStockProducts = Math.max(0, totalProducts - outOfStockProducts);
    const totalUnits = inventoryAgg[0]?.totalUnits || 0;
    const inventoryValuation = inventoryAgg[0]?.inventoryValuation || 0;

    // Order status counters
    const totalOrders = orders.length;
    let pendingOrders = 0;
    let confirmedOrders = 0;
    let shippedOrders = 0;
    let deliveredOrders = 0;
    let cancelledOrders = 0;
    let totalRevenue = 0;
    let nonCancelledOrdersCount = 0;

    for (const ord of orders) {
      switch (ord.status) {
        case 'pending':
          pendingOrders++;
          totalRevenue += ord.total || 0;
          nonCancelledOrdersCount++;
          break;
        case 'confirmed':
          confirmedOrders++;
          totalRevenue += ord.total || 0;
          nonCancelledOrdersCount++;
          break;
        case 'shipped':
          shippedOrders++;
          totalRevenue += ord.total || 0;
          nonCancelledOrdersCount++;
          break;
        case 'delivered':
          deliveredOrders++;
          totalRevenue += ord.total || 0;
          nonCancelledOrdersCount++;
          break;
        case 'cancelled':
          cancelledOrders++;
          break;
        default:
          break;
      }
    }

    const averageOrderValue = nonCancelledOrdersCount > 0
      ? Math.round((totalRevenue / nonCancelledOrdersCount) * 100) / 100
      : 0;

    // Top low-stock items needing restock attention
    const lowStockAlerts = await Product.find({
      store: storeId,
      stock: { $lte: 5 },
    })
      .sort({ stock: 1 })
      .limit(5)
      .select('name price stock category images isActive')
      .lean();

    res.json({
      success: true,
      store: {
        id: store._id,
        businessName: store.businessName,
        slug: store.slug,
        category: store.category,
        description: store.description,
        branding: store.branding,
        currency: store.currency || 'INR',
        contact: store.contact,
        features: store.features,
        status: store.status,
      },
      stats: {
        totalProducts,
        activeProducts,
        inactiveProducts,
        inStockProducts,
        lowStockProducts,
        outOfStockProducts,
        totalUnits,
        inventoryValuation,
        totalOrders,
        pendingOrders,
        confirmedOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        totalRevenue,
        averageOrderValue,
        categoryCount: categories.filter(Boolean).length,
      },
      lowStockAlerts,
      recentProducts,
      recentOrders: orders.slice(0, 5),
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/dashboard/inventory
// Dedicated inventory breakdown endpoint
export const getInventorySummary = async (req, res, next) => {
  try {
    const store = await resolveStore(req);
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    const storeId = store._id;

    const [
      totalProducts,
      outOfStockCount,
      lowStockCount,
      inventoryAgg,
      lowStockProducts,
      outOfStockProducts,
      categoryStats,
    ] = await Promise.all([
      Product.countDocuments({ store: storeId }),
      Product.countDocuments({ store: storeId, stock: 0 }),
      Product.countDocuments({ store: storeId, stock: { $gt: 0, $lte: 5 } }),
      Product.aggregate([
        { $match: { store: storeId } },
        {
          $group: {
            _id: null,
            totalStockUnits: { $sum: '$stock' },
            totalValuation: { $sum: { $multiply: ['$price', '$stock'] } },
          },
        },
      ]),
      Product.find({ store: storeId, stock: { $gt: 0, $lte: 5 } })
        .sort({ stock: 1 })
        .limit(10)
        .lean(),
      Product.find({ store: storeId, stock: 0 })
        .sort({ updatedAt: -1 })
        .limit(10)
        .lean(),
      Product.aggregate([
        { $match: { store: storeId } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            totalStock: { $sum: '$stock' },
            valuation: { $sum: { $multiply: ['$price', '$stock'] } },
          },
        },
        { $sort: { count: -1 } },
      ]),
    ]);

    const totalStockUnits = inventoryAgg[0]?.totalStockUnits || 0;
    const totalValuation = inventoryAgg[0]?.totalValuation || 0;
    const inStockCount = Math.max(0, totalProducts - outOfStockCount);

    res.json({
      success: true,
      summary: {
        totalProducts,
        inStockCount,
        lowStockCount,
        outOfStockCount,
        totalStockUnits,
        totalValuation,
      },
      lowStockProducts,
      outOfStockProducts,
      categoryBreakdown: categoryStats.map((c) => ({
        category: c._id || 'Uncategorized',
        productCount: c.count,
        totalStock: c.totalStock,
        valuation: c.valuation,
      })),
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/dashboard/store
export const getStoreDetails = async (req, res, next) => {
  try {
    const store = await resolveStore(req);
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    const [agg] = await Store.aggregate([
      { $match: { _id: store._id } },
      { $project: { n: { $size: { $ifNull: ['$subscribers', []] } } } },
    ]);
    res.json({ success: true, store, subscriberCount: agg?.n || 0 });
  } catch (err) {
    next(err);
  }
};

// PUT /api/dashboard/store
export const updateStoreDetails = async (req, res, next) => {
  try {
    const store = await resolveStore(req);
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    const {
      businessName,
      category,
      description,
      branding,
      currency,
      contact,
      features,
      status,
    } = req.body;

    if (businessName) store.businessName = businessName.trim();
    if (category) store.category = category.trim();
    if (description !== undefined) store.description = description;
    if (currency) store.currency = currency;
    if (status) store.status = status;

    if (branding) {
      store.branding = {
        ...store.branding?.toObject?.() || store.branding || {},
        ...branding,
      };
    }

    if (contact) {
      store.contact = {
        ...store.contact?.toObject?.() || store.contact || {},
        ...contact,
      };
    }

    if (features) {
      const cleanFeatures = { ...features };
      store.features = {
        ...store.features?.toObject?.() || store.features || {},
        ...cleanFeatures,
      };
    }

    if (typeof req.body.template === 'string') store.template = req.body.template.trim().slice(0, 30);
    for (const [path, value] of Object.entries(designUpdate(req.body))) store.set(path, value);

    await store.save();

    await logAudit({
      req,
      storeId: store._id,
      action: 'STORE_SETTINGS_UPDATE',
      resourceType: 'Store',
      resourceId: store._id,
      details: { businessName: store.businessName, category: store.category },
    });

    res.json({
      success: true,
      message: 'Store settings updated successfully',
      store,
    });
  } catch (err) {
    next(err);
  }
};
