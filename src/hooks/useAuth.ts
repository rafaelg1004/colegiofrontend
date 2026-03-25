'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken, isTokenExpired } from '@/utils/auth';

// Hook to protect pages that require authentication
export const useAuth = () => {
  const router = useRouter();

  useEffect(() => {
    const token = getAuthToken();
    if (!token || isTokenExpired(token)) {
      // Clear any remaining auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('token_expiration');
      document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      // Redirect to login
      router.push('/login');
    }
  }, [router]);
};

// Helper to check auth without redirect (for use inside components)
export const useCheckAuth = () => {
  const router = useRouter();

  return () => {
    const token = getAuthToken();
    if (!token || isTokenExpired(token)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('token_expiration');
      document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      router.push('/login');
      return false;
    }
    return true;
  };
};