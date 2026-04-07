import axios from 'axios'

// Get base URL from environment variables, fallback to localhost for development
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

// Create a configured axios instance
const apiClient = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Request interceptor to add token
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('gb_token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Response interceptor for consistent error handling and unwrapping data
apiClient.interceptors.response.use(
    (response) => response.data,
    (error) => {
        console.error('API Error:', error)
        if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
            localStorage.removeItem('gb_token')
            localStorage.removeItem('gb_user')
            window.location.href = '/login'
        }
        const message =
            error.response?.data?.error?.message || error.response?.data?.error || error.message || 'Something went wrong'
        return Promise.reject(new Error(message))
    }
)

// ===== AUTH API =====
export const authApi = {
    login: (credentials) => apiClient.post('/auth/login', credentials),
    logout: (userId) => apiClient.post('/auth/logout', { userId }),
}

// ===== ADMIN API =====
export const adminApi = {
    getUsers: () => apiClient.get('/admin/users'),
    createUser: (data) => apiClient.post('/admin/users', data),
    toggleUserStatus: (userId) => apiClient.put(`/admin/users/${userId}/toggle-status`),
    getAuditLogs: (params) => apiClient.get('/admin/audit-logs', { params }),
    getExportLogs: (params) => apiClient.get('/admin/audit-logs/exports', { params }),
}

// ===== CASES API =====

export const casesApi = {
    list: (params = {}) => apiClient.get('/cases', { params }),
    get: (id) => apiClient.get(`/cases/${id}`),
    create: (data) => apiClient.post('/cases', data),
    update: (id, data) => apiClient.put(`/cases/${id}`, data),
    delete: (id) => apiClient.delete(`/cases/${id}`),
    getStats: (id) => apiClient.get(`/cases/${id}/stats`),
    getTimeline: (id, params = {}) => apiClient.get(`/cases/${id}/timeline`, { params }),
    getContacts: (id, params = {}) => apiClient.get(`/cases/${id}/contacts`, { params }),
    analyze: (id, options = {}) => apiClient.post(`/cases/${id}/analyze`, options),
    getAnalysisStatus: (id) => apiClient.get(`/cases/${id}/analysis-status`),
    exportData: (id) => {
        // Since we want to trigger a download, we use the raw URL with token
        const token = localStorage.getItem('gb_token')
        const url = `${API_BASE}/cases/${id}/export?token=${token}`
        window.open(url, '_blank')
    }
}

// ===== EVIDENCE API =====

export const evidenceApi = {
    list: (caseId, params = {}) => apiClient.get(`/cases/${caseId}/evidence`, { params }),
    getHighPriority: (caseId, params = {}) =>
        apiClient.get(`/cases/${caseId}/evidence/high-priority`, { params }),
    getBookmarked: (caseId) => apiClient.get(`/cases/${caseId}/evidence/bookmarked`),
    getSummary: (caseId) => apiClient.get(`/cases/${caseId}/evidence/summary`),
    get: (caseId, evidenceId) => apiClient.get(`/cases/${caseId}/evidence/${evidenceId}`),
    update: (caseId, evidenceId, data) =>
        apiClient.put(`/cases/${caseId}/evidence/${evidenceId}`, data),
    toggleBookmark: (caseId, evidenceId) =>
        apiClient.post(`/cases/${caseId}/evidence/${evidenceId}/bookmark`),
    bulkUpdate: (caseId, ids, update) =>
        apiClient.post(`/cases/${caseId}/evidence/bulk-update`, { ids, update }),
    getTags: (caseId) => apiClient.get(`/cases/${caseId}/evidence/meta/tags`),
    getSources: (caseId) => apiClient.get(`/cases/${caseId}/evidence/meta/sources`),
}

// ===== UPLOAD API =====

export const uploadApi = {
    upload: (caseId, file) => {
        const formData = new FormData()
        formData.append('file', file)
        return apiClient.post(`/cases/${caseId}/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
    },
    getStatus: (caseId, jobId) => apiClient.get(`/cases/${caseId}/upload/${jobId}/status`),
    listFiles: (caseId) => apiClient.get(`/cases/${caseId}/upload/files`),
    deleteFile: (caseId, fileId) => apiClient.delete(`/cases/${caseId}/upload/files/${fileId}`),
}

// ===== HEALTH CHECK =====

export const healthApi = {
    check: () => apiClient.get('/health'),
}

export default {
    auth: authApi,
    admin: adminApi,
    cases: casesApi,
    evidence: evidenceApi,
    upload: uploadApi,
    health: healthApi,
}

