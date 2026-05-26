'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { getAuthToken, clearAuthCookie, isTokenExpired } from '@/utils/auth';
import styles from './DashboardLayout.module.css';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkSession = () => {
      const storedUser = localStorage.getItem('user');
      const token = getAuthToken();

      console.log('🔍 Validando sesión...', { hasUser: !!storedUser, hasToken: !!token });

      if (!storedUser || !token || token === 'undefined' || token === 'null') {
        console.warn('🚫 Sesión inválida, redirigiendo...');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        clearAuthCookie();
        router.replace('/login');
        return;
      }

      // Check if token is expired
      if (isTokenExpired(token)) {
        console.warn('🚫 Token expirado, redirigiendo...');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('token_expiration');
        clearAuthCookie();
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

    // Verificar inmediatamente al cambiar de ruta
    checkSession();
  }, [router, pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('token_expiration');
    clearAuthCookie();
    router.push('/login');
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    // Cerrar el sidebar móvil al cambiar de ruta
    setIsSidebarOpen(false);
  }, [pathname]);

  if (!isReady) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <span>Verificando seguridad...</span>
      </div>
    );
  }

  const isCajaPage = pathname === '/dashboard/caja';

  return (
    <div className={styles.layout}>
      {/* Top bar solo visible en móvil */}
      {!isCajaPage && (
        <div className={styles.mobileTopBar}>
          <div className={styles.mobileLogo}>
            <h2>EduGestion</h2>
          </div>
          <button 
            className={styles.menuButton} 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label="Toggle menu"
          >
            {isSidebarOpen ? '✕' : '☰'}
          </button>
        </div>
      )}

      {(!isCajaPage || isSidebarOpen) && (
        <Sidebar 
          onLogout={handleLogout} 
          userRole={user.rol} 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
        />
      )}
      
      {/* Overlay para cerrar el menú en móvil tocando fuera */}
      {isSidebarOpen && (
        <div 
          className={styles.mobileOverlay} 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className={`${styles.mainContent} ${isCajaPage ? styles.cajaMainContent : ''}`}>
        {children}
      </div>
    </div>
  );
}
