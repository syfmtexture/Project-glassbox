import express from 'express';
import Case from '../models/Case.js';
import Evidence from '../models/Evidence.js';
import AnalysisJob from '../models/AnalysisJob.js';
import { startAnalysis, getJobStatus } from '../services/aiAnalyzer.js';
import { getCaseStats, getTemporalDistribution, analyzeContactNetwork } from '../services/patternDetector.js';
import { verifyToken } from '../middleware/auth.js';
import { logAction, ACTIONS } from '../services/auditLogger.js';

const router = express.Router();

// Apply token verification to all case routes
router.use(verifyToken);

/**
 * GET /api/cases
 * List all cases with optional filters
 */
router.get('/', async (req, res, next) => {
    try {
        const { status, search, page = 1, limit = 20 } = req.query;

        const query = {};
        if (status) query.status = status;
        if (search) {
            query.$text = { $search: search };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [cases, total] = await Promise.all([
            Case.find(query)
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Case.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: cases,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/cases
 * Create a new case
 */
router.post('/', async (req, res, next) => {
    try {
        const { caseName, caseNumber, investigator, description, deviceInfo } = req.body;

        if (!caseName) {
            return res.status(400).json({
                success: false,
                error: { message: 'Case name is required' }
            });
        }

        const newCase = await Case.create({
            caseName,
            caseNumber,
            investigator,
            description,
            deviceInfo
        });

        // Audit Log
        if (req.user) {
            await logAction({
                userId: req.user.userId,
                userRole: req.user.role,
                action: ACTIONS.CREATE_CASE,
                description: `Created case: ${caseName} (${caseNumber || 'No number'})`,
                metadata: { caseId: newCase._id, caseName },
                ipAddress: req.ip
            });
        }

        res.status(201).json({
            success: true,
            data: newCase
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                error: { message: 'Case number already exists' }
            });
        }
        next(error);
    }
});

/**
 * GET /api/cases/:id
 * Get case details
 */
router.get('/:id', async (req, res, next) => {
    try {
        const caseDoc = await Case.findById(req.params.id);

        if (!caseDoc) {
            return res.status(404).json({
                success: false,
                error: { message: 'Case not found' }
            });
        }

        // Optional Audit for viewing sensitive case data
        if (req.user) {
            await logAction({
                userId: req.user.userId,
                userRole: req.user.role,
                action: ACTIONS.VIEW_CASE,
                description: `Viewed case: ${caseDoc.caseName}`,
                metadata: { caseId: caseDoc._id },
                ipAddress: req.ip
            });
        }

        res.json({
            success: true,
            data: caseDoc
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/cases/:id
 * Update case details
 */
router.put('/:id', async (req, res, next) => {
    try {
        const { caseName, caseNumber, investigator, description, deviceInfo, status } = req.body;

        const caseDoc = await Case.findByIdAndUpdate(
            req.params.id,
            { caseName, caseNumber, investigator, description, deviceInfo, status },
            { new: true, runValidators: true }
        );

        if (!caseDoc) {
            return res.status(404).json({
                success: false,
                error: { message: 'Case not found' }
            });
        }

        // Audit Log
        if (req.user) {
            await logAction({
                userId: req.user.userId,
                userRole: req.user.role,
                action: ACTIONS.UPDATE_CASE,
                description: `Updated case: ${caseDoc.caseName}`,
                metadata: { caseId: caseDoc._id, updates: req.body },
                ipAddress: req.ip
            });
        }

        res.json({
            success: true,
            data: caseDoc
        });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/cases/:id
 * Delete case and all associated evidence
 */
router.delete('/:id', async (req, res, next) => {
    try {
        const caseDoc = await Case.findById(req.params.id);

        if (!caseDoc) {
            return res.status(404).json({
                success: false,
                error: { message: 'Case not found' }
            });
        }

        const caseName = caseDoc.caseName;

        // Delete all associated evidence
        await Evidence.deleteMany({ caseId: req.params.id });

        // Delete all analysis jobs
        await AnalysisJob.deleteMany({ caseId: req.params.id });

        // Delete the case
        await Case.findByIdAndDelete(req.params.id);

        // Audit Log
        if (req.user) {
            await logAction({
                userId: req.user.userId,
                userRole: req.user.role,
                action: ACTIONS.DELETE_CASE,
                description: `Deleted case: ${caseName}`,
                metadata: { caseId: req.params.id, caseName },
                ipAddress: req.ip
            });
        }

        res.json({
            success: true,
            message: 'Case and all associated data deleted'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/cases/:id/export
 * Export evidence as CSV (tracks Chain of Custody)
 */
router.get('/:id/export', async (req, res, next) => {
    try {
        const caseDoc = await Case.findById(req.params.id);
        if (!caseDoc) return res.status(404).json({ success: false, error: { message: 'Case not found' } });

        const evidence = await Evidence.find({ caseId: req.params.id }).sort({ timestamp: 1 });
        
        // Simple CSV generation
        const headers = 'Timestamp,Type,Source,Sender,Receiver,Content,Priority\n';
        const rows = evidence.map(e => {
            const date = e.timestamp ? new Date(e.timestamp).toISOString() : 'N/A';
            const content = (e.content || '').replace(/"/g, '""');
            return `"${date}","${e.type}","${e.source || ''}","${e.sender || ''}","${e.receiver || ''}","${content}","${e.priority || 'medium'}"`;
        }).join('\n');

        const csvContent = headers + rows;
        const filename = `${caseDoc.caseName.replace(/\s+/g, '_')}_Evidence_Export.csv`;

        // Audit logic - VERY IMPORTANT for chain of custody
        if (req.user) {
            await logAction({
                userId: req.user.userId,
                userRole: req.user.role,
                action: ACTIONS.EXPORT_FILE,
                description: `Exported evidence CSV for case: ${caseDoc.caseName}`,
                metadata: { 
                    caseId: caseDoc._id, 
                    filename, 
                    recordCount: evidence.length,
                    exportType: 'Evidence CSV'
                },
                ipAddress: req.ip
            });
        }

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.status(200).send(csvContent);
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/cases/:id/analyze
 * Start AI analysis for case evidence
 */
router.post('/:id/analyze', async (req, res, next) => {
    try {
        const { useLLM = true, batchSize = 10 } = req.body;

        const caseDoc = await Case.findById(req.params.id);
        if (!caseDoc) {
            return res.status(404).json({
                success: false,
                error: { message: 'Case not found' }
            });
        }

        const job = await startAnalysis(req.params.id, { useLLM, batchSize });

        res.status(202).json({
            success: true,
            message: 'Analysis job started',
            data: job
        });
    } catch (error) {
        if (error.message.includes('already running')) {
            return res.status(409).json({
                success: false,
                error: { message: error.message }
            });
        }
        next(error);
    }
});

/**
 * GET /api/cases/:id/analysis-status
 * Get analysis job status
 */
router.get('/:id/analysis-status', async (req, res, next) => {
    try {
        const jobs = await AnalysisJob.find({ caseId: req.params.id })
            .sort({ createdAt: -1 })
            .limit(5);

        res.json({
            success: true,
            data: jobs
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/cases/:id/stats
 * Get case statistics
 */
router.get('/:id/stats', async (req, res, next) => {
    try {
        const stats = await getCaseStats(req.params.id);

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/cases/:id/timeline
 * Get temporal distribution data
 */
router.get('/:id/timeline', async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        // Optional: End Date should include the end of the day to make it inclusive
        let adjustedEndDate = endDate;
        if (endDate) {
            const date = new Date(endDate);
            date.setHours(23, 59, 59, 999);
            adjustedEndDate = date.toISOString();
        }

        const timeline = await getTemporalDistribution(req.params.id, {
            startDate,
            endDate: adjustedEndDate
        });

        res.json({
            success: true,
            data: timeline
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/cases/:id/contacts
 * Get contact network analysis
 */
router.get('/:id/contacts', async (req, res, next) => {
    try {
        const { minMessages = 3, limit = 50 } = req.query;

        const contacts = await analyzeContactNetwork(req.params.id, {
            minMessages: parseInt(minMessages),
            limit: parseInt(limit)
        });

        res.json({
            success: true,
            data: contacts
        });
    } catch (error) {
        next(error);
    }
});

export default router;

