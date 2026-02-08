const API_BASE = 'http://localhost:5000/api';

/**
 * Generic fetch wrapper with error handling
 */
async function fetchApi(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;

    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    };

    // Don't set Content-Type for FormData (file uploads)
    if (options.body instanceof FormData) {
        delete config.headers['Content-Type'];
    }

    try {
        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'Something went wrong');
        }

        return data;
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        throw error;
    }
}

// ===== CASES API =====

export const casesApi = {
    // List all cases
    list: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return fetchApi(`/cases${query ? `?${query}` : ''}`);
    },

    // Get single case
    get: (id) => fetchApi(`/cases/${id}`),

    // Create case
    create: (data) => fetchApi('/cases', {
        method: 'POST',
        body: JSON.stringify(data),
    }),

    // Update case
    update: (id, data) => fetchApi(`/cases/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),

    // Delete case
    delete: (id) => fetchApi(`/cases/${id}`, {
        method: 'DELETE',
    }),

    // Get case statistics
    getStats: (id) => fetchApi(`/cases/${id}/stats`),

    // Get timeline data
    getTimeline: (id) => fetchApi(`/cases/${id}/timeline`),

    // Get contact network
    getContacts: (id, params = {}) => {
        const query = new URLSearchParams(params).toString();
        return fetchApi(`/cases/${id}/contacts${query ? `?${query}` : ''}`);
    },

    // Start analysis
    analyze: (id, options = {}) => fetchApi(`/cases/${id}/analyze`, {
        method: 'POST',
        body: JSON.stringify(options),
    }),

    // Get analysis status
    getAnalysisStatus: (id) => fetchApi(`/cases/${id}/analysis-status`),
};

// ===== EVIDENCE API =====

export const evidenceApi = {
    // List evidence with filters
    list: (caseId, params = {}) => {
        const query = new URLSearchParams(params).toString();
        return fetchApi(`/cases/${caseId}/evidence${query ? `?${query}` : ''}`);
    },

    // Get high priority evidence
    getHighPriority: (caseId, params = {}) => {
        const query = new URLSearchParams(params).toString();
        return fetchApi(`/cases/${caseId}/evidence/high-priority${query ? `?${query}` : ''}`);
    },

    // Get bookmarked evidence
    getBookmarked: (caseId) => fetchApi(`/cases/${caseId}/evidence/bookmarked`),

    // Get evidence summary by type
    getSummary: (caseId) => fetchApi(`/cases/${caseId}/evidence/summary`),

    // Get single evidence item
    get: (caseId, evidenceId) => fetchApi(`/cases/${caseId}/evidence/${evidenceId}`),

    // Update evidence (notes, tags, etc.)
    update: (caseId, evidenceId, data) => fetchApi(`/cases/${caseId}/evidence/${evidenceId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),

    // Toggle bookmark
    toggleBookmark: (caseId, evidenceId) => fetchApi(`/cases/${caseId}/evidence/${evidenceId}/bookmark`, {
        method: 'POST',
    }),

    // Bulk update
    bulkUpdate: (caseId, ids, update) => fetchApi(`/cases/${caseId}/evidence/bulk-update`, {
        method: 'POST',
        body: JSON.stringify({ ids, update }),
    }),

    // Get all tags used in case
    getTags: (caseId) => fetchApi(`/cases/${caseId}/evidence/meta/tags`),

    // Get all sources in case
    getSources: (caseId) => fetchApi(`/cases/${caseId}/evidence/meta/sources`),
};

// ===== UPLOAD API =====

export const uploadApi = {
    // Upload file
    upload: (caseId, file) => {
        const formData = new FormData();
        formData.append('file', file);

        return fetchApi(`/cases/${caseId}/upload`, {
            method: 'POST',
            body: formData,
        });
    },

    // Check upload job status
    getStatus: (caseId, jobId) => fetchApi(`/cases/${caseId}/upload/${jobId}/status`),

    // List uploaded files
    listFiles: (caseId) => fetchApi(`/cases/${caseId}/upload/files`),

    // Delete file
    deleteFile: (caseId, fileId) => fetchApi(`/cases/${caseId}/upload/files/${fileId}`, {
        method: 'DELETE',
    }),
};

// ===== HEALTH CHECK =====

export const healthApi = {
    check: () => fetchApi('/health'),
};

export default {
    cases: casesApi,
    evidence: evidenceApi,
    upload: uploadApi,
    health: healthApi,
};
