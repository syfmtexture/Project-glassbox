import mongoose from 'mongoose';

const { Schema } = mongoose;

const auditLogSchema = new Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    userRole: {
        type: String,
        enum: ['admin', 'investigator', 'anonymous'],
        default: 'anonymous'
    },
    action: {
        type: String,
        required: true,
        index: true
    },
    description: {
        type: String,
        required: true
    },
    metadata: {
        type: Schema.Types.Mixed,
        default: {}
    },
    ipAddress: {
        type: String
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
});

// Compound index for efficient searching
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
