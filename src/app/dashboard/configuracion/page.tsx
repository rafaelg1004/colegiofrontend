"use client";

import { useEffect, useState } from "react";
import { getAuthToken } from "@/utils/auth";
import { API_URL } from "@/utils/api";
import styles from "./Configuracion.module.css";

interface Institucion {
  id?: string;
  nombre: string;
  nit: string;
  direccion?: string;
  telefono?: string;
  correo_electronico?: string;
  logo_url?: string;
  rector?: string;
  resolucion_aprobacion?: string;
  dane?: string;
  jornadas?: string[];
}

interface Nivel {
  id: string;
  nombre: string;
  grado?: any[];
}

interface Grado {
  id: string;
  nombre: string;
  codigo?: string;
  orden: number;
  nivel_id: string;
  nivel?: { nombre: string };
}

interface TipoActividad {
  id: string;
  nombre: string;
}

interface ConceptoCobro {
  id: string;
  nombre: string;
  valor: number;
  periodicidad: string;
  aplica_iva: boolean;
  porcentaje_iva: number;
  activo: boolean;
  afecta_inventario: boolean;
  es_compuesto: boolean;
  categoria_inventario_id?: string;
  categoria_inventario?: { id: string; nombre: string };
}

interface Usuario {
  id: string;
  email: string;
  nombre: string;
  rol: string;
  activo: boolean;
  created_at: string;
}

const API = `${API_URL}`;

export default function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState("institucion");
  const [loading, setLoading] = useState(false);

  // Datos
  const [institucion, setInstitucion] = useState<Institucion | null>(null);
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [grados, setGrados] = useState<Grado[]>([]);
  const [tiposActividad, setTiposActividad] = useState<TipoActividad[]>([]);
  const [conceptosCobro, setConceptosCobro] = useState<ConceptoCobro[]>([]);
  const [categoriasInventario, setCategoriasInventario] = useState<
    { id: string; nombre: string }[]
  >([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [rolFiltro, setRolFiltro] = useState("");

  // Forms
  const [formInstitucion, setFormInstitucion] = useState<Institucion>({
    nombre: "",
    nit: "",
    direccion: "",
    telefono: "",
    correo_electronico: "",
    jornadas: ["Mañana"],
  });
  const [formNivel, setFormNivel] = useState({ nombre: "" });
  const [formGrado, setFormGrado] = useState({
    nombre: "",
    codigo: "",
    orden: 1,
    nivel_id: "",
  });
  const [formTipoActividad, setFormTipoActividad] = useState({ nombre: "" });
  const [formConceptoCobro, setFormConceptoCobro] = useState({
    nombre: "",
    valor: 0,
    periodicidad: "Única",
    aplica_iva: false,
    porcentaje_iva: 0,
    afecta_inventario: false,
    categoria_inventario_id: "",
  });
  const [editingConcepto, setEditingConcepto] = useState<ConceptoCobro | null>(
    null,
  );
  const [formUsuario, setFormUsuario] = useState({
    nombre: "",
    email: "",
    password: "",
    rol: "docente",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      setLoading(true);
      const [
        resInst,
        resNiveles,
        resGrados,
        resTipos,
        resConceptos,
        resCategorias,
        resUsuarios,
      ] = await Promise.all([
        fetch(`${API}/configuracion/institucion`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API}/configuracion/niveles`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API}/configuracion/grados`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API}/configuracion/tipos-actividad`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API}/configuracion/conceptos-cobro`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API}/inventario/categorias`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API}/auth/users`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!resInst.ok || !resNiveles.ok || !resGrados.ok || !resTipos.ok) {
        console.error("Error cargando datos de configuración");
        alert("Error al cargar datos de configuración");
        return;
      }

      const instData = await resInst.json();
      const nivelesData = await resNiveles.json();
      const gradosData = await resGrados.json();
      const tiposData = await resTipos.json();
      const conceptosData = resConceptos.ok ? await resConceptos.json() : [];
      const categoriasData = resCategorias.ok ? await resCategorias.json() : [];
      const usuariosData = resUsuarios.ok ? await resUsuarios.json() : [];

      if (instData) {
        setInstitucion(instData);
        setFormInstitucion({
          nombre: instData.nombre || "",
          nit: instData.nit || "",
          direccion: instData.direccion || "",
          telefono: instData.telefono || "",
          correo_electronico: instData.correo_electronico || "",
          rector: instData.rector || "",
          dane: instData.dane || "",
          resolucion_aprobacion: instData.resolucion_aprobacion || "",
          jornadas: instData.jornadas || ["Mañana"],
        });
      }
      setNiveles(nivelesData || []);
      setGrados(gradosData || []);
      setTiposActividad(tiposData || []);
      setConceptosCobro(conceptosData || []);
      setCategoriasInventario(categoriasData || []);
      setUsuarios(usuariosData || []);
    } catch (err) {
      console.error("Error cargando datos:", err);
      alert("Error de conexión al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  // ======================
  // INSTITUCIÓN
  // ======================
  const handleSaveInstitucion = async () => {
    setLoading(true);
    const token = getAuthToken();
    try {
      let res;
      if (institucion?.id) {
        res = await fetch(
          `${API}/configuracion/institucion/${institucion.id}`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(formInstitucion),
          },
        );
      } else {
        res = await fetch(`${API}/configuracion/institucion`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formInstitucion),
        });
      }
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Error al guardar");
      }
      loadData();
      alert("Institución guardada correctamente");
    } catch (err: any) {
      alert(err.message || "Error guardando");
    }
    setLoading(false);
  };

  // ======================
  // NIVELES
  // ======================
  const handleSaveNivel = async () => {
    if (!formNivel.nombre) return;
    setLoading(true);
    const token = getAuthToken();
    try {
      const res = await fetch(`${API}/configuracion/niveles`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formNivel),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Error al crear nivel");
      }
      setFormNivel({ nombre: "" });
      loadData();
      alert("Nivel creado correctamente");
    } catch (err: any) {
      alert(err.message || "Error guardando");
    }
    setLoading(false);
  };

  // ======================
  // GRADOS
  // ======================
  const handleSaveGrado = async () => {
    if (!formGrado.nombre || !formGrado.nivel_id) {
      alert("Complete el nombre y seleccione un nivel");
      return;
    }
    setLoading(true);
    const token = getAuthToken();
    try {
      const res = await fetch(`${API}/configuracion/grados`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formGrado),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Error al crear grado");
      }
      setFormGrado({ nombre: "", codigo: "", orden: 1, nivel_id: "" });
      loadData();
      alert("Grado creado correctamente");
    } catch (err: any) {
      alert(err.message || "Error guardando");
    }
    setLoading(false);
  };

  const handleDeleteGrado = async (id: string) => {
    if (!confirm("¿Eliminar grado?")) return;
    const token = getAuthToken();
    try {
      const res = await fetch(`${API}/configuracion/grados/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Error al eliminar");
      }
      loadData();
      alert("Grado eliminado correctamente");
    } catch (err: any) {
      alert(err.message || "Error al eliminar");
    }
  };

  // ======================
  // TIPOS DE ACTIVIDAD
  // ======================
  const handleSaveTipoActividad = async () => {
    if (!formTipoActividad.nombre) return;
    setLoading(true);
    const token = getAuthToken();
    try {
      const res = await fetch(`${API}/configuracion/tipos-actividad`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formTipoActividad),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Error al crear tipo");
      }
      setFormTipoActividad({ nombre: "" });
      loadData();
      alert("Tipo de actividad creado correctamente");
    } catch (err: any) {
      alert(err.message || "Error guardando");
    }
    setLoading(false);
  };

  const handleDeleteTipoActividad = async (id: string) => {
    if (!confirm("¿Eliminar tipo de actividad?")) return;
    const token = getAuthToken();
    try {
      const res = await fetch(`${API}/configuracion/tipos-actividad/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Error al eliminar");
      }
      loadData();
      alert("Tipo de actividad eliminado correctamente");
    } catch (err: any) {
      alert(err.message || "Error al eliminar");
    }
  };

  // ======================
  // CONCEPTOS DE COBRO
  // ======================
  const handleCreateConceptoCobro = async () => {
    if (!formConceptoCobro.nombre) {
      alert("El nombre es obligatorio");
      return;
    }
    setLoading(true);
    const token = getAuthToken();
    try {
      // Siempre crear sin inventario desde Configuración
      const dataToSend = {
        ...formConceptoCobro,
        afecta_inventario: false,
        categoria_inventario_id: null,
      };
      const res = await fetch(`${API}/configuracion/conceptos-cobro`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Error al crear concepto");
      }
      setFormConceptoCobro({
        nombre: "",
        valor: 0,
        periodicidad: "Única",
        aplica_iva: false,
        porcentaje_iva: 0,
        afecta_inventario: false,
        categoria_inventario_id: "",
      });
      loadData();
      alert("Concepto de cobro creado correctamente");
    } catch (err: any) {
      alert(err.message || "Error al crear concepto");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateConceptoCobro = async () => {
    if (!editingConcepto) return;
    if (!formConceptoCobro.nombre) {
      alert("El nombre es obligatorio");
      return;
    }
    setLoading(true);
    const token = getAuthToken();
    try {
      // No permitir cambiar afecta_inventario desde Configuración
      const dataToSend = {
        ...formConceptoCobro,
        afecta_inventario: false,
        categoria_inventario_id: null,
      };
      const res = await fetch(
        `${API}/configuracion/conceptos-cobro/${editingConcepto.id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(dataToSend),
        },
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Error al actualizar concepto");
      }
      setEditingConcepto(null);
      setFormConceptoCobro({
        nombre: "",
        valor: 0,
        periodicidad: "Única",
        aplica_iva: false,
        porcentaje_iva: 0,
        afecta_inventario: false,
        categoria_inventario_id: "",
      });
      loadData();
      alert("Concepto de cobro actualizado correctamente");
    } catch (err: any) {
      alert(err.message || "Error al actualizar concepto");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConceptoCobro = async (id: string) => {
    if (!confirm("¿Eliminar este concepto de cobro?")) return;
    const token = getAuthToken();
    try {
      const res = await fetch(`${API}/configuracion/conceptos-cobro/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Error al eliminar");
      }
      loadData();
      alert("Concepto de cobro eliminado correctamente");
    } catch (err: any) {
      alert(err.message || "Error al eliminar");
    }
  };

  const startEditConcepto = (concepto: ConceptoCobro) => {
    setEditingConcepto(concepto);
    setFormConceptoCobro({
      nombre: concepto.nombre ?? "",
      valor: concepto.valor ?? 0,
      periodicidad: concepto.periodicidad ?? "Única",
      aplica_iva: concepto.aplica_iva ?? false,
      porcentaje_iva: concepto.porcentaje_iva ?? 0,
      afecta_inventario: concepto.afecta_inventario ?? false,
      categoria_inventario_id: concepto.categoria_inventario_id ?? "",
    });
  };

  const cancelEditConcepto = () => {
    setEditingConcepto(null);
    setFormConceptoCobro({
      nombre: "",
      valor: 0,
      periodicidad: "Única",
      aplica_iva: false,
      porcentaje_iva: 0,
      afecta_inventario: false,
      categoria_inventario_id: "",
    });
  };

  // ======================
  // USUARIOS
  // ======================
  const handleCreateUsuario = async () => {
    if (!formUsuario.nombre || !formUsuario.email || !formUsuario.password) {
      alert("Complete todos los campos");
      return;
    }
    setLoading(true);
    const token = getAuthToken();
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formUsuario),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Error al crear usuario");
      }
      setFormUsuario({ nombre: "", email: "", password: "", rol: "docente" });
      loadData();
      alert("Usuario creado correctamente");
    } catch (err: any) {
      alert(err.message || "Error guardando");
    }
    setLoading(false);
  };

  const handleToggleUsuario = async (userId: string, activo: boolean) => {
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
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Error al cambiar estado");
      }
      loadData();
      alert(activo ? "Usuario desactivado" : "Usuario activado");
    } catch (err: any) {
      alert(err.message || "Error al cambiar estado");
    }
  };

  const usuariosFiltrados = rolFiltro
    ? usuarios.filter((u) => u.rol === rolFiltro)
    : usuarios;

  const rolesDisponibles = [
    { value: "docente", label: "Docente" },
    { value: "estudiante", label: "Estudiante" },
    { value: "padre", label: "Padre/Acudiente" },
    { value: "coordinador", label: "Coordinador" },
    { value: "rector", label: "Rector" },
    { value: "admin", label: "Administrador" },
  ];

  const tabs = [
    { id: "institucion", label: "Institución" },
    { id: "usuarios", label: "Usuarios" },
    { id: "niveles", label: "Niveles" },
    { id: "grados", label: "Grados" },
    { id: "tipos-actividad", label: "Tipos de Actividad" },
    { id: "conceptos-cobro", label: "Conceptos de Cobro" },
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleSection}>
          <h1>Configuración del Sistema</h1>
          <p>Administrar usuarios, niveles, grados y tipos de actividad</p>
        </div>
      </header>

      <div className={styles.tabsContainer}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ""}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {/* INSTITUCIÓN */}
        {activeTab === "institucion" && (
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Datos de la Institución</h3>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Nombre *</label>
                <input
                  placeholder="Nombre de la institución"
                  value={formInstitucion.nombre}
                  onChange={(e) =>
                    setFormInstitucion({
                      ...formInstitucion,
                      nombre: e.target.value,
                    })
                  }
                />
              </div>
              <div className={styles.formGroup}>
                <label>NIT *</label>
                <input
                  placeholder="NIT"
                  value={formInstitucion.nit}
                  onChange={(e) =>
                    setFormInstitucion({
                      ...formInstitucion,
                      nit: e.target.value,
                    })
                  }
                />
              </div>
              <div className={styles.formGroup}>
                <label>Dirección</label>
                <input
                  placeholder="Dirección"
                  value={formInstitucion.direccion}
                  onChange={(e) =>
                    setFormInstitucion({
                      ...formInstitucion,
                      direccion: e.target.value,
                    })
                  }
                />
              </div>
              <div className={styles.formGroup}>
                <label>Teléfono</label>
                <input
                  placeholder="Teléfono"
                  value={formInstitucion.telefono}
                  onChange={(e) =>
                    setFormInstitucion({
                      ...formInstitucion,
                      telefono: e.target.value,
                    })
                  }
                />
              </div>
              <div className={styles.formGroup}>
                <label>Correo Electrónico</label>
                <input
                  placeholder="correo@institucion.edu"
                  value={formInstitucion.correo_electronico}
                  onChange={(e) =>
                    setFormInstitucion({
                      ...formInstitucion,
                      correo_electronico: e.target.value,
                    })
                  }
                />
              </div>
              <div className={styles.formGroup}>
                <label>Rector</label>
                <input
                  placeholder="Nombre del rector"
                  value={formInstitucion.rector}
                  onChange={(e) =>
                    setFormInstitucion({
                      ...formInstitucion,
                      rector: e.target.value,
                    })
                  }
                />
              </div>
              <div className={styles.formGroup}>
                <label>Código DANE</label>
                <input
                  placeholder="Código DANE"
                  value={formInstitucion.dane}
                  onChange={(e) =>
                    setFormInstitucion({
                      ...formInstitucion,
                      dane: e.target.value,
                    })
                  }
                />
              </div>
              <div className={styles.formGroup}>
                <label>Resolución de Aprobación</label>
                <input
                  placeholder="Resolución"
                  value={formInstitucion.resolucion_aprobacion}
                  onChange={(e) =>
                    setFormInstitucion({
                      ...formInstitucion,
                      resolucion_aprobacion: e.target.value,
                    })
                  }
                />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <button
                  onClick={handleSaveInstitucion}
                  disabled={loading}
                  className={styles.btnPrimary}
                >
                  {loading ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* USUARIOS */}
        {activeTab === "usuarios" && (
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Crear Nuevo Usuario</h3>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Nombre Completo *</label>
                <input
                  placeholder="Nombre del usuario"
                  value={formUsuario.nombre}
                  onChange={(e) =>
                    setFormUsuario({ ...formUsuario, nombre: e.target.value })
                  }
                />
              </div>
              <div className={styles.formGroup}>
                <label>Correo Electrónico *</label>
                <input
                  type="email"
                  placeholder="correo@colegio.edu"
                  value={formUsuario.email}
                  onChange={(e) =>
                    setFormUsuario({ ...formUsuario, email: e.target.value })
                  }
                />
              </div>
              <div className={styles.formGroup}>
                <label>Contraseña *</label>
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
                <label>Rol *</label>
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
              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <button
                  onClick={handleCreateUsuario}
                  disabled={loading}
                  className={styles.btnPrimary}
                >
                  {loading ? "Creando..." : "Crear Usuario"}
                </button>
              </div>
            </div>

            <h3 className={styles.cardTitle} style={{ marginTop: "2rem" }}>
              Usuarios Registrados
            </h3>
            <div style={{ marginBottom: "1rem" }}>
              <select
                value={rolFiltro}
                onChange={(e) => setRolFiltro(e.target.value)}
                style={{ padding: "0.5rem" }}
              >
                <option value="">Todos los roles</option>
                {rolesDisponibles.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Correo</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuariosFiltrados.map((usuario) => (
                    <tr key={usuario.id}>
                      <td>{usuario.nombre}</td>
                      <td>{usuario.email}</td>
                      <td>
                        <span
                          className={styles.badge}
                          style={{
                            background:
                              usuario.rol === "admin"
                                ? "#fee2e2"
                                : usuario.rol === "rector"
                                  ? "#fef3c7"
                                  : "#dbeafe",
                            color:
                              usuario.rol === "admin"
                                ? "#991b1b"
                                : usuario.rol === "rector"
                                  ? "#92400e"
                                  : "#1e40af",
                          }}
                        >
                          {rolesDisponibles.find((r) => r.value === usuario.rol)
                            ?.label || usuario.rol}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`${styles.badge} ${usuario.activo ? styles.badgeActivo : styles.badgeInactivo}`}
                        >
                          {usuario.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() =>
                            handleToggleUsuario(usuario.id, usuario.activo)
                          }
                          className={styles.btnDanger}
                          style={{
                            background: usuario.activo ? "#f59e0b" : "#10b981",
                          }}
                        >
                          {usuario.activo ? "Desactivar" : "Activar"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {usuariosFiltrados.length === 0 && (
                    <tr>
                      <td colSpan={5} className={styles.empty}>
                        No hay usuarios
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* NIVELES */}
        {activeTab === "niveles" && (
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Niveles Educativos</h3>
            <div className={styles.formGridColumns}>
              <div className={styles.formGroup} style={{ flex: 1 }}>
                <label>Nombre del nivel</label>
                <input
                  placeholder="Ej: Preescolar, Primaria, Secundaria"
                  value={formNivel.nombre}
                  onChange={(e) => setFormNivel({ nombre: e.target.value })}
                />
              </div>
              <button
                onClick={handleSaveNivel}
                disabled={loading}
                className={styles.btnPrimary}
              >
                Agregar
              </button>
            </div>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Grados</th>
                  </tr>
                </thead>
                <tbody>
                  {niveles.map((nivel) => (
                    <tr key={nivel.id}>
                      <td>{nivel.nombre}</td>
                      <td>{nivel.grado?.length || 0}</td>
                    </tr>
                  ))}
                  {niveles.length === 0 && (
                    <tr>
                      <td colSpan={2} className={styles.empty}>
                        No hay niveles registrados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* GRADOS */}
        {activeTab === "grados" && (
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Grados</h3>
            <div className={styles.formGridColumns}>
              <div className={styles.formGroup}>
                <label>Nombre</label>
                <input
                  placeholder="Ej: Primero"
                  value={formGrado.nombre}
                  onChange={(e) =>
                    setFormGrado({ ...formGrado, nombre: e.target.value })
                  }
                />
              </div>
              <div className={styles.formGroup}>
                <label>Código</label>
                <input
                  placeholder="Código"
                  value={formGrado.codigo}
                  onChange={(e) =>
                    setFormGrado({ ...formGrado, codigo: e.target.value })
                  }
                />
              </div>
              <div className={styles.formGroup}>
                <label>Orden</label>
                <input
                  type="number"
                  placeholder="1"
                  value={formGrado.orden}
                  onChange={(e) =>
                    setFormGrado({
                      ...formGrado,
                      orden: parseInt(e.target.value),
                    })
                  }
                  style={{ width: "80px" }}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Nivel</label>
                <select
                  value={formGrado.nivel_id}
                  onChange={(e) =>
                    setFormGrado({ ...formGrado, nivel_id: e.target.value })
                  }
                >
                  <option value="">Seleccionar nivel</option>
                  {niveles.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleSaveGrado}
                disabled={loading}
                className={styles.btnPrimary}
              >
                Agregar
              </button>
            </div>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Código</th>
                    <th>Nivel</th>
                    <th>Orden</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {grados.map((grado) => (
                    <tr key={grado.id}>
                      <td>{grado.nombre}</td>
                      <td className={styles.mono}>{grado.codigo}</td>
                      <td>{grado.nivel?.nombre}</td>
                      <td>{grado.orden}</td>
                      <td>
                        <button
                          onClick={() => handleDeleteGrado(grado.id)}
                          className={styles.btnDanger}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {grados.length === 0 && (
                    <tr>
                      <td colSpan={5} className={styles.empty}>
                        No hay grados registrados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TIPOS DE ACTIVIDAD */}
        {activeTab === "tipos-actividad" && (
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Tipos de Actividad Evaluativa</h3>
            <div className={styles.formGridColumns}>
              <div className={styles.formGroup} style={{ flex: 1 }}>
                <label>Nombre del tipo</label>
                <input
                  placeholder="Ej: Tarea, Examen, Quiz"
                  value={formTipoActividad.nombre}
                  onChange={(e) =>
                    setFormTipoActividad({ nombre: e.target.value })
                  }
                />
              </div>
              <button
                onClick={handleSaveTipoActividad}
                disabled={loading}
                className={styles.btnPrimary}
              >
                Agregar
              </button>
            </div>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {tiposActividad.map((tipo) => (
                    <tr key={tipo.id}>
                      <td>{tipo.nombre}</td>
                      <td>
                        <button
                          onClick={() => handleDeleteTipoActividad(tipo.id)}
                          className={styles.btnDanger}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {tiposActividad.length === 0 && (
                    <tr>
                      <td colSpan={2} className={styles.empty}>
                        No hay tipos de actividad registrados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CONCEPTOS DE COBRO */}
        {activeTab === "conceptos-cobro" && (
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>
              {editingConcepto
                ? "Editar Concepto de Cobro"
                : "Crear Concepto de Cobro"}
            </h3>
            <p
              style={{
                color: "#666",
                marginBottom: "1rem",
                fontSize: "0.9rem",
              }}
            >
              💡 Los conceptos con inventario (📦) se crean automáticamente
              desde el módulo de Inventario.
            </p>
            <div className={styles.formGridColumns}>
              <div className={styles.formGroup}>
                <label>Nombre *</label>
                <input
                  type="text"
                  value={formConceptoCobro.nombre}
                  onChange={(e) =>
                    setFormConceptoCobro({
                      ...formConceptoCobro,
                      nombre: e.target.value,
                    })
                  }
                  placeholder="Ej: Matrícula, Pensión, Uniforme"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Valor</label>
                <input
                  type="number"
                  value={formConceptoCobro.valor}
                  onChange={(e) =>
                    setFormConceptoCobro({
                      ...formConceptoCobro,
                      valor: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Periodicidad</label>
                <select
                  value={formConceptoCobro.periodicidad}
                  onChange={(e) =>
                    setFormConceptoCobro({
                      ...formConceptoCobro,
                      periodicidad: e.target.value,
                    })
                  }
                >
                  <option value="Única">Única</option>
                  <option value="Mensual">Mensual</option>
                  <option value="Anual">Anual</option>
                </select>
              </div>
            </div>
            <div
              className={styles.formGridColumns}
              style={{ marginTop: "1rem" }}
            >
              <div className={styles.formGroup}>
                <label>
                  <input
                    type="checkbox"
                    checked={formConceptoCobro.aplica_iva}
                    onChange={(e) =>
                      setFormConceptoCobro({
                        ...formConceptoCobro,
                        aplica_iva: e.target.checked,
                      })
                    }
                  />{" "}
                  Aplica IVA
                </label>
              </div>
              {formConceptoCobro.aplica_iva && (
                <div className={styles.formGroup}>
                  <label>% IVA</label>
                  <input
                    type="number"
                    value={formConceptoCobro.porcentaje_iva}
                    onChange={(e) =>
                      setFormConceptoCobro({
                        ...formConceptoCobro,
                        porcentaje_iva: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="19"
                  />
                </div>
              )}
            </div>
            <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
              {editingConcepto ? (
                <>
                  <button
                    onClick={handleUpdateConceptoCobro}
                    className={styles.btnPrimary}
                    disabled={loading}
                  >
                    {loading ? "Guardando..." : "Actualizar Concepto"}
                  </button>
                  <button
                    onClick={cancelEditConcepto}
                    className={styles.btnSecondary}
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <button
                  onClick={handleCreateConceptoCobro}
                  className={styles.btnPrimary}
                  disabled={loading}
                >
                  {loading ? "Creando..." : "Crear Concepto"}
                </button>
              )}
            </div>

            <h3 className={styles.cardTitle} style={{ marginTop: "2rem" }}>
              Conceptos de Cobro Registrados
            </h3>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Valor</th>
                    <th>Periodicidad</th>
                    <th>IVA</th>
                    <th>Inventario</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {conceptosCobro.map((concepto) => (
                    <tr key={concepto.id}>
                      <td>{concepto.nombre}</td>
                      <td>${concepto.valor?.toLocaleString() || 0}</td>
                      <td>{concepto.periodicidad}</td>
                      <td>
                        {concepto.aplica_iva
                          ? `${concepto.porcentaje_iva}%`
                          : "No"}
                      </td>
                      <td>
                        {concepto.afecta_inventario
                          ? "📦 " +
                            (concepto.categoria_inventario?.nombre || "Sí")
                          : "No"}
                      </td>
                      <td>
                        <button
                          onClick={() => startEditConcepto(concepto)}
                          className={styles.btnSecondary}
                          style={{ marginRight: "0.5rem" }}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteConceptoCobro(concepto.id)}
                          className={styles.btnDanger}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {conceptosCobro.length === 0 && (
                    <tr>
                      <td colSpan={6} className={styles.empty}>
                        No hay conceptos de cobro registrados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
