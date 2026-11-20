// Owner: M1
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

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
            role: user.role,
            store: user.store
        },
    });
}

const signup = async (req, res, next) => {
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
            role: 'client'
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

const login = async (req, res, next) => {
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

        const user = await User.findOne({ email }).select('+password');
        if (!user || !(await user.matchPassword(password))) {
            return res
                .status(401)
                .json({ message: "Invalid email or password", success: false });
        }
        return sendUser(res, user);
    }
    catch (err) {
        return next(err);
    }
};

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
        user: { id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role, store: req.user.store }
    })
};

export {
    signup,
    login,
    logout,
    getCurrentUser,
};
