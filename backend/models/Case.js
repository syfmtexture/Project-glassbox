import mongoose from 'mongoose';

const { Schema } = mongoose;

const caseSchema = new Schema({
    caseName: {
        type: String,
        required: [true, 'Case name is required'],
        trim: true
    },
    caseNumber: {
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },
    investigator: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    deviceInfo: {
        deviceType: String,
        imei: String,
        owner: String,
        serialNumber: String,
        osVersion: String
    },
    status: {
        type: String,
        enum: ['active', 'archived', 'closed'],
        default: 'active'
    },
    uploadedFiles: [{
        filename: String,
        originalName: String,
        mimetype: String,
        size: Number,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    evidenceCount: {
        type: Number,
        default: 0
    },
    highPriorityCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Index for faster searches
caseSchema.index({ caseName: 'text', caseNumber: 'text', investigator: 'text' });

const Case = mongoose.model('Case', caseSchema);

export default Case;
