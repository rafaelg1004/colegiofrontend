export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005/api/v1";

export const getCookie = (name: string): string | undefined => {
  if (typeof document === "undefined") return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
  return undefined;
};

export const setAuthCookie = (token: string) => {
  document.cookie = `access_token=${token}; path=/; max-age=86400; samesite=lax`;
};

export const clearAuthCookie = () => {
  document.cookie =
    "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
};

export const getAuthToken = (): string | null => {
  const token = getCookie("access_token");

  if (!token || token === "undefined" || token === "null") {
    return null;
  }

  return token;
};

// Check if token is expired
export const isTokenExpired = (token: string): boolean => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;

    const payload = JSON.parse(atob(parts[1]));

    if (payload.exp) {
      return payload.exp * 1000 < Date.now();
    }

    return false;
  } catch (e) {
    return true;
  }
};

// Redirect to login if token is expired
export const requireAuth = (): boolean => {
  const token = getAuthToken();
  if (!token || isTokenExpired(token)) {
    logout();
    return false;
  }
  return true;
};

// Logout function
export const logout = () => {
  clearAuthCookie();
  localStorage.removeItem("user");
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
};

// Save token with expiration (using cookies)
export const saveTokenWithExpiration = (token: string) => {
  try {
    const parts = token.split(".");
    let maxAge = 86400; // 24h default

    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      if (payload.exp) {
        maxAge = Math.floor(payload.exp - Date.now() / 1000);
      }
    }
    
    // Refresh cookie with proper maxAge
    document.cookie = `access_token=${token}; path=/; max-age=${maxAge}; samesite=lax`;
  } catch (e) {
    setAuthCookie(token);
  }
};
