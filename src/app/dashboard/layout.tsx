'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { getAuthToken, clearAuthCookie } from '@/utils/auth';
import styles from './DashboardLayout.module.css';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkSession = () => {
      const storedUser = localStorage.getItem('user');
      const token = getAuthToken();

      console.log('🔍 Validando sesión...', { hasUser: !!storedUser, hasToken: !!token });

      if (!storedUser || !token || token === 'undefined' || token === 'null') {
        console.warn('🚫 Sesión inválida, redirigiendo...');
        router.replace('/login');
        return;
      }

      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsReady(true);
        console.log('✅ Sesión válida para:', parsedUser.email);
      } catch (err) {
        console.error('❌ Error parseando usuario:', err);
        router.replace('/login');
      }
    };

    // Pequeño retardo para asegurar que localStorage/cookies estén listos tras el login
    const timer = setTimeout(checkSession, 100);
    return () => clearTimeout(timer);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    clearAuthCookie();
    router.push('/login');
  };

  if (!isReady) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <span>Verificando seguridad...</span>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <Sidebar onLogout={handleLogout} userRole={user.rol} />
      <div className={styles.mainContent}>
        {children}
      </div>
    </div>
  );
}
