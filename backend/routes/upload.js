import express from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import { GridFSBucket, ObjectId } from 'mongodb';
import { Readable } from 'stream';
import Case from '../models/Case.js';
import Evidence from '../models/Evidence.js';
import { parseCSVFromBuffer, parseExcelFromBuffer, saveEvidenceToDatabase } from '../services/fileParser.js';
import { extractTextFromImage, transcribeAudio } from '../services/mediaProcessor.js';

const router = express.Router({ mergeParams: true });

// GridFS bucket (initialized lazily)
let gridFSBucket = null;

function getGridFSBucket() {
    if (!gridFSBucket && mongoose.connection.db) {
        gridFSBucket = new GridFSBucket(mongoose.connection.db, {
            bucketName: 'uploads'
        });
    }
    return gridFSBucket;
}

// Configure multer for memory storage (files go to buffer, then to MongoDB)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['.csv', '.tsv', '.txt', '.xlsx', '.xls', '.png', '.jpg', '.jpeg', '.webp', '.mp3', '.ogg', '.wav', '.m4a', '.opus'];
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
 * Upload file buffer to GridFS
 */
async function uploadToGridFS(buffer, filename, metadata = {}) {
    const bucket = getGridFSBucket();
    if (!bucket) {
        throw new Error('MongoDB connection not ready');
    }

    return new Promise((resolve, reject) => {
        const uploadStream = bucket.openUploadStream(filename, {
            metadata
        });

        const readableStream = Readable.from(buffer);

        readableStream
            .pipe(uploadStream)
            .on('error', reject)
            .on('finish', () => {
                resolve({
                    fileId: uploadStream.id,
                    filename: uploadStream.filename
                });
            });
    });
}

/**
 * Download file from GridFS as buffer
 */
async function downloadFromGridFS(fileId) {
    const bucket = getGridFSBucket();
    if (!bucket) {
        throw new Error('MongoDB connection not ready');
    }

    return new Promise((resolve, reject) => {
        const chunks = [];
        const downloadStream = bucket.openDownloadStream(new ObjectId(fileId));

        downloadStream
            .on('data', chunk => chunks.push(chunk))
            .on('error', reject)
            .on('end', () => resolve(Buffer.concat(chunks)));
    });
}

/**
 * Delete file from GridFS
 */
async function deleteFromGridFS(fileId) {
    const bucket = getGridFSBucket();
    if (!bucket) {
        throw new Error('MongoDB connection not ready');
    }

    await bucket.delete(new ObjectId(fileId));
}

/**
 * POST /api/cases/:caseId/upload
 * Upload forensic export file (stored in MongoDB GridFS)
 */
router.post('/', upload.single('file'), async (req, res, next) => {
    try {
        const { caseId } = req.params;

        // Validate case exists
        const caseDoc = await Case.findById(caseId);
        if (!caseDoc) {
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
        // Upload file to GridFS first
        job.status = 'uploading';
        const gridFSResult = await uploadToGridFS(file.buffer, file.originalname, {
            caseId,
            mimetype: file.mimetype,
            uploadedAt: new Date()
        });

        // Parse file from buffer
        job.status = 'parsing';
        const ext = path.extname(file.originalname).toLowerCase();

        const imageTypes = ['.png', '.jpg', '.jpeg', '.webp'];
        const audioTypes = ['.mp3', '.ogg', '.wav', '.m4a', '.opus'];

        let parseResult;
        let isMedia = false;

        if (['.csv', '.tsv', '.txt'].includes(ext)) {
            parseResult = await parseCSVFromBuffer(file.buffer, caseId, (count) => {
                job.progress = count;
            });
        } else if (['.xlsx', '.xls'].includes(ext)) {
            parseResult = await parseExcelFromBuffer(file.buffer, caseId, (count) => {
                job.progress = count;
            });
        } else if (imageTypes.includes(ext)) {
            job.status = 'processing media (OCR)';
            isMedia = true;
            const extractedText = await extractTextFromImage(file.buffer, file.originalname);
            parseResult = {
                records: [{
                    caseId,
                    type: 'media',
                    source: file.originalname,
                    content: extractedText,
                    sender: 'media_upload',
                    timestamp: new Date()
                }],
                totalRows: 1
            };
        } else if (audioTypes.includes(ext)) {
            job.status = 'processing media (Audio Transcription)';
            isMedia = true;
            const transcribedText = await transcribeAudio(file.buffer, file.originalname, file.mimetype);
            parseResult = {
                records: [{
                    caseId,
                    type: 'media',
                    source: file.originalname,
                    content: transcribedText,
                    sender: 'media_upload',
                    timestamp: new Date()
                }],
                totalRows: 1
            };
        } else {
            throw new Error(`Unsupported file format: ${ext}`);
        }

        job.totalRecords = parseResult.records.length;
        job.status = 'saving';

        // Save to database
        const savedCount = await saveEvidenceToDatabase(parseResult.records);
        job.savedRecords = savedCount;

        // Update case with file info
        caseDoc.uploadedFiles.push({
            fileId: gridFSResult.fileId.toString(),
            filename: gridFSResult.filename,
            originalName: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            recordsImported: savedCount
        });
        caseDoc.evidenceCount = await Evidence.countDocuments({ caseId });
        await caseDoc.save();

        job.status = 'completed';
        job.completedAt = new Date();

    } catch (error) {
        job.status = 'failed';
        job.error = error.message;
        console.error('Upload processing error:', error);
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
 * GET /api/cases/:caseId/upload/files/:fileId/download
 * Download original uploaded file from GridFS
 */
router.get('/files/:fileId/download', async (req, res, next) => {
    try {
        const caseDoc = await Case.findById(req.params.caseId);

        if (!caseDoc) {
            return res.status(404).json({
                success: false,
                error: { message: 'Case not found' }
            });
        }

        const fileInfo = caseDoc.uploadedFiles.find(
            f => f.fileId === req.params.fileId
        );

        if (!fileInfo) {
            return res.status(404).json({
                success: false,
                error: { message: 'File not found' }
            });
        }

        const buffer = await downloadFromGridFS(req.params.fileId);

        res.setHeader('Content-Type', fileInfo.mimetype || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.originalName}"`);
        res.send(buffer);

    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/cases/:caseId/upload/files/:fileId
 * Remove uploaded file from GridFS and case
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
            f => f.fileId === req.params.fileId
        );

        if (fileIndex === -1) {
            return res.status(404).json({
                success: false,
                error: { message: 'File not found' }
            });
        }

        const fileInfo = caseDoc.uploadedFiles[fileIndex];

        // Delete from GridFS
        try {
            await deleteFromGridFS(req.params.fileId);
        } catch (e) {
            console.error('Failed to delete file from GridFS:', e);
        }

        // Delete all evidence records imported from this file
        const deleteResult = await Evidence.deleteMany({
            caseId: req.params.caseId,
            source: fileInfo.originalName
        });
        console.log(`Deleted ${deleteResult.deletedCount} evidence records from file "${fileInfo.originalName}"`);

        // Remove from case document and update evidence count
        caseDoc.uploadedFiles.splice(fileIndex, 1);
        caseDoc.evidenceCount = await Evidence.countDocuments({ caseId: req.params.caseId });
        await caseDoc.save();

        res.json({
            success: true,
            message: 'File and associated evidence removed',
            data: {
                deletedEvidence: deleteResult.deletedCount
            }
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
