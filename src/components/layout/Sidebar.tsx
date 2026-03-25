import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';

interface SidebarProps {
  onLogout: () => void;
  userRole?: string;
}

export const Sidebar = ({ onLogout, userRole }: SidebarProps) => {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Inicio', path: '/dashboard', icon: '🏠' },
    { name: 'Estudiantes', path: '/dashboard/estudiantes', icon: '🎓' },
    { name: 'Matrículas', path: '/dashboard/matriculas', icon: '📝' },
    { name: 'Calificaciones', path: '/dashboard/calificaciones', icon: '📊' },
    { name: 'Asistencia', path: '/dashboard/asistencia', icon: '⏱️' },
    { name: 'Observador', path: '/dashboard/observador', icon: '📋' },
    { name: 'Circulares', path: '/dashboard/circulares', icon: '📢' },
    { name: 'Docentes/Emp.', path: '/dashboard/empleados', icon: '👨‍🏫' },
    { name: 'Acudientes', path: '/dashboard/acudientes', icon: '👨‍👩‍👧' },
    { name: 'Grupos', path: '/dashboard/grupos', icon: '👥' },
    { name: 'Nómina', path: '/dashboard/nomina', icon: '💸' },
    { name: 'Finanzas', path: '/dashboard/financiero', icon: '🏦' },
    { name: 'Inventario', path: '/dashboard/inventario', icon: '📦' },
    { name: 'Contabilidad', path: '/dashboard/contabilidad', icon: '📖' },
    { name: 'Evaluación', path: '/dashboard/evaluacion', icon: '📑' },
    { name: 'Reportes', path: '/dashboard/reportes', icon: '📈' },
    { name: 'Configuración', path: '/dashboard/configuracion', icon: '⚙️' },
    { name: 'Académico', path: '/dashboard/academico', icon: '🎓' },
  ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <h2>EduGestion</h2>
        <span>v1.0</span>
      </div>

      <nav className={styles.nav}>
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link 
              key={item.path} 
              href={item.path}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <span className={styles.icon}>{item.icon}</span>
              <span className={styles.name}>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <button onClick={onLogout} className={styles.logoutBtn}>
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
};
