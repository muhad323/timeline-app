const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://timeline-backend-ldg3.onrender.com';

export const api = {
    getToken: () => localStorage.getItem('timeline_token'),
    setToken: (token: string) => localStorage.setItem('timeline_token', token),
    removeToken: () => {
        localStorage.removeItem('timeline_token');
        localStorage.removeItem('timeline_user');
    },

    async request(endpoint: string, options: RequestInit = {}) {
        const token = this.getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options.headers,
        };

        const response = await fetch(`${API_URL}/api${endpoint}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'API Request failed' }));
            throw new Error(error.message || 'API Request failed');
        }

        return response.json();
    },

    auth: {
        async login(credentials: any) {
            return api.request('/auth/login', {
                method: 'POST',
                body: JSON.stringify(credentials),
            });
        },
        async register(credentials: any) {
            return api.request('/auth/register', {
                method: 'POST',
                body: JSON.stringify(credentials),
            });
        },
        async getSecurityQuestion(username: string) {
            return api.request(`/auth/security-question/${username}`);
        },
        async verifyAnswer(data: any) {
            return api.request('/auth/verify-answer', {
                method: 'POST',
                body: JSON.stringify(data),
            });
        },
        async resetPassword(data: any) {
            return api.request('/auth/reset-password', {
                method: 'POST',
                body: JSON.stringify(data),
            });
        },
    },

    projects: {
        async getAll() {
            return api.request('/projects');
        },
        async create(data: any) {
            return api.request('/projects', {
                method: 'POST',
                body: JSON.stringify(data),
            });
        },
        async update(id: string, data: any) {
            return api.request(`/projects/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data),
            });
        },
        async delete(id: string) {
            return api.request(`/projects/${id}`, {
                method: 'DELETE',
            });
        },
    },
};
