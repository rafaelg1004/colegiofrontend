"use client";

import { useEffect, useState, useCallback } from "react";
import { getAuthToken } from "@/utils/auth";
import { API_URL } from "@/utils/api";
import styles from "./ObservadorView.module.css";

interface Estudiante {
  id: string;
  primer_nombre: string;
  primer_apellido: string;
  numero_documento: string;
}

interface Observacion {
  id: string;
  fecha: string;
  tipo: "Positiva" | "Negativa" | "Informativa" | "Compromiso";
  descripcion: string;
  compromiso?: string;
  firma_acudiente: boolean;
  registrado_por_empleado?: {
    primer_nombre: string;
    primer_apellido: string;
    cargo: string;
  };
}

interface Resumen {
  total: number;
  positivas: number;
  negativas: number;
  informativas: number;
  compromisos: number;
}

const API = `${API_URL}`;

export const ObservadorView = () => {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [estudianteSeleccionado, setEstudianteSeleccionado] =
    useState<Estudiante | null>(null);
  const [observaciones, setObservaciones] = useState<Observacion[]>([]);
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [buscar, setBuscar] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [editandoObs, setEditandoObs] = useState<Observacion | null>(null);

  const fetchEstudiantes = useCallback(async () => {
    if (!buscar || buscar.length < 2) {
      setEstudiantes([]);
      return;
    }
    const token = getAuthToken();
    if (!token) return;

    try {
      const res = await fetch(
        `${API}/estudiantes?buscar=${encodeURIComponent(buscar)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        const data = await res.json();
        setEstudiantes(
          Array.isArray(data.data)
            ? data.data.slice(0, 10)
            : Array.isArray(data)
              ? data.slice(0, 10)
              : [],
        );
      }
    } catch (err) {
      console.error("Error fetching estudiantes:", err);
    }
  }, [buscar]);

  useEffect(() => {
    const timer = setTimeout(() => fetchEstudiantes(), 300);
    return () => clearTimeout(timer);
  }, [fetchEstudiantes]);

  const seleccionarEstudiante = async (est: Estudiante) => {
    setEstudianteSeleccionado(est);
    setBuscar("");
    setEstudiantes([]);
    setLoading(true);

    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const [obsRes, resumenRes] = await Promise.all([
        fetch(`${API}/observador/estudiante/${est.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API}/observador/resumen/${est.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (obsRes.ok) {
        const data = await obsRes.json();
        setObservaciones(Array.isArray(data) ? data : []);
      } else {
        console.error("Error fetching observaciones:", obsRes.status);
        setObservaciones([]);
      }

      if (resumenRes.ok) {
        setResumen(await resumenRes.json());
      } else {
        setResumen({
          total: 0,
          positivas: 0,
          negativas: 0,
          informativas: 0,
          compromisos: 0,
        });
      }
    } catch (err) {
      console.error("Error:", err);
      setObservaciones([]);
    }

    setLoading(false);
  };

  const openModal = (obs?: Observacion) => {
    if (obs) {
      setEditandoObs(obs);
      setFormData({
        id: obs.id,
        estudiante_id: estudianteSeleccionado?.id,
        tipo: obs.tipo,
        descripcion: obs.descripcion,
        compromiso: obs.compromiso || "",
      });
    } else {
      setEditandoObs(null);
      setFormData({
        estudiante_id: estudianteSeleccionado?.id,
        tipo: "Informativa",
        descripcion: "",
        compromiso: "",
      });
    }
    setShowModal(true);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!formData.descripcion?.trim()) {
      alert("La descripción es obligatoria");
      return;
    }

    setSaving(true);
    try {
      const token = getAuthToken();
      const url = editandoObs
        ? `${API}/observador/${editandoObs.id}`
        : `${API}/observador`;
      const method = editandoObs ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Error al guardar");
      }

      setShowModal(false);
      setEditandoObs(null);
      if (estudianteSeleccionado) {
        await seleccionarEstudiante(estudianteSeleccionado);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async (obsId: string) => {
    if (!confirm("¿Estás seguro de eliminar esta observación?")) return;

    try {
      const token = getAuthToken();
      const res = await fetch(`${API}/observador/${obsId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Error al eliminar");
      }

      if (estudianteSeleccionado) {
        await seleccionarEstudiante(estudianteSeleccionado);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleFirmar = async (obsId: string) => {
    try {
      const token = getAuthToken();
      const res = await fetch(`${API}/observador/${obsId}/firmar`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Error al firmar");
      }

      if (estudianteSeleccionado) {
        await seleccionarEstudiante(estudianteSeleccionado);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getTipoColor = (tipo: string) => {
    const colores: Record<string, string> = {
      Positiva: styles.tipoPositiva,
      Negativa: styles.tipoNegativa,
      Informativa: styles.tipoInformativa,
      Compromiso: styles.tipoCompromiso,
    };
    return colores[tipo] || styles.tipoInformativa;
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleSection}>
          <h1>Observador del Alumno</h1>
          <p>Registro de observaciones y seguimiento</p>
        </div>
      </header>

      <div className={styles.searchSection}>
        <div className={styles.searchWrapper}>
          <input
            type="text"
            placeholder="Buscar estudiante por nombre o documento..."
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            className={styles.searchInput}
          />
          {estudiantes.length > 0 && (
            <div className={styles.searchResults}>
              {estudiantes.map((est) => (
                <div
                  key={est.id}
                  className={styles.searchItem}
                  onClick={() => seleccionarEstudiante(est)}
                >
                  <span className={styles.nombre}>
                    {est.primer_nombre} {est.primer_apellido}
                  </span>
                  <span className={styles.doc}>{est.numero_documento}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {estudianteSeleccionado && (
        <div className={styles.estudiantePanel}>
          <div className={styles.estudianteHeader}>
            <div className={styles.estudianteInfo}>
              <div className={styles.avatar}>
                {estudianteSeleccionado.primer_nombre[0]}
                {estudianteSeleccionado.primer_apellido[0]}
              </div>
              <div>
                <h2>
                  {estudianteSeleccionado.primer_nombre}{" "}
                  {estudianteSeleccionado.primer_apellido}
                </h2>
                <p>Doc: {estudianteSeleccionado.numero_documento}</p>
              </div>
            </div>
            <button className={styles.addBtn} onClick={() => openModal()}>
              + Nueva Observacion
            </button>
          </div>

          {resumen && (
            <div className={styles.resumenGrid}>
              <div className={`${styles.resumenCard} ${styles.resumenTotal}`}>
                <span className={styles.resumenNum}>{resumen.total}</span>
                <span className={styles.resumenLabel}>Total</span>
              </div>
              <div
                className={`${styles.resumenCard} ${styles.resumenPositiva}`}
              >
                <span className={styles.resumenNum}>{resumen.positivas}</span>
                <span className={styles.resumenLabel}>Positivas</span>
              </div>
              <div
                className={`${styles.resumenCard} ${styles.resumenNegativa}`}
              >
                <span className={styles.resumenNum}>{resumen.negativas}</span>
                <span className={styles.resumenLabel}>Negativas</span>
              </div>
              <div className={`${styles.resumenCard} ${styles.resumenInfo}`}>
                <span className={styles.resumenNum}>
                  {resumen.informativas}
                </span>
                <span className={styles.resumenLabel}>Informativas</span>
              </div>
              <div
                className={`${styles.resumenCard} ${styles.resumenCompromiso}`}
              >
                <span className={styles.resumenNum}>{resumen.compromisos}</span>
                <span className={styles.resumenLabel}>Compromisos</span>
              </div>
            </div>
          )}

          {loading ? (
            <div className={styles.loading}>Cargando observaciones...</div>
          ) : (
            <div className={styles.observacionesList}>
              {observaciones.map((obs) => (
                <div key={obs.id} className={styles.observacionCard}>
                  <div className={styles.obsHeader}>
                    <span
                      className={`${styles.tipoTag} ${getTipoColor(obs.tipo)}`}
                    >
                      {obs.tipo}
                    </span>
                    <span className={styles.fecha}>
                      {new Date(obs.fecha).toLocaleDateString("es-CO")}
                    </span>
                  </div>
                  <p className={styles.descripcion}>{obs.descripcion}</p>
                  {obs.compromiso && (
                    <div className={styles.compromiso}>
                      <strong>Compromiso:</strong> {obs.compromiso}
                    </div>
                  )}
                  <div className={styles.obsFooter}>
                    {obs.registrado_por_empleado && (
                      <span className={styles.registradoPor}>
                        Registrado por:{" "}
                        {obs.registrado_por_empleado.primer_nombre}{" "}
                        {obs.registrado_por_empleado.primer_apellido}(
                        {obs.registrado_por_empleado.cargo})
                      </span>
                    )}
                    <div className={styles.obsActions}>
                      {!obs.firma_acudiente && (
                        <button
                          className={styles.firmarBtn}
                          onClick={() => handleFirmar(obs.id)}
                          title="Firmar observación"
                        >
                          ✍️ Firmar
                        </button>
                      )}
                      <button
                        className={styles.editarBtn}
                        onClick={() => openModal(obs)}
                        title="Editar observación"
                      >
                        ✏️
                      </button>
                      <button
                        className={styles.eliminarBtn}
                        onClick={() => handleEliminar(obs.id)}
                        title="Eliminar observación"
                      >
                        🗑️
                      </button>
                    </div>
                    <span
                      className={`${styles.firmaTag} ${obs.firma_acudiente ? styles.firmado : styles.pendiente}`}
                    >
                      {obs.firma_acudiente ? "Firmado" : "Pendiente firma"}
                    </span>
                  </div>
                </div>
              ))}
              {observaciones.length === 0 && (
                <div className={styles.empty}>
                  No hay observaciones registradas
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!estudianteSeleccionado && (
        <div className={styles.placeholder}>
          <div className={styles.placeholderIcon}>📋</div>
          <h3>Selecciona un estudiante</h3>
          <p>Busca y selecciona un estudiante para ver su observador</p>
        </div>
      )}

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>
                {editandoObs ? "Editar Observación" : "Nueva Observación"}
              </h2>
              <button
                className={styles.closeBtn}
                onClick={() => setShowModal(false)}
              >
                x
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Tipo de Observación *</label>
                <select
                  name="tipo"
                  value={formData.tipo || "Informativa"}
                  onChange={handleChange}
                >
                  <option value="Positiva">Positiva</option>
                  <option value="Negativa">Negativa</option>
                  <option value="Informativa">Informativa</option>
                  <option value="Compromiso">Compromiso</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Descripción *</label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion || ""}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Describa la observación..."
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Compromiso (opcional)</label>
                <textarea
                  name="compromiso"
                  value={formData.compromiso || ""}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Compromisos adquiridos..."
                />
              </div>
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
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
