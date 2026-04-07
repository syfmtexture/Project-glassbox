import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { logAction, ACTIONS } from '../services/auditLogger.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { userId, password } = req.body;

        if (!userId || !password) {
            return res.status(400).json({ error: 'UserID and password required' });
        }

        const user = await User.findOne({ userId });
        if (!user || !user.isActive) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Create JWT
        const token = jwt.sign(
            { userId: user.userId, role: user.role },
            process.env.JWT_SECRET || 'fallback-secret-glassbox',
            { expiresIn: '8h' }
        );

        // Log action
        await logAction({
            userId: user.userId,
            userRole: user.role,
            action: ACTIONS.LOGIN,
            description: `User ${user.userId} logged in`,
            ipAddress: req.ip
        });

        res.json({
            token,
            user: {
                userId: user.userId,
                name: user.name,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Login failed', details: error.message });
    }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
    // Stateless JWT, client just clears it, but we log the intent if possible
    const { userId } = req.body;
    if (userId) {
        await logAction({
            userId,
            action: ACTIONS.LOGOUT,
            description: `User ${userId} logged out`,
            ipAddress: req.ip
        });
    }
    res.json({ message: 'Logged out successfully' });
});

export default router;
