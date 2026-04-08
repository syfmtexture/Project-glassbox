import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Middleware to verify JWT token
 */
export const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // Optional: for legacy routes that allow anonymous but log if user is present
            req.user = null;
            return next();
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-glassbox');
        
        const user = await User.findOne({ userId: decoded.userId });
        if (!user || !user.isActive) {
            return res.status(401).json({ error: 'Unauthorized or account disabled' });
        }

        req.user = {
            userId: user.userId,
            name: user.name,
            role: user.role
        };
        next();
    } catch (error) {
        console.error('Auth check failed:', error.message);
        return res.status(401).json({ error: 'Auth token expired or invalid' });
    }
};

/**
 * Middleware to strictly require authentication
 */
export const requireAuth = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    next();
};

/**
 * Middleware to require admin role
 */
export const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    next();
};
