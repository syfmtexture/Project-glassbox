import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import Case from '../models/Case.js';
import Evidence from '../models/Evidence.js';
import { parseFile, saveEvidenceToDatabase } from '../services/fileParser.js';

const router = express.Router({ mergeParams: true });

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const caseDir = path.join(uploadsDir, req.params.caseId);
        if (!fs.existsSync(caseDir)) {
            fs.mkdirSync(caseDir, { recursive: true });
        }
        cb(null, caseDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['.csv', '.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024  // 100MB max
    }
});

// Upload status tracking (in-memory for simplicity)
const uploadJobs = new Map();

/**
 * POST /api/cases/:caseId/upload
 * Upload forensic export file
 */
router.post('/', upload.single('file'), async (req, res, next) => {
    try {
        const { caseId } = req.params;

        // Validate case exists
        const caseDoc = await Case.findById(caseId);
        if (!caseDoc) {
            // Clean up uploaded file
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(404).json({
                success: false,
                error: { message: 'Case not found' }
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: { message: 'No file uploaded' }
            });
        }

        // Create upload job
        const jobId = uuidv4();
        const jobStatus = {
            id: jobId,
            caseId,
            filename: req.file.originalname,
            status: 'processing',
            progress: 0,
            totalRecords: 0,
            savedRecords: 0,
            startedAt: new Date(),
            error: null
        };
        uploadJobs.set(jobId, jobStatus);

        // Return immediately with job ID
        res.status(202).json({
            success: true,
            message: 'File upload started',
            data: {
                jobId,
                filename: req.file.originalname,
                size: req.file.size
            }
        });

        // Process file in background
        processUpload(jobId, caseId, caseDoc, req.file).catch(error => {
            console.error('Upload processing error:', error);
            const job = uploadJobs.get(jobId);
            if (job) {
                job.status = 'failed';
                job.error = error.message;
            }
        });

    } catch (error) {
        next(error);
    }
});

/**
 * Process uploaded file asynchronously
 */
async function processUpload(jobId, caseId, caseDoc, file) {
    const job = uploadJobs.get(jobId);

    try {
        // Parse file
        job.status = 'parsing';
        const parseResult = await parseFile(file.path, caseId, (count) => {
            job.progress = count;
        });

        job.totalRecords = parseResult.records.length;
        job.status = 'saving';

        // Save to database
        const savedCount = await saveEvidenceToDatabase(parseResult.records);
        job.savedRecords = savedCount;

        // Update case
        caseDoc.uploadedFiles.push({
            filename: file.filename,
            originalName: file.originalname,
            mimetype: file.mimetype,
            size: file.size
        });
        caseDoc.evidenceCount = await Evidence.countDocuments({ caseId });
        await caseDoc.save();

        job.status = 'completed';
        job.completedAt = new Date();

    } catch (error) {
        job.status = 'failed';
        job.error = error.message;

        // Optionally clean up file on failure
        try {
            fs.unlinkSync(file.path);
        } catch (e) {
            console.error('Failed to clean up file:', e);
        }
    }
}

/**
 * GET /api/cases/:caseId/upload/:jobId/status
 * Check upload job status
 */
router.get('/:jobId/status', (req, res) => {
    const job = uploadJobs.get(req.params.jobId);

    if (!job) {
        return res.status(404).json({
            success: false,
            error: { message: 'Upload job not found' }
        });
    }

    res.json({
        success: true,
        data: job
    });
});

/**
 * GET /api/cases/:caseId/upload/files
 * List uploaded files for case
 */
router.get('/files', async (req, res, next) => {
    try {
        const caseDoc = await Case.findById(req.params.caseId).select('uploadedFiles');

        if (!caseDoc) {
            return res.status(404).json({
                success: false,
                error: { message: 'Case not found' }
            });
        }

        res.json({
            success: true,
            data: caseDoc.uploadedFiles
        });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/cases/:caseId/upload/files/:fileId
 * Remove uploaded file reference (doesn't delete parsed evidence)
 */
router.delete('/files/:fileId', async (req, res, next) => {
    try {
        const caseDoc = await Case.findById(req.params.caseId);

        if (!caseDoc) {
            return res.status(404).json({
                success: false,
                error: { message: 'Case not found' }
            });
        }

        const fileIndex = caseDoc.uploadedFiles.findIndex(
            f => f._id.toString() === req.params.fileId
        );

        if (fileIndex === -1) {
            return res.status(404).json({
                success: false,
                error: { message: 'File not found' }
            });
        }

        const file = caseDoc.uploadedFiles[fileIndex];

        // Try to delete physical file
        try {
            const filePath = path.join(uploadsDir, req.params.caseId, file.filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (e) {
            console.error('Failed to delete file:', e);
        }

        // Remove from case document
        caseDoc.uploadedFiles.splice(fileIndex, 1);
        await caseDoc.save();

        res.json({
            success: true,
            message: 'File removed'
        });
    } catch (error) {
        next(error);
    }
});

// Error handler for multer errors
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: { message: 'File too large. Maximum size is 100MB.' }
            });
        }
    }
    next(error);
});

export default router;
