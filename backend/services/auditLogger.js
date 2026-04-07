import AuditLog from '../models/AuditLog.js';

export const ACTIONS = {
    LOGIN: 'LOGIN',
    LOGOUT: 'LOGOUT',
    CREATE_CASE: 'CREATE_CASE',
    VIEW_CASE: 'VIEW_CASE',
    UPDATE_CASE: 'UPDATE_CASE',
    DELETE_CASE: 'DELETE_CASE',
    UPLOAD_FILE: 'UPLOAD_FILE',
    DELETE_FILE: 'DELETE_FILE',
    EXPORT_FILE: 'EXPORT_FILE',
    EXPORT_REPORT: 'EXPORT_REPORT',
    CREATE_USER: 'CREATE_USER',
    UPDATE_USER: 'UPDATE_USER',
    VIEW_AUDIT_LOG: 'VIEW_AUDIT_LOG'
};

/**
 * Log a user action to the audit log
 * @param {Object} options - Log options
 * @param {string} options.userId - User ID performing the action
 * @param {string} options.userRole - Role of the user
 * @param {string} options.action - Action type from ACTIONS
 * @param {string} options.description - Human-readable description
 * @param {Object} [options.metadata] - Optional metadata
 * @param {string} [options.ipAddress] - Client IP address
 */
export const logAction = async ({
    userId,
    userRole = 'anonymous',
    action,
    description,
    metadata = {},
    ipAddress = 'unknown'
}) => {
    try {
        const log = new AuditLog({
            userId,
            userRole,
            action,
            description,
            metadata,
            ipAddress
        });
        await log.save();
        return log;
    } catch (error) {
        console.error('Failed to save audit log:', error);
        // Don't throw - audit logging shouldn't crash the main request
    }
};

export default {
    ACTIONS,
    logAction
};
