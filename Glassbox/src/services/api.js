const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Helper to handle fetch responses
 */
async function handleResponse(response) {
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error?.message || 'API request failed');
    }
    return data;
}

export const api = {
    // Cases
    cases: {
        list: async (params = {}) => {
            const qs = new URLSearchParams(params).toString();
            const res = await fetch(`${API_BASE_URL}/cases?${qs}`);
            return handleResponse(res);
        },
        create: async (caseData) => {
            const res = await fetch(`${API_BASE_URL}/cases`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(caseData),
            });
            return handleResponse(res);
        },
        get: async (id) => {
            const res = await fetch(`${API_BASE_URL}/cases/${id}`);
            return handleResponse(res);
        },
        delete: async (id) => {
            const res = await fetch(`${API_BASE_URL}/cases/${id}`, {
                method: 'DELETE',
            });
            return handleResponse(res);
        },
        stats: async (id) => {
            const res = await fetch(`${API_BASE_URL}/cases/${id}/stats`);
            return handleResponse(res);
        },
        analyze: async (id, options = { useLLM: true }) => {
            const res = await fetch(`${API_BASE_URL}/cases/${id}/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(options),
            });
            return handleResponse(res);
        },
        getAnalysisStatus: async (id) => {
            const res = await fetch(`${API_BASE_URL}/cases/${id}/analysis-status`);
            return handleResponse(res);
        }
    },

    // Evidence
    evidence: {
        list: async (caseId, params = {}) => {
            const qs = new URLSearchParams(params).toString();
            const res = await fetch(`${API_BASE_URL}/cases/${caseId}/evidence?${qs}`);
            return handleResponse(res);
        },
        get: async (caseId, evidenceId) => {
            const res = await fetch(`${API_BASE_URL}/cases/${caseId}/evidence/${evidenceId}`);
            return handleResponse(res);
        },
        bookmark: async (caseId, evidenceId) => {
            const res = await fetch(`${API_BASE_URL}/cases/${caseId}/evidence/${evidenceId}/bookmark`, {
                method: 'POST',
            });
            return handleResponse(res);
        }
    },

    // Upload
    upload: {
        file: async (caseId, file, onProgress) => {
            const formData = new FormData();
            formData.append('file', file);

            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', `${API_BASE_URL}/upload/${caseId}`);

                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable && onProgress) {
                        const percent = Math.round((event.loaded / event.total) * 100);
                        onProgress(percent);
                    }
                };

                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            resolve(JSON.parse(xhr.responseText));
                        } catch (e) {
                            reject(new Error('Invalid JSON response'));
                        }
                    } else {
                        reject(new Error(xhr.statusText || 'Upload failed'));
                    }
                };

                xhr.onerror = () => reject(new Error('Network Error'));
                xhr.send(formData);
            });
        }
    }
};
