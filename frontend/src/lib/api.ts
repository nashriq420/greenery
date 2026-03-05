const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

const defaultHeaders = {
    'Bypass-Tunnel-Reminder': 'true',
    'Content-Type': 'application/json'
};

const handleResponse = async (res: Response) => {
    if (!res.ok) {
        const text = await res.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch {
            data = {};
            console.error(`[DEBUG] API Failed (${res.status} ${res.statusText}):`, text);
        }

        console.log('[DEBUG] API Error Response:', JSON.stringify(data));
        let errorMessage = data.message || data.error || `API request failed: ${res.status} ${res.statusText}`;

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
                ...defaultHeaders,
                'Authorization': token ? `Bearer ${token}` : '',
            }
        });
        return handleResponse(res);
    },
    post: async (endpoint: string, body: any, token?: string) => {
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                ...defaultHeaders,
                'Authorization': token ? `Bearer ${token}` : '',
            },
            body: JSON.stringify(body)
        });
        return handleResponse(res);
    },
    put: async (endpoint: string, body: any, token?: string) => {
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'PUT',
            headers: {
                ...defaultHeaders,
                'Authorization': token ? `Bearer ${token}` : '',
            },
            body: JSON.stringify(body)
        });
        return handleResponse(res);
    },
    delete: async (endpoint: string, token?: string, body?: any) => {
        const options: RequestInit = {
            method: 'DELETE',
            headers: {
                ...defaultHeaders,
                'Authorization': token ? `Bearer ${token}` : '',
            }
        };
        if (body) {
            options.body = JSON.stringify(body);
        }
        const res = await fetch(`${API_URL}${endpoint}`, options);
        return handleResponse(res);
    },
    upload: async (endpoint: string, formData: FormData, token?: string) => {
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Bypass-Tunnel-Reminder': 'true',
                'Authorization': token ? `Bearer ${token}` : '',
            },
            body: formData
        });
        return handleResponse(res);
    },
    uploadVideo: async (endpoint: string, formData: FormData, token?: string) => {
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Bypass-Tunnel-Reminder': 'true',
                'Authorization': token ? `Bearer ${token}` : '',
            },
            body: formData
        });
        return handleResponse(res);
    }
};
