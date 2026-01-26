const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const handleResponse = async (res: Response) => {
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.log('[DEBUG] API Error Response:', JSON.stringify(data)); // Force stringify
        let errorMessage = data.message || data.error || 'API request failed';

        if (data.errors && Array.isArray(data.errors)) {
            // Drop the path prefix if it's just the field name, use the custom message primarily
            errorMessage = data.errors.map((e: any) => `• ${e.message}`).join('\n');
        }

        throw new Error(errorMessage);
    }
    return res.json();
};

export const api = {
    get: async (endpoint: string, token?: string) => {
        const res = await fetch(`${API_URL}${endpoint}`, {
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json'
            }
        });
        return handleResponse(res);
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
        return handleResponse(res);
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
        return handleResponse(res);
    },
    delete: async (endpoint: string, token?: string) => {
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'DELETE',
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json'
            }
        });
        return handleResponse(res);
    },
    upload: async (endpoint: string, formData: FormData, token?: string) => {
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
            },
            body: formData
        });
        return handleResponse(res);
    }
};
