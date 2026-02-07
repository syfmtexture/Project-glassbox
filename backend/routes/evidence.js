import express from 'express';
import Evidence from '../models/Evidence.js';
import Case from '../models/Case.js';
import mongoose from 'mongoose';

const router = express.Router({ mergeParams: true });

/**
 * GET /api/cases/:caseId/evidence
 * List evidence with filters and pagination
 */
router.get('/', async (req, res, next) => {
    try {
        const { caseId } = req.params;
        const {
            type,
            priority,
            source,
            bookmarked,
            reviewed,
            tag,
            search,
            startDate,
            endDate,
            minScore,
            maxScore,
            sortBy = 'timestamp',
            sortOrder = 'desc',
            page = 1,
            limit = 50
        } = req.query;

        // Build query
        const query = { caseId: new mongoose.Types.ObjectId(caseId) };

        if (type) query.type = type;
        if (priority) query['analysis.priority'] = priority;
        if (source) query.source = source;
        if (bookmarked === 'true') query.isBookmarked = true;
        if (reviewed === 'true') query.isReviewed = true;
        if (reviewed === 'false') query.isReviewed = { $ne: true };
        if (tag) query.tags = tag;

        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) query.timestamp.$gte = new Date(startDate);
            if (endDate) query.timestamp.$lte = new Date(endDate);
        }

        if (minScore || maxScore) {
            query['analysis.priorityScore'] = {};
            if (minScore) query['analysis.priorityScore'].$gte = parseInt(minScore);
            if (maxScore) query['analysis.priorityScore'].$lte = parseInt(maxScore);
        }

        if (search) {
            query.$text = { $search: search };
        }

        // Build sort
        const sort = {};
        sort[sortBy === 'priority' ? 'analysis.priorityScore' : sortBy] = sortOrder === 'asc' ? 1 : -1;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [evidence, total] = await Promise.all([
            Evidence.find(query)
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit))
                .select('-rawData'),  // Exclude raw data for list view
            Evidence.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: evidence,
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
 * GET /api/cases/:caseId/evidence/high-priority
 * Get only high priority evidence (score >= 60)
 */
router.get('/high-priority', async (req, res, next) => {
    try {
        const { caseId } = req.params;
        const { page = 1, limit = 50 } = req.query;

        const query = {
            caseId: new mongoose.Types.ObjectId(caseId),
            'analysis.priorityScore': { $gte: 60 }
        };

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [evidence, total] = await Promise.all([
            Evidence.find(query)
                .sort({ 'analysis.priorityScore': -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .select('-rawData'),
            Evidence.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: evidence,
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
 * GET /api/cases/:caseId/evidence/bookmarked
 * Get bookmarked evidence
 */
router.get('/bookmarked', async (req, res, next) => {
    try {
        const { caseId } = req.params;

        const evidence = await Evidence.find({
            caseId: new mongoose.Types.ObjectId(caseId),
            isBookmarked: true
        })
            .sort({ 'analysis.priorityScore': -1 })
            .select('-rawData');

        res.json({
            success: true,
            data: evidence,
            total: evidence.length
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/cases/:caseId/evidence/summary
 * Get evidence type breakdown
 */
router.get('/summary', async (req, res, next) => {
    try {
        const { caseId } = req.params;

        const pipeline = [
            { $match: { caseId: new mongoose.Types.ObjectId(caseId) } },
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 },
                    highPriority: {
                        $sum: { $cond: [{ $gte: ['$analysis.priorityScore', 60] }, 1, 0] }
                    },
                    avgScore: { $avg: '$analysis.priorityScore' }
                }
            }
        ];

        const summary = await Evidence.aggregate(pipeline);

        res.json({
            success: true,
            data: summary.map(s => ({
                type: s._id,
                count: s.count,
                highPriority: s.highPriority,
                avgScore: Math.round(s.avgScore || 0)
            }))
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/cases/:caseId/evidence/:id
 * Get specific evidence details (includes raw data)
 */
router.get('/:id', async (req, res, next) => {
    try {
        const evidence = await Evidence.findOne({
            _id: req.params.id,
            caseId: req.params.caseId
        });

        if (!evidence) {
            return res.status(404).json({
                success: false,
                error: { message: 'Evidence not found' }
            });
        }

        res.json({
            success: true,
            data: evidence
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/cases/:caseId/evidence/:id
 * Update evidence (bookmark, notes, tags, reviewed status)
 */
router.put('/:id', async (req, res, next) => {
    try {
        const { isBookmarked, isReviewed, notes, tags } = req.body;

        const updateData = {};
        if (typeof isBookmarked === 'boolean') updateData.isBookmarked = isBookmarked;
        if (typeof isReviewed === 'boolean') updateData.isReviewed = isReviewed;
        if (notes !== undefined) updateData.notes = notes;
        if (tags !== undefined) updateData.tags = tags;

        const evidence = await Evidence.findOneAndUpdate(
            { _id: req.params.id, caseId: req.params.caseId },
            { $set: updateData },
            { new: true }
        );

        if (!evidence) {
            return res.status(404).json({
                success: false,
                error: { message: 'Evidence not found' }
            });
        }

        res.json({
            success: true,
            data: evidence
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/cases/:caseId/evidence/:id/bookmark
 * Toggle bookmark status
 */
router.post('/:id/bookmark', async (req, res, next) => {
    try {
        const evidence = await Evidence.findOne({
            _id: req.params.id,
            caseId: req.params.caseId
        });

        if (!evidence) {
            return res.status(404).json({
                success: false,
                error: { message: 'Evidence not found' }
            });
        }

        evidence.isBookmarked = !evidence.isBookmarked;
        await evidence.save();

        res.json({
            success: true,
            data: { isBookmarked: evidence.isBookmarked }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/cases/:caseId/evidence/bulk-update
 * Bulk update multiple evidence items
 */
router.post('/bulk-update', async (req, res, next) => {
    try {
        const { ids, update } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                error: { message: 'Evidence IDs array is required' }
            });
        }

        const allowedUpdates = ['isBookmarked', 'isReviewed', 'tags'];
        const updateData = {};

        for (const key of allowedUpdates) {
            if (update[key] !== undefined) {
                updateData[key] = update[key];
            }
        }

        const result = await Evidence.updateMany(
            {
                _id: { $in: ids },
                caseId: req.params.caseId
            },
            { $set: updateData }
        );

        res.json({
            success: true,
            data: {
                modifiedCount: result.modifiedCount,
                matchedCount: result.matchedCount
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/cases/:caseId/evidence/tags
 * Get all unique tags used in case
 */
router.get('/meta/tags', async (req, res, next) => {
    try {
        const tags = await Evidence.distinct('tags', {
            caseId: new mongoose.Types.ObjectId(req.params.caseId)
        });

        res.json({
            success: true,
            data: tags.filter(Boolean)
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/cases/:caseId/evidence/sources
 * Get all unique sources in case
 */
router.get('/meta/sources', async (req, res, next) => {
    try {
        const sources = await Evidence.distinct('source', {
            caseId: new mongoose.Types.ObjectId(req.params.caseId)
        });

        res.json({
            success: true,
            data: sources.filter(Boolean)
        });
    } catch (error) {
        next(error);
    }
});

export default router;
