import express from 'express';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';
import { logAction, ACTIONS } from '../services/auditLogger.js';

const router = express.Router();

// Apply admin protection to all routes here
router.use(verifyToken);
router.use(requireAdmin);

// GET /api/admin/users - List all users
router.get('/users', async (req, res) => {
    try {
        const users = await User.find({}, '-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// POST /api/admin/users - Create new user
router.post('/users', async (req, res) => {
    try {
        const { userId, name, email, password, role } = req.body;

        if (!userId || !password || !name) {
            return res.status(400).json({ error: 'Required fields missing' });
        }

        const existing = await User.findOne({ 
            $or: [{ userId }, { email }] 
        });
        if (existing) {
            return res.status(400).json({ error: 'User ID or Email already exists' });
        }

        const newUser = new User({
            userId,
            name,
            email,
            password,
            role,
            createdBy: req.user.userId
        });

        await newUser.save();

        await logAction({
            userId: req.user.userId,
            userRole: req.user.role,
            action: ACTIONS.CREATE_USER,
            description: `Created new user ${userId}`,
            metadata: { targetUserId: userId, role },
            ipAddress: req.ip
        });

        res.status(201).json({ 
            message: 'User created successfully',
            user: { userId, name, role }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create user', details: error.message });
    }
});

// PUT /api/admin/users/:id/toggle-status - Activate/Deactivate user
router.put('/users/:id/toggle-status', async (req, res) => {
    try {
        const user = await User.findOne({ userId: req.params.id });
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        if (user.userId === req.user.userId) {
            return res.status(400).json({ error: 'Cannot disable your own account' });
        }

        user.isActive = !user.isActive;
        await user.save();

        await logAction({
            userId: req.user.userId,
            userRole: req.user.role,
            action: ACTIONS.UPDATE_USER,
            description: `${user.isActive ? 'Activated' : 'Deactivated'} user ${user.userId}`,
            metadata: { targetUserId: user.userId, isActive: user.isActive },
            ipAddress: req.ip
        });

        res.json({ message: `User ${user.isActive ? 'activated' : 'deactivated'}`, isActive: user.isActive });
    } catch (error) {
        res.status(500).json({ error: 'Operation failed' });
    }
});

// GET /api/admin/audit-logs - View audit logs
router.get('/audit-logs', async (req, res) => {
    try {
        const { action, userId, page = 1, limit = 50 } = req.query;
        const query = {};
        
        if (action) query.action = action;
        if (userId) query.userId = userId;

        const logs = await AuditLog.find(query)
            .sort({ timestamp: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const total = await AuditLog.countDocuments(query);

        res.json({
            logs,
            pagination: {
                total,
                page: Number(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});

// GET /api/admin/audit-logs/exports - View export events (Chain of Custody)
router.get('/audit-logs/exports', async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const query = { action: { $in: [ACTIONS.EXPORT_FILE, ACTIONS.EXPORT_REPORT] } };

        const logs = await AuditLog.find(query)
            .sort({ timestamp: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const total = await AuditLog.countDocuments(query);

        res.json({
            logs,
            pagination: {
                total,
                page: Number(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch export logs' });
    }
});

export default router;
