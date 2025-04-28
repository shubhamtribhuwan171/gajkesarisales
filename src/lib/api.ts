import { getToken } from './auth';

class ApiError extends Error {
  status?: number;
  data?: any;

  constructor(message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

const API_BASE_URL = 'https://api.gajkesaristeels.in';

export async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  if (!token) {
    window.location.href = '/login';
    throw new Error('No authentication token found');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (response.status === 401) {
    // Token expired or invalid
    window.location.href = '/login';
    throw new ApiError('Authentication failed');
  }

  if (!response.ok) {
    const error = new ApiError(`HTTP error! status: ${response.status}`);
    error.status = response.status;
    try {
      error.data = await response.json();
    } catch {
      error.data = await response.text();
    }
    throw error;
  }

  return response.json();
}

// Helper methods for common HTTP methods
export const api = {
  get: <T>(endpoint: string) => apiCall<T>(endpoint),
  
  post: <T>(endpoint: string, data: any) => apiCall<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  put: <T>(endpoint: string, data: any) => apiCall<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  delete: <T>(endpoint: string) => apiCall<T>(endpoint, {
    method: 'DELETE',
  }),
}; 