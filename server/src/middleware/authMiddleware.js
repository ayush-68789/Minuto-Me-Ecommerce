// Owner: M1
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const authMiddleware = async(req, res, next) => {
    try {
        const authorization = req.headers.authorization;
        const bearer = authorization && authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : null;

        const token = bearer || req.cookies?.token;
        if (!token)
        {
            return res.status(401).json({
                message: "Authentication required",
                success: false,
            });
        }
        if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'change_me')
        {
            return res.status(500).json({
                message: "Authentication is not configured",
                success: false,
            });
        }

        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(payload.id);
        if (!user)
        {
            return res.status(401).json({
                message: "Invalid or expired session",
                success: false,
            });
        }
        req.user = user;
        return next();
    }
    catch (err) {
        if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
            return res.status(401).json({
                message: 'Invalid or expired session',
                success: false
            });
        }
        return next(err);
    }
};

export default authMiddleware;
