import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Sidebar.module.css";

interface SidebarProps {
  onLogout: () => void;
  userRole?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

// Menú completo solo para admin/rector/coordinador
const fullMenu = [
  {
    name: "Inicio",
    path: "/dashboard",
    icon: "🏠",
    roles: ["admin", "rector", "coordinador", "secretaria", "docente", "estudiante", "acudiente"],
  },
  // --- GESTIÓN ACADÉMICA CORE ---
  {
    name: "Estudiantes",
    path: "/dashboard/estudiantes",
    icon: "🎓",
    roles: ["admin", "rector", "coordinador", "secretaria"],
  },
  {
    name: "Matrículas",
    path: "/dashboard/matriculas",
    icon: "📝",
    roles: ["admin", "rector", "coordinador", "secretaria"],
  },
  {
    name: "Grupos",
    path: "/dashboard/grupos",
    icon: "👥",
    roles: ["admin", "rector", "coordinador", "docente"],
  },
  {
    name: "Académico",
    path: "/dashboard/academico",
    icon: "📚",
    roles: ["admin", "rector", "coordinador", "docente"],
  },
  // --- PROCESO EDUCATIVO ---
  {
    name: "Evaluación",
    path: "/dashboard/evaluacion",
    icon: "📑",
    roles: ["admin", "rector", "coordinador", "docente"],
  },
  {
    name: "Calificaciones",
    path: "/dashboard/calificaciones",
    icon: "📊",
    roles: ["admin", "rector", "coordinador", "docente", "estudiante", "acudiente"],
  },
  {
    name: "Asistencia",
    path: "/dashboard/asistencia",
    icon: "⏱️",
    roles: ["admin", "rector", "coordinador", "docente", "estudiante", "acudiente"],
  },
  {
    name: "Observador",
    path: "/dashboard/observador",
    icon: "📋",
    roles: ["admin", "rector", "coordinador", "docente"],
  },
  // --- COMUNICACIÓN Y PERSONAS ---
  {
    name: "Circulares",
    path: "/dashboard/circulares",
    icon: "📢",
    roles: ["admin", "rector", "coordinador", "secretaria", "docente", "estudiante", "acudiente"],
  },
  {
    name: "Docentes/Emp.",
    path: "/dashboard/empleados",
    icon: "👨‍🏫",
    roles: ["admin", "rector", "coordinador", "secretaria"],
  },
  {
    name: "Acudientes",
    path: "/dashboard/acudientes",
    icon: "👨‍👩‍👧",
    roles: ["admin", "rector", "coordinador", "secretaria"],
  },
  // --- ADMINISTRACIÓN Y FINANZAS ---
  {
    name: "Nómina",
    path: "/dashboard/nomina",
    icon: "💸",
    roles: ["admin", "rector", "coordinador"],
  },
  {
    name: "Finanzas",
    path: "/dashboard/financiero",
    icon: "🏦",
    roles: ["admin", "rector", "coordinador", "secretaria"],
  },
  {
    name: "Caja",
    path: "/dashboard/caja",
    icon: "💰",
    roles: ["admin", "rector", "coordinador", "secretaria"],
  },
  {
    name: "Inventario",
    path: "/dashboard/inventario",
    icon: "📦",
    roles: ["admin", "rector", "coordinador", "secretaria"],
  },
  // --- SISTEMA ---
  {
    name: "Usuarios",
    path: "/dashboard/usuarios",
    icon: "👤",
    roles: ["admin", "rector", "coordinador"],
  },
  {
    name: "Reportes",
    path: "/dashboard/reportes",
    icon: "📈",
    roles: ["admin", "rector", "coordinador"],
  },
  {
    name: "Configuración",
    path: "/dashboard/configuracion",
    icon: "⚙️",
    roles: ["admin", "rector", "coordinador"],
  },
];

export const Sidebar = ({ onLogout, userRole, isOpen = false, onClose }: SidebarProps) => {
  const pathname = usePathname();
  const role = userRole || "estudiante";

  // Filtrar menú según rol
  const menuItems = fullMenu.filter((item) => item.roles.includes(role));

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}>
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
              prefetch={false}
              className={`${styles.navItem} ${isActive ? styles.active : ""}`}
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
