import { getAuthToken, clearAuthCookie } from './auth';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005/api/v1';

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

export const apiClient = async (endpoint: string, options: FetchOptions = {}) => {
  const { skipAuth = false, ...fetchOptions } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  if (!skipAuth) {
    const token = getAuthToken();
    if (!token) {
      handleTokenExpiration();
      throw new Error('No hay token de autenticación');
    }
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  // Check for 401 (Unauthorized) - token expired or invalid
  if (response.status === 401) {
    handleTokenExpiration();
    throw new Error('Sesión expirada');
  }

  // Check for other errors
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Error ${response.status}`);
  }

  return response.json();
};

// Handle token expiration - redirect to login
const handleTokenExpiration = () => {
  clearAuthCookie();
  if (typeof window !== 'undefined') {
    // Clear localStorage as well
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Redirect to login
    window.location.href = '/login';
  }
};

// Helper methods for common HTTP verbs
export const api = {
  get: (endpoint: string, options?: FetchOptions) =>
    apiClient(endpoint, { ...options, method: 'GET' }),

  post: (endpoint: string, body?: unknown, options?: FetchOptions) =>
    apiClient(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),

  patch: (endpoint: string, body?: unknown, options?: FetchOptions) =>
    apiClient(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) }),

  delete: (endpoint: string, options?: FetchOptions) =>
    apiClient(endpoint, { ...options, method: 'DELETE' }),
};