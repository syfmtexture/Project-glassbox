import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import apiRoutes from './routes/api.js';
import errorHandler from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], // Vite dev server
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', apiRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to Glassbox Forensic Triage API',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            database: '/api/db-test',
            cases: {
                list: 'GET /api/cases',
                create: 'POST /api/cases',
                detail: 'GET /api/cases/:id',
                update: 'PUT /api/cases/:id',
                delete: 'DELETE /api/cases/:id',
                analyze: 'POST /api/cases/:id/analyze',
                stats: 'GET /api/cases/:id/stats',
                timeline: 'GET /api/cases/:id/timeline'
            },
            evidence: {
                list: 'GET /api/cases/:caseId/evidence',
                highPriority: 'GET /api/cases/:caseId/evidence/high-priority',
                detail: 'GET /api/cases/:caseId/evidence/:id',
                update: 'PUT /api/cases/:caseId/evidence/:id'
            },
            upload: {
                upload: 'POST /api/cases/:caseId/upload',
                status: 'GET /api/cases/:caseId/upload/:jobId/status'
            }
        }
    });
});

// Error handling middleware (should be last)
app.use(errorHandler);

// Connect to Database and Start server
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
});
