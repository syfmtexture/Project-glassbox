import mongoose from 'mongoose';

const { Schema } = mongoose;

const evidenceSchema = new Schema({
    caseId: {
        type: Schema.Types.ObjectId,
        ref: 'Case',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['message', 'call', 'location', 'contact', 'media', 'other'],
        default: 'other'
    },
    source: {
        type: String,
        trim: true
    },
    timestamp: {
        type: Date,
        index: true
    },

    // Content fields (vary by type)
    sender: String,
    receiver: String,
    content: String,
    duration: Number,        // For calls (in seconds)

    // Location specific
    latitude: Number,
    longitude: Number,
    accuracy: Number,
    locationName: String,

    // Contact specific
    contactName: String,
    phoneNumbers: [String],
    emails: [String],
    organization: String,

    // AI Analysis Results
    analysis: {
        priorityScore: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },
        priority: {
            type: String,
            enum: ['critical', 'high', 'medium', 'low'],
            default: 'low'
        },
        flags: [{
            type: String
        }],
        summary: String,
        sentiment: {
            type: String,
            enum: ['positive', 'neutral', 'negative', null]
        },
        entities: [{
            type: String,
            value: String
        }],
        analyzedAt: Date
    },

    // Investigator Actions
    isBookmarked: {
        type: Boolean,
        default: false,
        index: true
    },
    isReviewed: {
        type: Boolean,
        default: false
    },
    notes: String,
    tags: [{
        type: String,
        trim: true
    }],

    // Original raw data
    rawData: Schema.Types.Mixed
}, {
    timestamps: true
});

// Compound indexes for common queries
evidenceSchema.index({ caseId: 1, 'analysis.priorityScore': -1 });
evidenceSchema.index({ caseId: 1, type: 1 });
evidenceSchema.index({ caseId: 1, timestamp: 1 });
evidenceSchema.index({ caseId: 1, isBookmarked: 1 });

// Text index for content search
evidenceSchema.index({ content: 'text', sender: 'text', receiver: 'text' });

// Virtual for priority label based on score
evidenceSchema.pre('save', function (next) {
    if (this.analysis && typeof this.analysis.priorityScore === 'number') {
        const score = this.analysis.priorityScore;
        if (score >= 80) this.analysis.priority = 'critical';
        else if (score >= 60) this.analysis.priority = 'high';
        else if (score >= 40) this.analysis.priority = 'medium';
        else this.analysis.priority = 'low';
    }
    next();
});

const Evidence = mongoose.model('Evidence', evidenceSchema);

export default Evidence;
