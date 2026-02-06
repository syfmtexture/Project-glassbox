import express from 'express';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
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
