const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const api = {
    get: async (endpoint: string, token?: string) => {
        const res = await fetch(`${API_URL}${endpoint}`, {
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json'
            }
        });
        return res.json();
    },
    post: async (endpoint: string, body: any, token?: string) => {
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        return res.json();
    },
    put: async (endpoint: string, body: any, token?: string) => {
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'PUT',
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        return res.json();
    },
    delete: async (endpoint: string, token?: string) => {
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'DELETE',
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json'
            }
        });
        return res.json();
    },
    upload: async (endpoint: string, formData: FormData, token?: string) => {
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
                // Content-Type header is not needed for FormData, prompt will explain why
            },
            body: formData
        });
        return res.json();
    }
};
