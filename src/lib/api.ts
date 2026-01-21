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
        return res.json(); // Handling status checks in creating function ideally
    }
};
