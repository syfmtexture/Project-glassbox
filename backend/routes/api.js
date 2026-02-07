import express from 'express';
import mongoose from 'mongoose';
import casesRouter from './cases.js';
import evidenceRouter from './evidence.js';
import uploadRouter from './upload.js';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'Glassbox Forensic Triage API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
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

// ===== Case Management Routes =====
router.use('/cases', casesRouter);

// ===== Evidence Routes (nested under cases) =====
router.use('/cases/:caseId/evidence', evidenceRouter);

// ===== File Upload Routes (nested under cases) =====
router.use('/cases/:caseId/upload', uploadRouter);

export default router;
