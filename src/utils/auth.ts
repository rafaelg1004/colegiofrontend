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
  const token =
    getCookie("access_token") ||
    (typeof window !== "undefined" ? localStorage.getItem("token") : null);

  if (!token || token === "undefined" || token === "null") {
    return null;
  }

  return token;
};

// Check if token is expired
export const isTokenExpired = (token: string): boolean => {
  try {
    // JWT tokens have 3 parts separated by dots: header.payload.signature
    const parts = token.split(".");
    if (parts.length !== 3) {
      // If not a valid JWT format, assume it's expired if we can't verify
      return true;
    }

    // Decode the payload (middle part)
    const payload = JSON.parse(atob(parts[1]));

    // Check if token has expiration claim
    if (payload.exp) {
      // exp is in seconds, Date.now() is in milliseconds
      return payload.exp * 1000 < Date.now();
    }

    // If no expiration claim, check if there's a custom expiration stored
    const expiration = localStorage.getItem("token_expiration");
    if (expiration) {
      return parseInt(expiration) < Date.now();
    }

    return false;
  } catch (e) {
    // If we can't decode the token, assume it's expired
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
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("token_expiration");
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
};

// Save token with expiration (stores expiration from JWT or defaults to 24 hours)
export const saveTokenWithExpiration = (token: string) => {
  try {
    const parts = token.split(".");
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      if (payload.exp) {
        localStorage.setItem(
          "token_expiration",
          (payload.exp * 1000).toString(),
        );
      }
    }
  } catch (e) {
    // If we can't decode, just set a default expiration
    localStorage.setItem(
      "token_expiration",
      (Date.now() + 24 * 60 * 60 * 1000).toString(),
    );
  }
};
