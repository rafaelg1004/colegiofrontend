"use client";

import { useEffect, useState, useCallback } from "react";
import { getAuthToken } from "@/utils/auth";
import { API_URL } from "@/utils/api";
import styles from "./ConfiguracionAcademica.module.css";

// Interfaces
interface Sede {
  id: string;
  nombre: string;
  direccion?: string;
  telefono?: string;
}

interface AnioLectivo {
  id: string;
  anio: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  activo: boolean;
}

interface Periodo {
  id: string;
  nombre: string;
  numero: number;
  porcentaje_peso: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  activo: boolean;
  anio_lectivo_id: string;
}

interface Area {
  id: string;
  nombre: string;
  asignatura?: Asignatura[];
}

interface Asignatura {
  id: string;
  nombre: string;
  area_id: string;
}

interface Nivel {
  id: string;
  nombre: string;
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

type TabId =
  | "sedes"
  | "anios"
  | "periodos"
  | "areas"
  | "niveles"
  | "grados"
  | "tipos-actividad";

export const ConfiguracionAcademica = () => {
  const [activeTab, setActiveTab] = useState<TabId>("anios");
  const [loading, setLoading] = useState(false);

  // Data states
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [anios, setAnios] = useState<AnioLectivo[]>([]);
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [grados, setGrados] = useState<Grado[]>([]);
  const [tiposActividad, setTiposActividad] = useState<TipoActividad[]>([]);
  const [anioSeleccionado, setAnioSeleccionado] = useState<string>("");
  const [nivelFiltro, setNivelFiltro] = useState<string>("");

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<
    | "sede"
    | "anio"
    | "periodo"
    | "area"
    | "asignatura"
    | "nivel"
    | "grado"
    | "tipo-actividad"
  >("sede");
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<any>({});

  // Delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteItem, setDeleteItem] = useState<{
    id: string;
    name: string;
    type: TabId;
  } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const tabs = [
    { id: "anios" as TabId, name: "Años Lectivos", icon: "📅" },
    { id: "periodos" as TabId, name: "Periodos", icon: "📊" },
    { id: "sedes" as TabId, name: "Sedes", icon: "🏫" },
    { id: "areas" as TabId, name: "Áreas y Asignaturas", icon: "📚" },
    { id: "niveles" as TabId, name: "Niveles", icon: "🎚️" },
    { id: "grados" as TabId, name: "Grados", icon: "🎓" },
    { id: "tipos-actividad" as TabId, name: "Tipos de Actividad", icon: "📝" },
  ];

  // Fetch functions
  const fetchSedes = useCallback(async () => {
    const token = getAuthToken();
    const res = await fetch(`${API_URL}/academico/sedes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setSedes(await res.json());
  }, []);

  const fetchAnios = useCallback(async () => {
    const token = getAuthToken();
    const res = await fetch(`${API_URL}/academico/anios-lectivos`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setAnios(data || []);
      const activo = data.find((a: AnioLectivo) => a.activo);
      if (activo && !anioSeleccionado) setAnioSeleccionado(activo.id);
    }
  }, [anioSeleccionado]);

  const fetchPeriodos = useCallback(async () => {
    if (!anioSeleccionado) return;
    const token = getAuthToken();
    const res = await fetch(
      `${API_URL}/academico/periodos?anio_lectivo_id=${anioSeleccionado}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    if (res.ok) setPeriodos(await res.json());
  }, [anioSeleccionado]);

  const fetchAreas = useCallback(async () => {
    const token = getAuthToken();
    const res = await fetch(`${API_URL}/academico/areas`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setAreas(await res.json());
  }, []);

  const fetchNiveles = useCallback(async () => {
    const token = getAuthToken();
    const res = await fetch(`${API_URL}/academico/niveles`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setNiveles(await res.json());
  }, []);

  const fetchGrados = useCallback(async () => {
    const token = getAuthToken();
    const url = nivelFiltro
      ? `${API_URL}/academico/grados?nivel_id=${nivelFiltro}`
      : `${API_URL}/academico/grados`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setGrados(await res.json());
  }, [nivelFiltro]);

  const fetchTiposActividad = useCallback(async () => {
    const token = getAuthToken();
    const res = await fetch(`${API_URL}/academico/tipos-actividad`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setTiposActividad(await res.json());
  }, []);

  // Check dependencies before deleting
  const checkDependencies = (type: TabId, id: string): string | null => {
    switch (type) {
      case "anios":
        const hasPeriodos = periodos.some((p) => p.anio_lectivo_id === id);
        if (hasPeriodos)
          return "No se puede eliminar: Este año lectivo tiene períodos asociados.";
        return null;
      case "periodos":
        // Aquí podrías verificar si hay notas o actividades asociadas al período
        return null;
      case "sedes":
        // Aquí podrías verificar si hay grupos o estudiantes asociados a la sede
        return null;
      case "areas":
        const hasAsignaturas = areas.find((a) => a.id === id)?.asignatura
          ?.length;
        if (hasAsignaturas)
          return "No se puede eliminar: Esta área tiene asignaturas asociadas.";
        return null;
      case "niveles":
        const hasGrados = grados.some((g) => g.nivel_id === id);
        if (hasGrados)
          return "No se puede eliminar: Este nivel tiene grados asociados.";
        return null;
      case "grados":
        // Aquí podrías verificar si hay grupos o estudiantes asociados al grado
        return null;
      case "tipos-actividad":
        // Aquí podrías verificar si hay actividades de este tipo
        return null;
      default:
        return null;
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (type: TabId, id: string, name: string) => {
    const dependencyError = checkDependencies(type, id);
    if (dependencyError) {
      setDeleteError(dependencyError);
    } else {
      setDeleteError(null);
    }
    setDeleteItem({ id, name, type });
    setShowDeleteModal(true);
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deleteItem) return;

    // Verificar dependencias nuevamente
    const dependencyError = checkDependencies(deleteItem.type, deleteItem.id);
    if (dependencyError) {
      setDeleteError(dependencyError);
      return;
    }

    setDeleting(true);
    try {
      const token = getAuthToken();
      let endpoint = "";

      switch (deleteItem.type) {
        case "sedes":
          endpoint = `sedes/${deleteItem.id}`;
          break;
        case "anios":
          endpoint = `anios-lectivos/${deleteItem.id}`;
          break;
        case "periodos":
          endpoint = `periodos/${deleteItem.id}`;
          break;
        case "areas":
          endpoint = `areas/${deleteItem.id}`;
          break;
        case "niveles":
          endpoint = `niveles/${deleteItem.id}`;
          break;
        case "grados":
          endpoint = `grados/${deleteItem.id}`;
          break;
        case "tipos-actividad":
          endpoint = `tipos-actividad/${deleteItem.id}`;
          break;
        default:
          throw new Error("Tipo no soportado para eliminación");
      }

      const res = await fetch(`${API_URL}/academico/${endpoint}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error al eliminar");
      }

      // Refresh data after deletion
      switch (deleteItem.type) {
        case "sedes":
          await fetchSedes();
          break;
        case "anios":
          await fetchAnios();
          break;
        case "periodos":
          await fetchPeriodos();
          break;
        case "areas":
          await fetchAreas();
          break;
        case "niveles":
          await fetchNiveles();
          break;
        case "grados":
          await fetchGrados();
          break;
        case "tipos-actividad":
          await fetchTiposActividad();
          break;
      }

      setShowDeleteModal(false);
      setDeleteItem(null);
    } catch (error: any) {
      setDeleteError(error.message || "Error al eliminar el elemento");
    } finally {
      setDeleting(false);
    }
  };

  // Load data on tab change
  useEffect(() => {
    setLoading(true);
    const loadData = async () => {
      switch (activeTab) {
        case "sedes":
          await fetchSedes();
          break;
        case "anios":
          await fetchAnios();
          break;
        case "periodos":
          await fetchAnios();
          await fetchPeriodos();
          break;
        case "areas":
          await fetchAreas();
          break;
        case "niveles":
          await fetchNiveles();
          break;
        case "grados":
          await fetchNiveles();
          await fetchGrados();
          break;
        case "tipos-actividad":
          await fetchTiposActividad();
          break;
      }
      setLoading(false);
    };
    loadData();
  }, [
    activeTab,
    fetchSedes,
    fetchAnios,
    fetchPeriodos,
    fetchAreas,
    fetchNiveles,
    fetchGrados,
    fetchTiposActividad,
  ]);

  useEffect(() => {
    if (activeTab === "periodos" && anioSeleccionado) {
      fetchPeriodos();
    }
  }, [anioSeleccionado, activeTab, fetchPeriodos]);

  useEffect(() => {
    if (activeTab === "grados") {
      fetchGrados();
    }
  }, [nivelFiltro, activeTab, fetchGrados]);

  // Helper para formatear fecha ISO a YYYY-MM-DD
  const formatDateForInput = (isoDate?: string): string => {
    if (!isoDate) return "";
    const date = new Date(isoDate);
    return date.toISOString().split("T")[0];
  };

  // Open modals
  const openModal = (type: typeof modalType, data?: any) => {
    setModalType(type);
    // Determinar si es creación o edición
    const isEdit = data && data.id;
    setModalMode(isEdit ? "edit" : "create");
    // Inicializar con valores por defecto según el tipo
    let defaultData = data || {};
    if (type === "anio" && !data) {
      defaultData = { anio: new Date().getFullYear(), activo: false };
    }
    if (type === "anio" && data) {
      // Convertir fechas ISO a formato YYYY-MM-DD para el input date
      defaultData = {
        ...data,
        fecha_inicio: formatDateForInput(data.fecha_inicio),
        fecha_fin: formatDateForInput(data.fecha_fin),
      };
    }
    if (type === "periodo" && !data) {
      defaultData = { numero: 1, porcentaje_peso: 25, activo: false };
    }
    if (type === "periodo" && data) {
      // Convertir fechas ISO a formato YYYY-MM-DD para el input date
      defaultData = {
        ...data,
        fecha_inicio: formatDateForInput(data.fecha_inicio),
        fecha_fin: formatDateForInput(data.fecha_fin),
      };
    }
    setFormData(defaultData);
    setShowModal(true);
  };

  // Handle submit
  const handleSubmit = async () => {
    setSaving(true);
    try {
      const token = getAuthToken();
      let endpoint = "";
      let body: any = {};

      switch (modalType) {
        case "sede":
          endpoint = "sedes";
          body = {
            nombre: formData.nombre,
            direccion: formData.direccion,
            telefono: formData.telefono,
          };
          break;
        case "anio":
          endpoint = "anios-lectivos";
          const anioValue = parseInt(formData.anio) || new Date().getFullYear();
          body = {
            anio: anioValue,
            fecha_inicio: formData.fecha_inicio,
            fecha_fin: formData.fecha_fin,
            activo: formData.activo || false,
          };
          break;
        case "periodo":
          endpoint = "periodos";
          body = {
            nombre: formData.nombre,
            numero: parseInt(formData.numero),
            porcentaje_peso: parseFloat(formData.porcentaje_peso),
            anio_lectivo_id: anioSeleccionado,
            fecha_inicio: formData.fecha_inicio,
            fecha_fin: formData.fecha_fin,
          };
          break;
        case "area":
          endpoint = "areas";
          body = { nombre: formData.nombre };
          break;
        case "asignatura":
          endpoint = "asignaturas";
          body = { nombre: formData.nombre, area_id: formData.area_id };
          break;
        case "nivel":
          endpoint = "niveles";
          body = { nombre: formData.nombre };
          break;
        case "grado":
          endpoint = "grados";
          body = {
            nombre: formData.nombre,
            codigo: formData.codigo,
            orden: parseInt(formData.orden) || 1,
            nivel_id: formData.nivel_id,
          };
          break;
        case "tipo-actividad":
          endpoint = "tipos-actividad";
          body = { nombre: formData.nombre };
          break;
      }

      const isEdit = modalMode === "edit" && formData.id;
      const url = isEdit
        ? `${API_URL}/academico/${endpoint}/${formData.id}`
        : `${API_URL}/academico/${endpoint}`;
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(
          err.message || `Error al ${isEdit ? "actualizar" : "guardar"}`,
        );
      }

      setShowModal(false);
      // Refresh data
      switch (modalType) {
        case "sede":
          fetchSedes();
          break;
        case "anio":
          fetchAnios();
          break;
        case "periodo":
          fetchPeriodos();
          break;
        case "area":
        case "asignatura":
          fetchAreas();
          break;
        case "nivel":
          fetchNiveles();
          break;
        case "grado":
          fetchGrados();
          break;
        case "tipo-actividad":
          fetchTiposActividad();
          break;
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const value =
      e.target.type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  // Render content based on active tab
  const renderContent = () => {
    if (loading) return <div className={styles.loading}>Cargando...</div>;

    switch (activeTab) {
      case "sedes":
        return (
          <div className={styles.dataGrid}>
            {sedes.length > 0 ? (
              sedes.map((sede) => (
                <div key={sede.id} className={styles.card}>
                  <div className={styles.cardIcon}>🏫</div>
                  <div className={styles.cardInfo}>
                    <h3>{sede.nombre}</h3>
                    <p>{sede.direccion || "Sin dirección"}</p>
                    {sede.telefono && (
                      <span className={styles.meta}>Tel: {sede.telefono}</span>
                    )}
                    <div className={styles.cardActions}>
                      <button
                        className={styles.deleteCardBtn}
                        onClick={() =>
                          openDeleteModal("sedes", sede.id, sede.nombre)
                        }
                        title="Eliminar sede"
                      >
                        🗑️ Eliminar
                      </button>
                      <button
                        className={styles.editCardBtn}
                        onClick={() => openModal("sede", sede)}
                      >
                        ✏️ Editar
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.empty}>No hay sedes registradas</div>
            )}
          </div>
        );

      case "anios":
        return (
          <div className={styles.dataGrid}>
            {anios.length > 0 ? (
              anios.map((anio) => (
                <div
                  key={anio.id}
                  className={`${styles.card} ${anio.activo ? styles.cardActive : ""}`}
                >
                  <div className={styles.cardIcon}>📅</div>
                  <div className={styles.cardInfo}>
                    <h3>{anio.anio}</h3>
                    <p className={styles.meta}>
                      {anio.fecha_inicio && anio.fecha_fin
                        ? `${new Date(anio.fecha_inicio).toLocaleDateString("es-CO")} - ${new Date(anio.fecha_fin).toLocaleDateString("es-CO")}`
                        : "Sin fechas definidas"}
                    </p>
                    <span
                      className={`${styles.badge} ${anio.activo ? styles.badgeActive : styles.badgeInactive}`}
                    >
                      {anio.activo ? "Vigente" : "Inactivo"}
                    </span>
                    <div className={styles.cardActions}>
                      <button
                        className={styles.deleteCardBtn}
                        onClick={() =>
                          openDeleteModal("anios", anio.id, `Año ${anio.anio}`)
                        }
                        title="Eliminar año lectivo"
                      >
                        🗑️ Eliminar
                      </button>
                      <button
                        className={styles.editCardBtn}
                        onClick={() => openModal("anio", anio)}
                      >
                        ✏️ Editar
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.empty}>No hay años lectivos</div>
            )}
          </div>
        );

      case "periodos":
        return (
          <>
            <div className={styles.filterBar}>
              <select
                value={anioSeleccionado}
                onChange={(e) => setAnioSeleccionado(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="">Seleccionar año...</option>
                {anios.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.anio} {a.activo ? "(Activo)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.dataGrid}>
              {periodos.length > 0 ? (
                periodos.map((periodo) => (
                  <div
                    key={periodo.id}
                    className={`${styles.card} ${periodo.activo ? styles.cardActive : ""}`}
                  >
                    <div className={styles.cardIcon}>📊</div>
                    <div className={styles.cardInfo}>
                      <h3>{periodo.nombre}</h3>
                      <p>Periodo #{periodo.numero}</p>
                      <p className={styles.meta}>
                        {periodo.fecha_inicio && periodo.fecha_fin
                          ? `${new Date(periodo.fecha_inicio).toLocaleDateString("es-CO")} - ${new Date(periodo.fecha_fin).toLocaleDateString("es-CO")}`
                          : "Sin fechas definidas"}
                      </p>
                      <div className={styles.metaRow}>
                        <span className={styles.meta}>
                          Peso: {periodo.porcentaje_peso}%
                        </span>
                        <span
                          className={`${styles.badge} ${periodo.activo ? styles.badgeActive : styles.badgeInactive}`}
                        >
                          {periodo.activo ? "Activo" : "Cerrado"}
                        </span>
                      </div>
                      <div className={styles.cardActions}>
                        <button
                          className={styles.deleteCardBtn}
                          onClick={() =>
                            openDeleteModal(
                              "periodos",
                              periodo.id,
                              periodo.nombre,
                            )
                          }
                          title="Eliminar período"
                        >
                          🗑️ Eliminar
                        </button>
                        <button
                          className={styles.editCardBtn}
                          onClick={() => openModal("periodo", periodo)}
                        >
                          ✏️ Editar
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.empty}>
                  {anioSeleccionado
                    ? "No hay periodos para este año"
                    : "Seleccione un año lectivo"}
                </div>
              )}
            </div>
          </>
        );

      case "areas":
        return (
          <div className={styles.areasContainer}>
            {areas.length > 0 ? (
              areas.map((area) => (
                <div key={area.id} className={styles.areaCard}>
                  <div className={styles.areaHeader}>
                    <h3>📚 {area.nombre}</h3>
                    <div className={styles.areaActions}>
                      <button
                        className={styles.deleteAreaBtn}
                        onClick={() =>
                          openDeleteModal("areas", area.id, area.nombre)
                        }
                        title="Eliminar área"
                      >
                        🗑️
                      </button>
                      <button
                        className={styles.editSmallBtn}
                        onClick={() => openModal("area", area)}
                      >
                        ✏️
                      </button>
                      <button
                        className={styles.addSmallBtn}
                        onClick={() =>
                          openModal("asignatura", { area_id: area.id })
                        }
                      >
                        + Asignatura
                      </button>
                    </div>
                  </div>
                  <div className={styles.asignaturasList}>
                    {area.asignatura && area.asignatura.length > 0 ? (
                      area.asignatura.map((asig) => (
                        <div key={asig.id} className={styles.asignaturaItem}>
                          <span>{asig.nombre}</span>
                          <button
                            className={styles.editAsigBtn}
                            onClick={() => openModal("asignatura", asig)}
                          >
                            ✏️
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className={styles.noAsignaturas}>Sin asignaturas</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.empty}>No hay áreas registradas</div>
            )}
          </div>
        );

      case "niveles":
        return (
          <div className={styles.dataGrid}>
            {niveles.length > 0 ? (
              niveles.map((nivel) => (
                <div key={nivel.id} className={styles.card}>
                  <div className={styles.cardIcon}>🎚️</div>
                  <div className={styles.cardInfo}>
                    <h3>{nivel.nombre}</h3>
                    <div className={styles.cardActions}>
                      <button
                        className={styles.deleteCardBtn}
                        onClick={() =>
                          openDeleteModal("niveles", nivel.id, nivel.nombre)
                        }
                        title="Eliminar nivel"
                      >
                        🗑️ Eliminar
                      </button>
                      <button
                        className={styles.editCardBtn}
                        onClick={() => openModal("nivel", nivel)}
                      >
                        ✏️ Editar
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.empty}>No hay niveles registrados</div>
            )}
          </div>
        );

      case "grados":
        return (
          <>
            <div className={styles.filterBar}>
              <select
                value={nivelFiltro}
                onChange={(e) => setNivelFiltro(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="">Todos los niveles</option>
                {niveles.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.dataGrid}>
              {grados.length > 0 ? (
                grados.map((grado) => (
                  <div key={grado.id} className={styles.card}>
                    <div className={styles.cardIcon}>🎓</div>
                    <div className={styles.cardInfo}>
                      <h3>{grado.nombre}</h3>
                      <p>Orden: {grado.orden}</p>
                      {grado.nivel && (
                        <span className={styles.meta}>
                          Nivel: {grado.nivel.nombre}
                        </span>
                      )}
                      <div className={styles.cardActions}>
                        <button
                          className={styles.deleteCardBtn}
                          onClick={() =>
                            openDeleteModal("grados", grado.id, grado.nombre)
                          }
                          title="Eliminar grado"
                        >
                          🗑️ Eliminar
                        </button>
                        <button
                          className={styles.editCardBtn}
                          onClick={() => openModal("grado", grado)}
                        >
                          ✏️ Editar
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.empty}>No hay grados registrados</div>
              )}
            </div>
          </>
        );

      case "tipos-actividad":
        return (
          <div className={styles.dataGrid}>
            {tiposActividad.length > 0 ? (
              tiposActividad.map((tipo) => (
                <div key={tipo.id} className={styles.card}>
                  <div className={styles.cardIcon}>📝</div>
                  <div className={styles.cardInfo}>
                    <h3>{tipo.nombre}</h3>
                    <div className={styles.cardActions}>
                      <button
                        className={styles.deleteCardBtn}
                        onClick={() =>
                          openDeleteModal(
                            "tipos-actividad",
                            tipo.id,
                            tipo.nombre,
                          )
                        }
                        title="Eliminar tipo de actividad"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.empty}>
                No hay tipos de actividad registrados
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const getAddButtonConfig = () => {
    switch (activeTab) {
      case "sedes":
        return { label: "+ Nueva Sede", type: "sede" as const };
      case "anios":
        return { label: "+ Nuevo Año", type: "anio" as const };
      case "periodos":
        return { label: "+ Nuevo Periodo", type: "periodo" as const };
      case "areas":
        return { label: "+ Nueva Área", type: "area" as const };
      case "niveles":
        return { label: "+ Nuevo Nivel", type: "nivel" as const };
      case "grados":
        return { label: "+ Nuevo Grado", type: "grado" as const };
      case "tipos-actividad":
        return { label: "+ Nuevo Tipo", type: "tipo-actividad" as const };
    }
  };

  const addBtn = getAddButtonConfig();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleSection}>
          <h1>Configuración Académica</h1>
          <p>Parámetros base del sistema escolar</p>
        </div>
        {addBtn && (
          <button
            className={styles.addBtn}
            onClick={() => openModal(addBtn.type)}
          >
            {addBtn.label}
          </button>
        )}
      </header>

      <div className={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tabBtn} ${activeTab === tab.id ? styles.activeTab : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className={styles.tabIcon}>{tab.icon}</span>
            {tab.name}
          </button>
        ))}
      </div>

      <div className={styles.content}>{renderContent()}</div>

      {/* Modal */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>
                {modalMode === "edit" ? "Editar " : "Nueva "}
                {modalType === "sede" && "Sede"}
                {modalType === "anio" && "Año Lectivo"}
                {modalType === "periodo" && "Periodo"}
                {modalType === "area" && "Área"}
                {modalType === "asignatura" && "Asignatura"}
                {modalType === "nivel" && "Nivel"}
                {modalType === "grado" && "Grado"}
                {modalType === "tipo-actividad" && "Tipo de Actividad"}
              </h2>
              <button
                className={styles.closeBtn}
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              {modalType === "sede" && (
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Nombre *</label>
                    <input
                      name="nombre"
                      value={formData.nombre || ""}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Dirección</label>
                    <input
                      name="direccion"
                      value={formData.direccion || ""}
                      onChange={handleChange}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Teléfono</label>
                    <input
                      name="telefono"
                      value={formData.telefono || ""}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              )}

              {modalType === "anio" && (
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Año *</label>
                    <input
                      type="number"
                      name="anio"
                      value={formData.anio || new Date().getFullYear()}
                      onChange={handleChange}
                      min="2000"
                      max="2100"
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Fecha Inicio *</label>
                    <input
                      type="date"
                      name="fecha_inicio"
                      value={formData.fecha_inicio || ""}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Fecha Fin *</label>
                    <input
                      type="date"
                      name="fecha_fin"
                      value={formData.fecha_fin || ""}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className={styles.formGroupCheck}>
                    <label>
                      <input
                        type="checkbox"
                        name="activo"
                        checked={formData.activo || false}
                        onChange={handleChange}
                      />
                      Marcar como año activo
                    </label>
                  </div>
                </div>
              )}

              {modalType === "periodo" && (
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Nombre *</label>
                    <input
                      name="nombre"
                      value={formData.nombre || ""}
                      onChange={handleChange}
                      placeholder="Ej: Primer Periodo"
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Número *</label>
                    <input
                      type="number"
                      name="numero"
                      value={formData.numero || ""}
                      onChange={handleChange}
                      min="1"
                      max="5"
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Peso (%) *</label>
                    <input
                      type="number"
                      name="porcentaje_peso"
                      value={formData.porcentaje_peso || ""}
                      onChange={handleChange}
                      min="0"
                      max="100"
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Fecha Inicio *</label>
                    <input
                      type="date"
                      name="fecha_inicio"
                      value={formData.fecha_inicio || ""}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Fecha Fin *</label>
                    <input
                      type="date"
                      name="fecha_fin"
                      value={formData.fecha_fin || ""}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              )}

              {modalType === "area" && (
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Nombre del Área *</label>
                    <input
                      name="nombre"
                      value={formData.nombre || ""}
                      onChange={handleChange}
                      placeholder="Ej: Matemáticas"
                      required
                    />
                  </div>
                </div>
              )}

              {modalType === "asignatura" && (
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Nombre *</label>
                    <input
                      name="nombre"
                      value={formData.nombre || ""}
                      onChange={handleChange}
                      placeholder="Ej: Álgebra"
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Área *</label>
                    <select
                      name="area_id"
                      value={formData.area_id || ""}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Seleccionar...</option>
                      {areas.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {modalType === "nivel" && (
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Nombre del Nivel *</label>
                    <input
                      name="nombre"
                      value={formData.nombre || ""}
                      onChange={handleChange}
                      placeholder="Ej: Primaria"
                      required
                    />
                  </div>
                </div>
              )}

              {modalType === "grado" && (
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Nombre del Grado *</label>
                    <input
                      name="nombre"
                      value={formData.nombre || ""}
                      onChange={handleChange}
                      placeholder="Ej: Primero"
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Código</label>
                    <input
                      name="codigo"
                      value={formData.codigo || ""}
                      onChange={handleChange}
                      placeholder="Ej: 1°"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Orden *</label>
                    <input
                      type="number"
                      name="orden"
                      value={formData.orden || 1}
                      onChange={handleChange}
                      min="1"
                      max="11"
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Nivel *</label>
                    <select
                      name="nivel_id"
                      value={formData.nivel_id || ""}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Seleccionar...</option>
                      {niveles.map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {modalType === "tipo-actividad" && (
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Nombre del Tipo *</label>
                    <input
                      name="nombre"
                      value={formData.nombre || ""}
                      onChange={handleChange}
                      placeholder="Ej: Taller"
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.cancelBtn}
                onClick={() => setShowModal(false)}
              >
                Cancelar
              </button>
              <button
                className={styles.saveBtn}
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving
                  ? "Guardando..."
                  : modalMode === "edit"
                    ? "Guardar Cambios"
                    : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deleteItem && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>⚠️ Confirmar Eliminación</h2>
              <button
                className={styles.closeBtn}
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteError(null);
                }}
              >
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              <p>
                ¿Estás seguro de que deseas eliminar{" "}
                <strong>{deleteItem.name}</strong>?
              </p>
              <p className={styles.deleteWarning}>
                Esta acción no se puede deshacer.
              </p>

              {deleteError && (
                <div className={styles.errorMessage}>{deleteError}</div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.cancelBtn}
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteError(null);
                }}
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                className={styles.deleteBtn}
                onClick={handleDelete}
                disabled={deleting || !!deleteError}
              >
                {deleting ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
