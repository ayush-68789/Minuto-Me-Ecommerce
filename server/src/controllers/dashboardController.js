// Owner: M4
import Product from '../models/Product.js';
import Store from '../models/Store.js';
import { designUpdate } from './storeController.js';
import Order from '../models/Order.js';
import { resolveMyStore } from './storeController.js';

// The logged-in owner's store -- never trust a store id sent by the client
const resolveStore = resolveMyStore;

// GET /api/dashboard/stats
export const getStats = async (req, res, next) => {
  try {
    const store = await resolveStore(req);
    if (!store) {
      return res.status(404).json({ message: 'No store found for this account' });
    }

    const storeId = store._id;

    const [
      totalProducts,
      activeProducts,
      inactiveProducts,
      outOfStockProducts,
      lowStockProducts,
      recentProducts,
      orders,
      categories,
    ] = await Promise.all([
      Product.countDocuments({ store: storeId }),
      Product.countDocuments({ store: storeId, isActive: true }),
      Product.countDocuments({ store: storeId, isActive: false }),
      Product.countDocuments({ store: storeId, stock: 0 }),
      Product.countDocuments({ store: storeId, stock: { $gt: 0, $lte: 5 } }),
      Product.find({ store: storeId }).sort({ createdAt: -1 }).limit(5).lean(),
      Order.find({ store: storeId }).sort({ createdAt: -1 }).limit(10).lean(),
      Product.distinct('category', { store: storeId }),
    ]);

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, ord) => {
      if (ord.status !== 'cancelled') {
        return sum + (ord.total || 0);
      }
      return sum;
    }, 0);

    const pendingOrders = orders.filter((o) => o.status === 'pending').length;

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
        lowStockProducts,
        outOfStockProducts,
        totalOrders,
        totalRevenue,
        pendingOrders,
        categoryCount: categories.filter(Boolean).length,
      },
      recentProducts,
      recentOrders: orders.slice(0, 5),
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
      return res.status(404).json({ message: 'Store not found' });
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
      return res.status(404).json({ message: 'Store not found' });
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
      store.features = {
        ...store.features?.toObject?.() || store.features || {},
        ...features,
      };
    }

    if (typeof req.body.template === 'string') store.template = req.body.template.trim().slice(0, 30);
    for (const [path, value] of Object.entries(designUpdate(req.body))) store.set(path, value);

    await store.save();

    res.json({
      success: true,
      message: 'Store settings updated successfully',
      store,
    });
  } catch (err) {
    next(err);
  }
};
