"use client";

import styles from "./Configuracion.module.css";

interface Usuario {
  id: string;
  rol: string;
  activo: boolean;
  created_at: string;
  email?: string | null;
  empleado?: { primer_nombre: string; primer_apellido: string; cargo: string };
  acudiente?: { primer_nombre: string; primer_apellido: string };
  estudiante?: {
    primer_nombre: string;
    primer_apellido: string;
    numero_documento?: string;
  };
}

interface FormUsuario {
  nombre: string;
  email: string;
  password: string;
  rol: string;
}

interface UsuariosManagerProps {
  usuarios: Usuario[];
  formUsuario: FormUsuario;
  setFormUsuario: (data: FormUsuario) => void;
  rolFiltro: string;
  setRolFiltro: (rol: string) => void;
  onCreate: () => void;
  onToggle: (userId: string, activo: boolean) => void;
  onRefresh: () => void;
  loading: boolean;
}

const rolesDisponibles = [
  { value: "docente", label: "Docente" },
  { value: "estudiante", label: "Estudiante" },
  { value: "padre", label: "Padre/Acudiente" },
  { value: "coordinador", label: "Coordinador" },
  { value: "rector", label: "Rector" },
  { value: "admin", label: "Administrador" },
];

export function UsuariosManager({
  usuarios,
  formUsuario,
  setFormUsuario,
  rolFiltro,
  setRolFiltro,
  onCreate,
  onToggle,
  onRefresh,
  loading,
}: UsuariosManagerProps) {
  const usuariosFiltrados = rolFiltro
    ? usuarios.filter((u) => u.rol === rolFiltro)
    : usuarios;

  const getNombreUsuario = (u: Usuario) => {
    if (u.empleado)
      return `${u.empleado.primer_nombre} ${u.empleado.primer_apellido}`;
    if (u.estudiante)
      return `${u.estudiante.primer_nombre} ${u.estudiante.primer_apellido}`;
    if (u.acudiente)
      return `${u.acudiente.primer_nombre} ${u.acudiente.primer_apellido}`;
    // Si no hay relación, mostrar email como nombre temporal
    return u.email || "Sin nombre";
  };

  const getEmail = (u: Usuario) => {
    return u.email || "Sin email";
  };

  return (
    <div className={styles.card}>
      <h3 className={styles.cardTitle}>Gestión de Usuarios</h3>

      {/* Formulario de creación */}
      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label>Nombre</label>
          <input
            placeholder="Nombre completo"
            value={formUsuario.nombre}
            onChange={(e) =>
              setFormUsuario({ ...formUsuario, nombre: e.target.value })
            }
          />
        </div>
        <div className={styles.formGroup}>
          <label>Email</label>
          <input
            type="email"
            placeholder="correo@ejemplo.com"
            value={formUsuario.email}
            onChange={(e) =>
              setFormUsuario({ ...formUsuario, email: e.target.value })
            }
          />
        </div>
        <div className={styles.formGroup}>
          <label>Contraseña</label>
          <input
            type="password"
            placeholder="Contraseña"
            value={formUsuario.password}
            onChange={(e) =>
              setFormUsuario({ ...formUsuario, password: e.target.value })
            }
          />
        </div>
        <div className={styles.formGroup}>
          <label>Rol</label>
          <select
            value={formUsuario.rol}
            onChange={(e) =>
              setFormUsuario({ ...formUsuario, rol: e.target.value })
            }
          >
            {rolesDisponibles.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.actions}>
        <button
          onClick={onCreate}
          disabled={loading}
          className={styles.btnPrimary}
        >
          Crear Usuario
        </button>
      </div>

      {/* Filtro */}
      <div className={styles.filterBar}>
        <label>Filtrar por rol:</label>
        <select
          value={rolFiltro}
          onChange={(e) => setRolFiltro(e.target.value)}
        >
          <option value="">Todos</option>
          {rolesDisponibles.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <button onClick={onRefresh} className={styles.btnSecondary}>
          🔄 Actualizar
        </button>
      </div>

      {/* Tabla de usuarios */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuariosFiltrados.map((u) => (
              <tr key={u.id}>
                <td>{getNombreUsuario(u)}</td>
                <td>{getEmail(u)}</td>
                <td>
                  <span className={`${styles.badge} ${styles[u.rol]}`}>
                    {u.rol}
                  </span>
                </td>
                <td>
                  <span className={u.activo ? styles.activo : styles.inactivo}>
                    {u.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => onToggle(u.id, u.activo)}
                    className={
                      u.activo ? styles.btnDesactivar : styles.btnActivar
                    }
                  >
                    {u.activo ? "Desactivar" : "Activar"}
                  </button>
                </td>
              </tr>
            ))}
            {usuariosFiltrados.length === 0 && (
              <tr>
                <td colSpan={5} className={styles.empty}>
                  No hay usuarios registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
