// Owner: M1
import Store from '../models/Store.js';

const ownershipMiddleware = async (req, res, next) => {
    try {
        if (!req.user)
        {
            return res.status(401).json({
                message: 'Authentication required',
                success : false
            });
        }
        const requestedStoreId = req.params.storeId || (req.body && req.body.storeId);
        const filter = { owner: req.user._id };
        if (requestedStoreId) filter._id = requestedStoreId;

        const store = await Store.findOne(filter);
        if (!store)
        {
            return res.status(404).json({
                message: "Store not found",
                success: false,
            });
        }
        req.store = store;
        return next();
    }
    catch (err) {
        if (err.name === 'CastError') return res.status(404).json({ message: 'Store not found' });
        return next(err);
    }
};

export default ownershipMiddleware;
