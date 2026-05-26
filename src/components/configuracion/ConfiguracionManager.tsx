"use client";

import { useState, useEffect } from "react";
import { InstitucionForm, UsuariosManager, ConceptosCobroManager } from "./";
import { getAuthToken, API_URL } from "../../utils/auth";
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

const API = API_URL;

export function ConfiguracionManager() {
  const [activeTab, setActiveTab] = useState("institucion");
  const [loading, setLoading] = useState(false);

  // Institución
  const [institucion, setInstitucion] = useState<Institucion | null>(null);
  const [formInstitucion, setFormInstitucion] = useState<Institucion>({
    nombre: "",
    nit: "",
    direccion: "",
    telefono: "",
    correo_electronico: "",
    rector: "",
    resolucion_aprobacion: "",
    dane: "",
    jornadas: ["Mañana"],
  });

  // Conceptos de Cobro
  const [conceptosCobro, setConceptosCobro] = useState<ConceptoCobro[]>([]);
  const [editingConcepto, setEditingConcepto] = useState<string | null>(null);
  const [formConceptoCobro, setFormConceptoCobro] = useState({
    nombre: "",
    valor: 0,
    periodicidad: "Única",
    aplica_iva: false,
    porcentaje_iva: 0,
    afecta_inventario: false,
    categoria_inventario_id: "",
  });

  // Usuarios
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [rolFiltro, setRolFiltro] = useState("");
  const [formUsuario, setFormUsuario] = useState({
    nombre: "",
    email: "",
    password: "",
    rol: "docente",
  });

  const tabs = [
    { id: "institucion", label: "Institución" },
    { id: "usuarios", label: "Usuarios" },
    { id: "conceptos-cobro", label: "Conceptos de Cobro" },
  ];

  // Cargar datos iniciales
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      setLoading(true);
      const [resInst, resConceptos, resUsuarios] = await Promise.all([
        fetch(`${API}/configuracion/institucion`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API}/configuracion/conceptos-cobro`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API}/auth/users`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (resInst.ok) {
        const instData = await resInst.json();
        if (instData) {
          setInstitucion(instData);
          setFormInstitucion({
            nombre: instData.nombre || "",
            nit: instData.nit || "",
            direccion: instData.direccion || "",
            telefono: instData.telefono || "",
            correo_electronico: instData.correo_electronico || "",
            rector: instData.rector || "",
            resolucion_aprobacion: instData.resolucion_aprobacion || "",
            dane: instData.dane || "",
            jornadas: instData.jornadas || ["Mañana"],
          });
        }
      }

      if (resConceptos.ok) {
        setConceptosCobro(await resConceptos.json());
      }

      if (resUsuarios.ok) {
        setUsuarios(await resUsuarios.json());
      }
    } catch (err) {
      console.error("Error cargando datos:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handlers Institución
  const handleSaveInstitucion = async () => {
    setLoading(true);
    const token = getAuthToken();
    try {
      const isUpdating = !!institucion;
      const url = isUpdating && institucion.id 
        ? `${API}/configuracion/institucion/${institucion.id}` 
        : `${API}/configuracion/institucion`;
      const method = isUpdating && institucion.id ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formInstitucion),
      });
      if (!res.ok) throw new Error("Error al guardar");
      loadData();
      alert("Institución guardada correctamente");
    } catch (err: any) {
      alert(err.message || "Error guardando");
    }
    setLoading(false);
  };

  // Handlers Conceptos de Cobro
  const handleCreateConceptoCobro = async () => {
    if (!formConceptoCobro.nombre) {
      alert("El nombre es obligatorio");
      return;
    }
    setLoading(true);
    const token = getAuthToken();
    try {
      const res = await fetch(`${API}/configuracion/conceptos-cobro`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formConceptoCobro),
      });
      if (!res.ok) throw new Error("Error al crear");
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
      alert(err.message || "Error al crear");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateConceptoCobro = async () => {
    if (!editingConcepto) return;
    setLoading(true);
    const token = getAuthToken();
    try {
      const res = await fetch(
        `${API}/configuracion/conceptos-cobro/${editingConcepto}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formConceptoCobro),
        },
      );
      if (!res.ok) throw new Error("Error al actualizar");
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
      alert(err.message || "Error al actualizar");
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
      if (!res.ok) throw new Error("Error al eliminar");
      loadData();
      alert("Concepto de cobro eliminado correctamente");
    } catch (err: any) {
      alert(err.message || "Error al eliminar");
    }
  };

  const startEditConcepto = (concepto: ConceptoCobro) => {
    setEditingConcepto(concepto.id);
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

  // Handlers Usuarios
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
      if (!res.ok) throw new Error("Error al crear usuario");
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
      if (!res.ok) throw new Error("Error al cambiar estado");
      loadData();
    } catch (err: any) {
      alert(err.message || "Error al cambiar estado");
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleSection}>
          <h1>Configuración del Sistema</h1>
          <p>Administrar institución, usuarios y conceptos de cobro</p>
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
        {activeTab === "institucion" && (
          <InstitucionForm
            formData={formInstitucion}
            setFormData={setFormInstitucion}
            onSave={handleSaveInstitucion}
            loading={loading}
          />
        )}

        {activeTab === "usuarios" && (
          <UsuariosManager
            usuarios={usuarios}
            formUsuario={formUsuario}
            setFormUsuario={setFormUsuario}
            rolFiltro={rolFiltro}
            setRolFiltro={setRolFiltro}
            onCreate={handleCreateUsuario}
            onToggle={handleToggleUsuario}
            onRefresh={loadData}
            loading={loading}
          />
        )}

        {activeTab === "conceptos-cobro" && (
          <ConceptosCobroManager
            conceptos={conceptosCobro}
            formData={formConceptoCobro}
            setFormData={setFormConceptoCobro}
            editingId={editingConcepto}
            onCreate={handleCreateConceptoCobro}
            onUpdate={handleUpdateConceptoCobro}
            onDelete={handleDeleteConceptoCobro}
            onEdit={startEditConcepto}
            onCancel={cancelEditConcepto}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
}
