const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

const defaultHeaders = {
  "Bypass-Tunnel-Reminder": "true",
  "Content-Type": "application/json",
};

const handleResponse = async (res: Response) => {
  if (!res.ok) {
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = {};
      console.error(
        `[DEBUG] API Failed (${res.status} ${res.statusText}):`,
        text,
      );
    }

    let errorMessage =
      data.message ||
      data.error ||
      `API request failed: ${res.status} ${res.statusText}`;

    if (data.errors && Array.isArray(data.errors)) {
      errorMessage = data.errors.map((e: any) => `• ${e.message}`).join("\n");
    }

    throw new Error(errorMessage);
  }
  return res.json();
};

export const api = {
  // credentials: "include" sends the HTTP-only cookie automatically on every request
  get: async (endpoint: string) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
      credentials: "include",
      headers: defaultHeaders,
    });
    return handleResponse(res);
  },
  post: async (endpoint: string, body: any) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      credentials: "include",
      headers: defaultHeaders,
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },
  put: async (endpoint: string, body: any) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: "PUT",
      credentials: "include",
      headers: defaultHeaders,
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },
  delete: async (endpoint: string, body?: any) => {
    const options: RequestInit = {
      method: "DELETE",
      credentials: "include",
      headers: defaultHeaders,
    };
    if (body) {
      options.body = JSON.stringify(body);
    }
    const res = await fetch(`${API_URL}${endpoint}`, options);
    return handleResponse(res);
  },
  upload: async (endpoint: string, formData: FormData) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      credentials: "include",
      headers: { "Bypass-Tunnel-Reminder": "true" },
      body: formData,
    });
    return handleResponse(res);
  },
  uploadVideo: async (endpoint: string, formData: FormData) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      credentials: "include",
      headers: { "Bypass-Tunnel-Reminder": "true" },
      body: formData,
    });
    return handleResponse(res);
  },
};
