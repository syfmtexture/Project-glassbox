import mongoose from 'mongoose';

const { Schema } = mongoose;

const analysisJobSchema = new Schema({
    caseId: {
        type: Schema.Types.ObjectId,
        ref: 'Case',
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
        default: 'pending'
    },
    totalRecords: {
        type: Number,
        default: 0
    },
    processedRecords: {
        type: Number,
        default: 0
    },
    highPriorityCount: {
        type: Number,
        default: 0
    },
    criticalCount: {
        type: Number,
        default: 0
    },
    errorMessage: String,
    errorDetails: Schema.Types.Mixed,

    // Processing stats
    stats: {
        messagesAnalyzed: { type: Number, default: 0 },
        callsAnalyzed: { type: Number, default: 0 },
        locationsAnalyzed: { type: Number, default: 0 },
        flaggedItems: { type: Number, default: 0 },
        averageScore: { type: Number, default: 0 }
    },

    startedAt: Date,
    completedAt: Date
}, {
    timestamps: true
});

// Calculate progress percentage
analysisJobSchema.virtual('progress').get(function () {
    if (!this.totalRecords) return 0;
    return Math.round((this.processedRecords / this.totalRecords) * 100);
});

// Ensure virtuals are included in JSON output
analysisJobSchema.set('toJSON', { virtuals: true });
analysisJobSchema.set('toObject', { virtuals: true });

const AnalysisJob = mongoose.model('AnalysisJob', analysisJobSchema);

export default AnalysisJob;
