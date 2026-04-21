"use client";

import { useEffect, useState, useCallback } from "react";
import { getAuthToken } from "@/utils/auth";
import { API_URL } from "@/utils/api";
import Link from "next/link";
import styles from "./Evaluacion.module.css";

interface Actividad {
  id: string;
  nombre: string;
  descripcion?: string;
  porcentaje_peso?: number;
  fecha?: string;
  tipo_actividad?: { nombre: string } | { nombre: string }[];
  asignatura?: { nombre: string; area?: { nombre: string } } | { nombre: string; area?: { nombre: string } }[];
  grupo?: { nombre: string } | { nombre: string }[];
  periodo?: { nombre: string; numero: number } | { nombre: string; numero: number }[];
}

interface BloqueHorario {
  id: string;
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
  aula?: string;
  asignacion?: {
    docente: { primer_nombre: string; primer_apellido: string };
    asignatura: { nombre: string };
    grupo: { nombre: string };
  };
}

interface NotaPeriodo {
  id: string;
  nota_final?: number;
  desempeno?: string;
  observacion_docente?: string;
  estudiante?: {
    primer_nombre: string;
    primer_apellido: string;
    numero_documento: string;
  };
  asignatura?: { nombre: string };
  periodo?: { nombre: string; numero: number };
}

const API = `${API_URL}`;

// Helper to handle both object and array from custom QueryBuilder
const getNestedValue = (val: any, field: string = "nombre") => {
  if (!val) return "-";
  if (Array.isArray(val)) {
    return val[0]?.[field] || "-";
  }
  return val[field] || "-";
};

export default function EvaluacionPage() {
  const [activeTab, setActiveTab] = useState("actividades");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Data
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [bloques, setBloques] = useState<BloqueHorario[]>([]);
  const [notasPeriodo, setNotasPeriodo] = useState<NotaPeriodo[]>([]);
  
  // Filter Options
  const [grupos, setGrupos] = useState<any[]>([]);
  const [asignaturas, setAsignaturas] = useState<any[]>([]);
  const [periodos, setPeriodos] = useState<any[]>([]);
  const [tiposActividad, setTiposActividad] = useState<any[]>([]);

  // Filters
  const [grupoFiltro, setGrupoFiltro] = useState("");
  const [periodoFiltro, setPeriodoFiltro] = useState("");
  const [estudianteFiltro, setEstudianteFiltro] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingActividad, setEditingActividad] = useState<Actividad | null>(null);
  const [formData, setFormData] = useState({
    nombre: "",
    porcentaje_peso: 10,
    tipo_actividad_id: "",
    grupo_id: "",
    asignatura_id: "",
    periodo_academico_id: "",
    fecha: new Date().toISOString().split("T")[0],
    descripcion: ""
  });

  const loadFilterOptions = useCallback(async () => {
    const token = getAuthToken();
    try {
      const [resG, resA, resAnios, resT] = await Promise.all([
        fetch(`${API}/grupos`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/academico/areas`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/academico/anios-lectivos`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/calificaciones/tipos-actividad`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const dataG = await resG.json();
      setGrupos(Array.isArray(dataG) ? dataG : dataG.data || []);

      const dataA = await resA.json();
      const allAsig = Array.isArray(dataA) ? dataA.flatMap((a: any) => a.asignatura || []) : [];
      setAsignaturas(allAsig);

      const dataT = await resT.json();
      setTiposActividad(Array.isArray(dataT) ? dataT : []);

      const dataAnios = await resAnios.json();
      if (dataAnios?.length > 0) {
        const resP = await fetch(`${API}/academico/periodos?anio_lectivo_id=${dataAnios[0].id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const dataP = await resP.json();
        setPeriodos(Array.isArray(dataP) ? dataP : []);
      }
    } catch (err) {
      console.error("Error loading filters:", err);
    }
  }, []);

  const loadActividades = useCallback(async () => {
    setLoading(true);
    const token = getAuthToken();
    const params = new URLSearchParams();
    if (grupoFiltro) params.append("grupo_id", grupoFiltro);
    if (periodoFiltro) params.append("periodo_id", periodoFiltro);

    try {
      const res = await fetch(`${API}/evaluacion/actividades?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error al cargar actividades");
      const data = await res.json();
      setActividades(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setActividades([]);
    } finally {
      setLoading(false);
    }
  }, [grupoFiltro, periodoFiltro]);

  const loadBloques = async () => {
    const token = getAuthToken();
    const res = await fetch(`${API}/evaluacion/bloques-horarios`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setBloques(Array.isArray(data) ? data : []);
  };

  const loadNotasPeriodo = useCallback(async () => {
    const token = getAuthToken();
    const params = new URLSearchParams();
    if (estudianteFiltro) params.append("estudiante_id", estudianteFiltro);

    try {
      const res = await fetch(`${API}/evaluacion/notas-periodo?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error al cargar notas");
      const data = await res.json();
      setNotasPeriodo(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setNotasPeriodo([]);
    }
  }, [estudianteFiltro]);

  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

  useEffect(() => {
    if (activeTab === "actividades") loadActividades();
    if (activeTab === "bloques") loadBloques();
    if (activeTab === "notas") loadNotasPeriodo();
  }, [activeTab, loadActividades, loadNotasPeriodo]);

  const handleOpenModal = (act: Actividad | null = null) => {
    if (act) {
      setEditingActividad(act);
      setFormData({
        nombre: act.nombre,
        porcentaje_peso: act.porcentaje_peso || 10,
        tipo_actividad_id: (act as any).tipo_actividad_id || "",
        grupo_id: (act as any).grupo_id || "",
        asignatura_id: (act as any).asignatura_id || "",
        periodo_academico_id: (act as any).periodo_academico_id || "",
        fecha: act.fecha?.split("T")[0] || new Date().toISOString().split("T")[0],
        descripcion: act.descripcion || ""
      });
    } else {
      setEditingActividad(null);
      setFormData({
        nombre: "",
        porcentaje_peso: 10,
        tipo_actividad_id: "",
        grupo_id: grupoFiltro,
        asignatura_id: "",
        periodo_academico_id: periodoFiltro,
        fecha: new Date().toISOString().split("T")[0],
        descripcion: ""
      });
    }
    setShowModal(true);
  };

  const handleSaveActividad = async () => {
    if (!formData.nombre || !formData.grupo_id || !formData.asignatura_id || !formData.periodo_academico_id || !formData.tipo_actividad_id) {
      alert("Por favor completa todos los campos obligatorios");
      return;
    }

    setSaving(true);
    const token = getAuthToken();
    try {
      const url = editingActividad 
        ? `${API}/evaluacion/actividades/${editingActividad.id}`
        : `${API}/evaluacion/actividades`;
      
      const res = await fetch(url, {
        method: editingActividad ? "PATCH" : "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al guardar");
      }

      setShowModal(false);
      loadActividades();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteActividad = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta actividad?")) return;
    const token = getAuthToken();
    try {
      const res = await fetch(`${API}/evaluacion/actividades/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (!res.ok) {
        alert(result.message || "Error al eliminar la actividad");
        return;
      }
      loadActividades();
    } catch (err) {
      console.error(err);
      alert("Error de conexión al intentar eliminar");
    }
  };

  const filteredActividades = actividades.filter(act => 
    act.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Evaluación Académica</h1>
        <div className={styles.headerActions}>
           <button onClick={() => handleOpenModal()} className={styles.btnPrimary}>
            + Nueva Actividad
          </button>
           <Link href="/dashboard/calificaciones" className={styles.btnPrimary} style={{ background: "#64748b" }}>
            Planilla de Notas
          </Link>
        </div>
      </header>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tabBtn} ${activeTab === "actividades" ? styles.active : ""}`}
          onClick={() => setActiveTab("actividades")}
        >
          📝 Actividades
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === "bloques" ? styles.active : ""}`}
          onClick={() => setActiveTab("bloques")}
        >
          📅 Horarios
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === "notas" ? styles.active : ""}`}
          onClick={() => setActiveTab("notas")}
        >
          📊 Notas Finales
        </button>
      </div>

      <div className={styles.card}>
        {activeTab === "actividades" && (
          <>
            <div className={styles.filterBar}>
              <div className={styles.inputGroup}>
                <label>Buscar</label>
                <input 
                  placeholder="Filtrar por nombre..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Grupo</label>
                <select value={grupoFiltro} onChange={(e) => setGrupoFiltro(e.target.value)}>
                  <option value="">Todos los grupos</option>
                  {grupos.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
                </select>
              </div>
              <div className={styles.inputGroup}>
                <label>Periodo</label>
                <select value={periodoFiltro} onChange={(e) => setPeriodoFiltro(e.target.value)}>
                  <option value="">Todos los periodos</option>
                  {periodos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Actividad</th>
                    <th>Tipo</th>
                    <th>Asignatura</th>
                    <th>Grupo</th>
                    <th>Peso</th>
                    <th>Fecha</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredActividades.map((act) => (
                    <tr key={act.id}>
                      <td style={{ fontWeight: 600 }}>{act.nombre}</td>
                      <td><span className={`${styles.badge} ${styles.badgeType}`}>{getNestedValue(act.tipo_actividad)}</span></td>
                      <td><span className={`${styles.badge} ${styles.badgeSubject}`}>{getNestedValue(act.asignatura)}</span></td>
                      <td><span className={`${styles.badge} ${styles.badgeGroup}`}>{getNestedValue(act.grupo)}</span></td>
                      <td style={{ fontWeight: 700, color: "#2563eb" }}>{act.porcentaje_peso}%</td>
                      <td>{act.fecha?.split("T")[0]}</td>
                      <td>
                        <button
                          onClick={() => handleOpenModal(act)}
                          className={styles.editBtn}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteActividad(act.id)}
                          className={styles.deleteBtn}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredActividades.length === 0 && (
                    <tr>
                      <td colSpan={7} className={styles.emptyState}>
                        <span>🔍</span>
                        No se encontraron actividades evaluativas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className={styles.gradesAlert}>
              <p>💡 <strong>¿Deseas agregar o modificar las notas de los estudiantes?</strong></p>
              <Link href="/dashboard/calificaciones" className={styles.btnPrimary}>
                Abrir Planilla de Notas
              </Link>
            </div>
          </>
        )}

        {activeTab === "bloques" && (
          /* ... bloques table ... */
          <div className={styles.tableWrapper}>
             <table className={styles.table}>
              <thead>
                <tr>
                  <th>Día</th>
                  <th>Horario</th>
                  <th>Aula</th>
                  <th>Docente</th>
                  <th>Asignatura</th>
                  <th>Grupo</th>
                </tr>
              </thead>
              <tbody>
                {bloques.map((bloque) => (
                  <tr key={bloque.id}>
                    <td style={{ fontWeight: 600 }}>{bloque.dia_semana}</td>
                    <td>{bloque.hora_inicio?.slice(0, 5)} - {bloque.hora_fin?.slice(0, 5)}</td>
                    <td>{bloque.aula || "No asignada"}</td>
                    <td>
                      {bloque.asignacion?.docente
                        ? `${bloque.asignacion.docente.primer_nombre} ${bloque.asignacion.docente.primer_apellido}`
                        : "-"}
                    </td>
                    <td>{bloque.asignacion?.asignatura?.nombre || "-"}</td>
                    <td>{bloque.asignacion?.grupo?.nombre || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "notas" && (
          /* ... notas table ... */
          <>
            <div className={styles.filterBar}>
               <div className={styles.inputGroup}>
                <label>Estudiante</label>
                <input
                  placeholder="ID del estudiante..."
                  value={estudianteFiltro}
                  onChange={(e) => setEstudianteFiltro(e.target.value)}
                />
              </div>
            </div>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Estudiante</th>
                    <th>Documento</th>
                    <th>Asignatura</th>
                    <th>Período</th>
                    <th>Nota</th>
                    <th>Desempeño</th>
                  </tr>
                </thead>
                <tbody>
                  {notasPeriodo.map((nota) => (
                    <tr key={nota.id}>
                      <td style={{ fontWeight: 600 }}>
                        {nota.estudiante?.primer_nombre} {nota.estudiante?.primer_apellido}
                      </td>
                      <td style={{ color: "#64748b" }}>{nota.estudiante?.numero_documento}</td>
                      <td>{nota.asignatura?.nombre}</td>
                      <td>{nota.periodo?.nombre}</td>
                      <td style={{ fontWeight: 800, fontSize: "1.1rem" }}>
                        {nota.nota_final !== null && nota.nota_final !== undefined
                          ? Number(nota.nota_final).toFixed(1)
                          : "-"}
                      </td>
                      <td>
                        <span
                          className={styles.badge}
                          style={{
                            background:
                              nota.desempeno === "Superior" ? "#22c55e" :
                              nota.desempeno === "Alto" ? "#3b82f6" :
                              nota.desempeno === "Básico" ? "#f59e0b" : "#ef4444",
                            color: "white"
                          }}
                        >
                          {nota.desempeno}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>{editingActividad ? "Editar Actividad" : "Nueva Actividad"}</h2>
            <div className={styles.formGrid}>
              <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                <label>Nombre de la actividad</label>
                <input 
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  placeholder="Ej: Quiz de Matemáticas"
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Tipo</label>
                <select value={formData.tipo_actividad_id} onChange={(e) => setFormData({...formData, tipo_actividad_id: e.target.value})}>
                  <option value="">Seleccionar...</option>
                  {tiposActividad.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>
              </div>
              <div className={styles.inputGroup}>
                <label>Peso (%)</label>
                <input 
                  type="number"
                  value={formData.porcentaje_peso}
                  onChange={(e) => setFormData({...formData, porcentaje_peso: parseInt(e.target.value)})}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Grupo</label>
                <select value={formData.grupo_id} onChange={(e) => setFormData({...formData, grupo_id: e.target.value})}>
                  <option value="">Seleccionar...</option>
                  {grupos.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
                </select>
              </div>
              <div className={styles.inputGroup}>
                <label>Asignatura</label>
                <select value={formData.asignatura_id} onChange={(e) => setFormData({...formData, asignatura_id: e.target.value})}>
                  <option value="">Seleccionar...</option>
                  {asignaturas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                </select>
              </div>
              <div className={styles.inputGroup}>
                <label>Periodo</label>
                <select value={formData.periodo_academico_id} onChange={(e) => setFormData({...formData, periodo_academico_id: e.target.value})}>
                  <option value="">Seleccionar...</option>
                  {periodos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              <div className={styles.inputGroup}>
                <label>Fecha</label>
                <input 
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                />
              </div>
            </div>
            <div className={styles.modalActions}>
              <button onClick={() => setShowModal(false)} className={styles.cancelBtn}>Cancelar</button>
              <button 
                onClick={handleSaveActividad} 
                className={styles.confirmBtn}
                disabled={saving}
              >
                {saving ? "Guardando..." : "Guardar Actividad"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
