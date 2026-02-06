import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Database connection test endpoint
router.get('/db-test', (req, res) => {
    try {
        const dbState = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting'
        };

        const state = mongoose.connection.readyState;

        res.status(200).json({
            database: {
                status: dbState[state],
                name: mongoose.connection.name || 'N/A',
                host: mongoose.connection.host || 'N/A'
            },
            message: state === 1 ? 'Database connected successfully' : 'Database not connected'
        });
    } catch (error) {
        res.status(500).json({
            error: 'Database test failed',
            details: error.message
        });
    }
});

// Sample data endpoint
router.get('/data', (req, res) => {
    res.status(200).json({
        message: 'Sample data from backend',
        data: [
            { id: 1, name: 'Item 1', value: 100 },
            { id: 2, name: 'Item 2', value: 200 },
            { id: 3, name: 'Item 3', value: 300 }
        ]
    });
});

// POST example - Echo endpoint
router.post('/echo', (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({
            error: 'Message is required'
        });
    }

    res.status(200).json({
        echo: message,
        receivedAt: new Date().toISOString()
    });
});

export default router;
