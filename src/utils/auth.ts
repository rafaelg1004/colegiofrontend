export const getCookie = (name: string): string | undefined => {
  if (typeof document === 'undefined') return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return undefined;
};

export const setAuthCookie = (token: string) => {
  document.cookie = `access_token=${token}; path=/; max-age=86400; samesite=lax`;
};

export const clearAuthCookie = () => {
  document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
};

export const getAuthToken = (): string | null => {
  const token = getCookie('access_token') || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
  
  if (!token || token === 'undefined' || token === 'null') {
    return null;
  }
  
  return token;
};
