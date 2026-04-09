"use client";

import { useEffect, useState } from "react";
import { getAuthToken } from "@/utils/auth";
import { API_URL } from "@/utils/api";
import styles from "./Usuarios.module.css";

const API = `${API_URL}`;

interface Usuario {
  id: string;
  rol: string;
  activo: boolean;
  created_at: string;
  empleado?: { primer_nombre: string; primer_apellido: string; cargo: string };
  acudiente?: { primer_nombre: string; primer_apellido: string };
  estudiante?: {
    primer_nombre: string;
    primer_apellido: string;
    numero_documento?: string;
  };
}

interface Empleado {
  id: string;
  primer_nombre: string;
  primer_apellido: string;
  cargo: string;
  correo_electronico: string;
}

interface Estudiante {
  id: string;
  primer_nombre: string;
  primer_apellido: string;
  numero_documento: string;
  correo_electronico?: string;
}

export default function UsuariosPage() {
  const [activeTab, setActiveTab] = useState("listar");
  const [loading, setLoading] = useState(false);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [filtroRol, setFiltroRol] = useState("");

  // Formulario crear usuario
  const [tipoUsuario, setTipoUsuario] = useState<
    "docente" | "estudiante" | "admin"
  >("docente");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [empleadoId, setEmpleadoId] = useState("");
  const [estudianteId, setEstudianteId] = useState("");

  useEffect(() => {
    cargarUsuarios();
    cargarEmpleados();
    cargarEstudiantes();
  }, []);

  const cargarUsuarios = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const params = new URLSearchParams();
      if (filtroRol) params.append("rol", filtroRol);

      const res = await fetch(`${API}/auth/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error al cargar usuarios");
      const data = await res.json();
      setUsuarios(data || []);
    } catch (err) {
      console.error("Error cargando usuarios:", err);
    }
  };

  const cargarEmpleados = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      console.log("🔍 Cargando empleados desde:", `${API}/empleados`);
      const res = await fetch(`${API}/empleados`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("📡 Respuesta empleados status:", res.status);
      if (!res.ok) throw new Error(`Error al cargar empleados: ${res.status}`);
      const data = await res.json();
      console.log("📦 Datos empleados crudos:", data);
      // El endpoint de empleados devuelve un array directo
      const empleadosArray = Array.isArray(data) ? data : data.data || [];
      console.log(
        "✅ Empleados procesados:",
        empleadosArray.length,
        empleadosArray,
      );
      setEmpleados(empleadosArray);
    } catch (err) {
      console.error("❌ Error cargando empleados:", err);
      setEmpleados([]);
    }
  };

  const cargarEstudiantes = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      console.log(
        "🔍 Cargando estudiantes desde:",
        `${API}/estudiantes?limit=100`,
      );
      const res = await fetch(`${API}/estudiantes?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("📡 Respuesta estudiantes status:", res.status);
      if (!res.ok)
        throw new Error(`Error al cargar estudiantes: ${res.status}`);
      const data = await res.json();
      console.log("📦 Datos estudiantes crudos:", data);
      // El endpoint de estudiantes devuelve { data: [], meta: {} }
      const estudiantesArray = Array.isArray(data) ? data : data.data || [];
      console.log(
        "✅ Estudiantes procesados:",
        estudiantesArray.length,
        estudiantesArray,
      );
      setEstudiantes(estudiantesArray);
    } catch (err) {
      console.error("❌ Error cargando estudiantes:", err);
      setEstudiantes([]);
    }
  };

  const crearUsuario = async () => {
    if (!email || !password) {
      alert("Complete email y contraseña");
      return;
    }

    if (tipoUsuario === "docente" && !empleadoId) {
      alert("Seleccione un empleado/docente");
      return;
    }

    if (tipoUsuario === "estudiante" && !estudianteId) {
      alert("Seleccione un estudiante");
      return;
    }

    // Admin no requiere vinculación

    setLoading(true);
    const token = getAuthToken();

    try {
      const body: any = {
        email,
        password,
        rol: tipoUsuario,
      };

      if (tipoUsuario === "docente" && empleadoId) {
        body.empleado_id = empleadoId;
      } else if (tipoUsuario === "estudiante" && estudianteId) {
        body.estudiante_id = estudianteId;
      }

      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Error al crear usuario");
      }

      alert("Usuario creado exitosamente");
      setEmail("");
      setPassword("");
      setEmpleadoId("");
      setEstudianteId("");
      cargarUsuarios();
      setActiveTab("listar");
    } catch (err: any) {
      alert(err.message || "Error al crear usuario");
    } finally {
      setLoading(false);
    }
  };

  const toggleActivo = async (userId: string, activo: boolean) => {
    const token = getAuthToken();
    try {
      const res = await fetch(`${API}/auth/toggle-active`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: userId, activo: !activo }),
      });

      if (!res.ok) throw new Error("Error al cambiar estado");
      cargarUsuarios();
    } catch (err) {
      alert("Error al cambiar estado del usuario");
    }
  };

  const getNombreUsuario = (u: Usuario) => {
    if (u.empleado)
      return `${u.empleado.primer_nombre} ${u.empleado.primer_apellido}`;
    if (u.estudiante)
      return `${u.estudiante.primer_nombre} ${u.estudiante.primer_apellido}`;
    if (u.acudiente)
      return `${u.acudiente.primer_nombre} ${u.acudiente.primer_apellido}`;
    return "Sin nombre";
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>👤 Gestión de Usuarios</h1>
        <p>Crear y administrar usuarios del sistema</p>
      </header>

      <div className={styles.tabs}>
        <button
          className={activeTab === "listar" ? styles.active : ""}
          onClick={() => setActiveTab("listar")}
        >
          📋 Listar Usuarios
        </button>
        <button
          className={activeTab === "crear" ? styles.active : ""}
          onClick={() => setActiveTab("crear")}
        >
          ➕ Crear Usuario
        </button>
      </div>

      {/* Tab: Listar */}
      {activeTab === "listar" && (
        <div className={styles.listContainer}>
          <div className={styles.filtros}>
            <select
              value={filtroRol}
              onChange={(e) => {
                setFiltroRol(e.target.value);
                cargarUsuarios();
              }}
            >
              <option value="">Todos los roles</option>
              <option value="docente">Docente</option>
              <option value="estudiante">Estudiante</option>
              <option value="admin">Admin</option>
              <option value="rector">Rector</option>
              <option value="coordinador">Coordinador</option>
              <option value="secretaria">Secretaria</option>
              <option value="acudiente">Acudiente</option>
            </select>
            <button onClick={cargarUsuarios}>🔄 Actualizar</button>
          </div>

          <table className={styles.table}>
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Vinculado a</th>
                <th>Estado</th>
                <th>Creado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td>{getNombreUsuario(u)}</td>
                  <td>
                    <span className={`${styles.badge} ${styles[u.rol]}`}>
                      {u.rol}
                    </span>
                  </td>
                  <td>
                    {u.empleado?.cargo || u.estudiante?.numero_documento || "-"}
                  </td>
                  <td>
                    <span
                      className={u.activo ? styles.activo : styles.inactivo}
                    >
                      {u.activo ? "✅ Activo" : "❌ Inactivo"}
                    </span>
                  </td>
                  <td>{new Date(u.created_at).toLocaleDateString("es-CO")}</td>
                  <td>
                    <button
                      className={
                        u.activo ? styles.btnDesactivar : styles.btnActivar
                      }
                      onClick={() => toggleActivo(u.id, u.activo)}
                    >
                      {u.activo ? "Desactivar" : "Activar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Crear */}
      {activeTab === "crear" && (
        <div className={styles.formContainer}>
          <div className={styles.tipoSelector}>
            <label>Tipo de Usuario:</label>
            <div className={styles.tipoButtons}>
              <button
                className={tipoUsuario === "admin" ? styles.activeTipo : ""}
                onClick={() => setTipoUsuario("admin")}
                type="button"
              >
                🔐 Admin
              </button>
              <button
                className={tipoUsuario === "docente" ? styles.activeTipo : ""}
                onClick={() => setTipoUsuario("docente")}
                type="button"
              >
                👨‍🏫 Docente
              </button>
              <button
                className={
                  tipoUsuario === "estudiante" ? styles.activeTipo : ""
                }
                onClick={() => setTipoUsuario("estudiante")}
                type="button"
              >
                🎓 Estudiante
              </button>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Correo Electrónico</label>
            <input
              type="email"
              placeholder="usuario@colegio.edu.co"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Contraseña</label>
            <input
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
            />
          </div>

          {tipoUsuario === "admin" && (
            <div className={styles.formGroup}>
              <div className={styles.info}>
                ℹ️ El usuario <strong>Admin</strong> no requiere vinculación con
                empleado ni estudiante. Tendrá acceso completo al sistema.
              </div>
            </div>
          )}

          {tipoUsuario === "docente" && (
            <div className={styles.formGroup}>
              <label>Seleccionar Docente/Empleado</label>
              {empleados.length === 0 ? (
                <div className={styles.alert}>
                  ⚠️ No hay empleados registrados.
                  <a href="/dashboard/empleados">
                    Cree un empleado primero
                  </a>{" "}
                  para poder vincularlo.
                </div>
              ) : (
                <select
                  value={empleadoId}
                  onChange={(e) => setEmpleadoId(e.target.value)}
                >
                  <option value="">Seleccione...</option>
                  {empleados.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.primer_nombre} {emp.primer_apellido} - {emp.cargo}
                    </option>
                  ))}
                </select>
              )}
              <small className={styles.help}>
                El empleado debe estar registrado previamente en el módulo de
                Docentes/Empleados
              </small>
            </div>
          )}

          {tipoUsuario === "estudiante" && (
            <div className={styles.formGroup}>
              <label>Seleccionar Estudiante</label>
              {estudiantes.length === 0 ? (
                <div className={styles.alert}>
                  ⚠️ No hay estudiantes registrados.
                  <a href="/dashboard/estudiantes">
                    Cree un estudiante primero
                  </a>{" "}
                  para poder vincularlo.
                </div>
              ) : (
                <select
                  value={estudianteId}
                  onChange={(e) => setEstudianteId(e.target.value)}
                >
                  <option value="">Seleccione...</option>
                  {estudiantes.map((est) => (
                    <option key={est.id} value={est.id}>
                      {est.primer_nombre} {est.primer_apellido} - Doc:{" "}
                      {est.numero_documento}
                    </option>
                  ))}
                </select>
              )}
              <small className={styles.help}>
                El estudiante debe estar registrado previamente en el módulo de
                Estudiantes
              </small>
            </div>
          )}

          <button
            className={styles.saveBtn}
            onClick={crearUsuario}
            disabled={loading}
          >
            {loading ? "Creando..." : "💾 Crear Usuario"}
          </button>
        </div>
      )}
    </div>
  );
}
