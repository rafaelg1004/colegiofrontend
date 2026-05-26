'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar, fullMenu } from '@/components/layout/Sidebar';
import Link from 'next/link';
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
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  useEffect(() => {
    // Cerrar el sidebar y el menú de módulos al cambiar de ruta
    setIsSidebarOpen(false);
    setIsMoreMenuOpen(false);
  }, [pathname]);

  const userRole = user?.rol || "estudiante";
  const userMenuItems = fullMenu.filter((item) => item.roles.includes(userRole));

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
      {/* Top bar solo visible en móvil */}
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

      <Sidebar 
        onLogout={handleLogout} 
        userRole={user.rol} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      
      {/* Overlay para cerrar el menú en móvil tocando fuera */}
      {isSidebarOpen && (
        <div 
          className={styles.mobileOverlay} 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className={styles.mainContent}>
        {children}
      </div>

      {/* Barra de Navegación Inferior para Móvil/Tablet */}
      <div className={styles.bottomNav}>
        <Link 
          href="/dashboard" 
          className={`${styles.bottomNavItem} ${pathname === '/dashboard' ? styles.bottomNavItemActive : ''}`}
        >
          <span>🏠</span>
          Inicio
        </Link>
        <Link 
          href="/dashboard/estudiantes" 
          className={`${styles.bottomNavItem} ${pathname.startsWith('/dashboard/estudiantes') ? styles.bottomNavItemActive : ''}`}
        >
          <span>🎓</span>
          Estudiantes
        </Link>
        <Link 
          href="/dashboard/caja" 
          className={`${styles.bottomNavItem} ${pathname.startsWith('/dashboard/caja') ? styles.bottomNavItemActive : ''}`}
        >
          <span>💰</span>
          Caja
        </Link>
        <Link 
          href="/dashboard/financiero" 
          className={`${styles.bottomNavItem} ${pathname.startsWith('/dashboard/financiero') ? styles.bottomNavItemActive : ''}`}
        >
          <span>🏦</span>
          Finanzas
        </Link>
        <button 
          onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
          className={`${styles.bottomNavItem} ${isMoreMenuOpen ? styles.bottomNavItemActive : ''}`}
          style={{ background: 'none', border: 'none', cursor: 'pointer', outline: 'none' }}
        >
          <span>☰</span>
          Módulos
        </button>
      </div>

      {/* Overlay de Todos los Módulos para Móvil */}
      {isMoreMenuOpen && (
        <div className={styles.modulesMenuOverlay}>
          <div className={styles.modulesMenuHeader}>
            <div>
              <h3>Panel de Módulos</h3>
              <span className={styles.userRoleBadge}>{userRole.toUpperCase()}</span>
            </div>
            <button 
              className={styles.closeMenuButton} 
              onClick={() => setIsMoreMenuOpen(false)}
            >
              ✕ Cerrar
            </button>
          </div>
          <div className={styles.modulesGrid}>
            {userMenuItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={styles.moduleTile}
                onClick={() => setIsMoreMenuOpen(false)}
              >
                <span className={styles.moduleTileIcon}>{item.icon}</span>
                <span className={styles.moduleTileName}>{item.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
