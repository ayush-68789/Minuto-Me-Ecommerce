// Owner: M1
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import Store from '../models/Store.js';
import Review from '../models/Review.js';
import Order from '../models/Order.js';
import deleteStoreData from '../utils/deleteStoreData.js';

const COOKIE_NAME = 'token';
const COOKIE_OPTIONS = {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
};

const hasJwtSecret = () => {
    return Boolean(process.env.JWT_SECRET && process.env.JWT_SECRET !== 'change_me');
}

const sendUser = (res, user, status = 200) => {
    const token = generateToken(user._id);
    res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);
    return res.status(status).json({
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            shippingAddress: user.shippingAddress,
            role: user.role,
            store: user.store,
            customerStore: user.customerStore || null,
        },
    });
}

const register = async (req, res, next, role) => {
    try {
        if (!hasJwtSecret())
        {
            return res.status(500).json({
                message: "Authentication is not configured",
                success: false,
            });
        }
        const body = req.body || {};
        const name = typeof body.name === 'string' ? body.name.trim() : '';
        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
        const password = body.password;
        if (!name || !email || typeof password !== 'string') {
            return res.status(400).json({
                message: "Name, email, and password are required",
                success: false,
            });
        }
        if (!/^\S+@\S+\.\S+$/.test(email)) {
            return res.status(400).json({
                message: "Enter a valid email address",
                success: false,
            });
        }
        if (name.length > 100 || email.length > 254) {
            return res.status(400).json({
                message: "Name or email is too long",
                success: false
            });
        }
        if (password.length < 8) {
            return res.status(400).json({
                    message: "Password must be at least 8 characters",
                    success: false,
            });
        }
        let customerDetails = {};
        if (role === 'customer') {
            const storeSlug = typeof body.storeSlug === 'string' ? body.storeSlug.trim().toLowerCase() : '';
            const customerStore = storeSlug && await Store.findOne({ slug: storeSlug, status: 'active' }).select('_id');
            if (!customerStore) return res.status(404).json({ message: 'This store is unavailable for customer registration' });
            const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
            const address = body.shippingAddress || {};
            if (!/^\+?[\d\s-]{7,15}$/.test(phone)) return res.status(400).json({ message: 'Enter a valid phone number' });
            const requiredAddress = ['line1', 'city', 'state', 'postalCode', 'country'];
            if (requiredAddress.some((key) => typeof address[key] !== 'string' || !address[key].trim())) {
                return res.status(400).json({ message: 'Complete your delivery address to create an account' });
            }
            if (address.line1.trim().length < 3 || address.city.trim().length < 2 || address.state.trim().length < 2 || !/^[A-Za-z\d\s-]{3,10}$/.test(address.postalCode.trim())) {
                return res.status(400).json({ message: 'Enter a valid delivery address and postal code' });
            }
            customerDetails = {
                customerStore: customerStore._id,
                phone,
                shippingAddress: {
                    line1: address.line1.trim(),
                    line2: typeof address.line2 === 'string' ? address.line2.trim() : '',
                    city: address.city.trim(),
                    state: address.state.trim(),
                    postalCode: address.postalCode.trim(),
                    country: address.country.trim() || 'India',
                },
            };
        }
        if (Buffer.byteLength(password, 'utf8') > 72) {
            return res.status(400).json({
                    message: "Password must be 72 bytes or fewer",
                    success: false,
            });
        }
        const user = await User.create({
            name,
            email,
            password,
            role,
            ...customerDetails,
        });

        return sendUser(res, user, 201);
    }
    catch (err) {
        if (err.code === 11000) return res
            .status(409)
            .json({
                message: "An account with this email already exists",
                success: false,
            });
        return next(err);
    }
};

const signup = (req, res, next) => register(req, res, next, 'client');
const signupCustomer = (req, res, next) => register(req, res, next, 'customer');

const login = async (req, res, next, audience = 'owner') => {
    try {
        if (!hasJwtSecret()) return res
            .status(500)
            .json({
                message: "Authentication is not configured",
                success: false,
            });
        const body = req.body || {};
        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
        const password = body.password;
        if (!email || typeof password !== 'string' || !password) {
            return res
                .status(400)
                .json({
                    message: "Email and password are required",
                    success: false,
                });
        }

        const storeSlug = audience === 'customer' && typeof body.storeSlug === 'string' ? body.storeSlug.trim().toLowerCase() : '';
        const customerStore = audience === 'customer' && storeSlug ? await Store.findOne({ slug: storeSlug, status: 'active' }).select('_id') : null;
        if (audience === 'customer' && !customerStore) return res.status(404).json({ message: 'This store is unavailable for customer sign in' });
        let user;
        if (audience === 'customer') {
            user = await User.findOne({ email, role: 'customer', customerStore: customerStore._id }).select('+password');
            // Bind legacy customer accounts to the first store they sign in to after this migration.
            if (!user) user = await User.findOne({ email, role: 'customer', customerStore: null }).select('+password');
        } else {
            user = await User.findOne({ email, role: { $in: ['client', 'admin'] } }).select('+password');
        }
        if (!user || !(await user.matchPassword(password))) {
            return res
                .status(401)
                .json({ message: "Invalid email or password", success: false });
        }
        const allowed = audience === 'customer' ? user.role === 'customer' : ['client', 'admin'].includes(user.role);
        if (!allowed) return res.status(403).json({ message: audience === 'customer' ? 'Use a customer account to sign in to this store' : 'Use the store owner login for this account' });
        if (audience === 'customer') {
            if (String(user.customerStore) !== String(customerStore._id)) { user.customerStore = customerStore._id; await user.save(); }
        }
        return sendUser(res, user);
    }
    catch (err) {
        return next(err);
    }
};

const customerLogin = (req, res, next) => login(req, res, next, 'customer');

const logout = (req, res) => {
    res.clearCookie(COOKIE_NAME, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
    });
    return res.status(200).json({ message: "Logged out", success: true });
};

const getCurrentUser = (req, res) => {
    res.json({
        user: { id: req.user._id, name: req.user.name, email: req.user.email, phone: req.user.phone || '', shippingAddress: req.user.shippingAddress, role: req.user.role, store: req.user.store, customerStore: req.user.customerStore || null }
    })
};

const updateCustomerProfile = async (req, res, next) => {
    try {
        if (!['customer', 'client'].includes(req.user.role)) return res.status(403).json({ message: 'This account cannot be updated here' });
        const name = typeof req.body?.name === 'string' ? req.body.name.trim() : req.user.name;
        const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : req.user.email;
        if (name.length < 2 || name.length > 100) return res.status(400).json({ message: 'Name must be between 2 and 100 characters' });
        if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254) return res.status(400).json({ message: 'Enter a valid email address' });
        const duplicateFilter = { email, role: req.user.role, _id: { $ne: req.user._id } };
        if (req.user.role === 'customer') duplicateFilter.customerStore = req.user.customerStore;
        if (await User.exists(duplicateFilter)) return res.status(409).json({ message: 'An account with this email already exists' });
        req.user.name = name;
        req.user.email = email;
        if (req.user.role === 'customer') {
            const storeSlug = typeof req.body?.storeSlug === 'string' ? req.body.storeSlug.trim().toLowerCase() : '';
            const store = storeSlug && await Store.findOne({ slug: storeSlug, status: 'active' }).select('_id');
            if (!store || String(store._id) !== String(req.user.customerStore)) return res.status(403).json({ message: 'This customer account belongs to a different store' });
            const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';
            const address = req.body?.shippingAddress || {};
            if (!/^\+?[\d\s-]{7,15}$/.test(phone)) return res.status(400).json({ message: 'Enter a valid phone number' });
            if (['line1', 'city', 'state', 'postalCode', 'country'].some((key) => typeof address[key] !== 'string' || !address[key].trim())) {
                return res.status(400).json({ message: 'Complete your delivery address' });
            }
            if (address.line1.trim().length < 3 || address.city.trim().length < 2 || address.state.trim().length < 2 || !/^[A-Za-z\d\s-]{3,10}$/.test(address.postalCode.trim())) {
                return res.status(400).json({ message: 'Enter a valid delivery address and postal code' });
            }
            req.user.phone = phone;
            req.user.shippingAddress = {
                line1: address.line1.trim(),
                line2: typeof address.line2 === 'string' ? address.line2.trim() : '',
                city: address.city.trim(),
                state: address.state.trim(),
                postalCode: address.postalCode.trim(),
                country: address.country.trim() || 'India',
            };
        }
        const user = await req.user.save();
        return res.json({ user: { id: user._id, name: user.name, email: user.email, phone: user.phone, shippingAddress: user.shippingAddress, role: user.role, store: user.store, customerStore: user.customerStore || null } });
    } catch (err) { return next(err); }
};

const deleteCustomerAccount = async (req, res, next) => {
    try {
        if (!['customer', 'client'].includes(req.user.role)) return res.status(403).json({ message: 'This account cannot be deleted here' });
        if (req.user.role === 'customer') {
            const storeSlug = typeof req.query.storeSlug === 'string' ? req.query.storeSlug.trim().toLowerCase() : '';
            const store = storeSlug && await Store.findOne({ slug: storeSlug, status: 'active' }).select('_id');
            if (!store || String(store._id) !== String(req.user.customerStore)) return res.status(403).json({ message: 'This customer account belongs to a different store' });
            await Promise.all([
                Order.updateMany({ customer: req.user._id }, { $set: { customer: null } }),
                Review.deleteMany({ customer: req.user._id }),
            ]);
        } else {
            const stores = await Store.find({ owner: req.user._id }).select('_id');
            for (const store of stores) await deleteStoreData(store._id);
        }
        await User.deleteOne({ _id: req.user._id });
        res.clearCookie(COOKIE_NAME, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
        return res.json({ success: true, message: 'Account and associated data were deleted' });
    } catch (err) {
        return next(err);
    }
};

export {
    signup,
    signupCustomer,
    login,
    customerLogin,
    logout,
    getCurrentUser,
    updateCustomerProfile,
    deleteCustomerAccount,
};
