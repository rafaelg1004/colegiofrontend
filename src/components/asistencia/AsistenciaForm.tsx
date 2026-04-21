"use client";

import React, { useEffect, useState } from "react";
import { getAuthToken } from "@/utils/auth";
import { API_URL, api } from "@/utils/api";
import styles from "./AsistenciaForm.module.css";

export const AsistenciaForm = () => {
  const [grupos, setGrupos] = useState<any[]>([]);
  const [asignaturas, setAsignaturas] = useState<any[]>([]);
  const [selectedGrupo, setSelectedGrupo] = useState("");
  const [selectedAsignatura, setSelectedAsignatura] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);

  const [estudiantes, setEstudiantes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const gruposData = await api.get("/grupos");
        setGrupos(Array.isArray(gruposData) ? gruposData : gruposData.data || []);

        const areas = await api.get("/academico/areas");
        const asignaturasList = Array.isArray(areas)
          ? areas.flatMap((a: any) => a.asignatura || [])
          : [];
        setAsignaturas(asignaturasList);
      } catch (err) {
        console.error("Error cargando datos iniciales:", err);
      }
    };
    fetchData();
  }, []);

  const handleCargarLista = async () => {
    if (!selectedGrupo) return;
    setLoading(true);
    setEstudiantes([]); // Limpiar lista anterior
    try {
      // 1. Intentar cargar asistencia existente para esa fecha/grupo/asignatura
      const queryParams = new URLSearchParams({
        fecha,
        ...(selectedAsignatura && { asignatura_id: selectedAsignatura }),
      });

      const dataExistente = await api.get(
        `/asistencia/grupo/${selectedGrupo}?${queryParams.toString()}`,
      );

      if (Array.isArray(dataExistente) && dataExistente.length > 0) {
        setEstudiantes(
          dataExistente.map((a: any) => ({
            ...a.estudiante,
            asistencia_id: a.id,
            estado: a.estado,
            justificacion: a.justificacion,
          })),
        );
      } else {
        // 2. Si no hay, cargar los estudiantes del grupo para crearla
        const dataEst = await api.get(`/grupos/${selectedGrupo}/estudiantes`);
        const listaEstudiantes = Array.isArray(dataEst) ? dataEst : dataEst.data || [];
        
        setEstudiantes(
          listaEstudiantes.map((e: any) => ({
            ...(e.estudiante || e), // Manejar diferentes estructuras de respuesta
            estado: "",
            justificacion: "",
          })),
        );
      }
    } catch (err) {
      console.error("Error al cargar lista:", err);
      alert("No se pudo cargar la lista de estudiantes");
    } finally {
      setLoading(false);
    }
  };

  const updateEstado = (estudianteId: string, nuevoEstado: string) => {
    setEstudiantes((prev) =>
      prev.map((e) =>
        e.id === estudianteId ? { ...e, estado: nuevoEstado } : e,
      ),
    );
  };

  const handleGuardar = async () => {
    if (estudiantes.length === 0) return;

    // Validar que todos tengan un estado seleccionado
    const incompleto = estudiantes.some((e) => !e.estado);
    if (incompleto) {
      alert("Por favor, asigne un estado (P, A, T o E) a todos los estudiantes antes de guardar.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        fecha,
        grupo_id: selectedGrupo,
        asignatura_id: selectedAsignatura || undefined,
        asistencias: estudiantes.map((e) => ({
          estudiante_id: e.id,
          estado: e.estado,
          justificacion: e.justificacion,
        })),
      };

      await api.post("/asistencia", payload);
      alert("Asistencia guardada correctamente");
    } catch (err: any) {
      alert(err.message || "Error al guardar asistencia");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Control de Asistencia</h1>
        
        <div className={styles.instructionCard}>
          <h3>ℹ️ Instrucciones de Toma de Asistencia</h3>
          <p>Seleccione el grupo y la fecha. Haga clic en los botones para marcar el estado de cada estudiante.</p>
          <div className={styles.legend}>
            <div className={styles.legendItem}>
              <span className={styles.dot} style={{ background: "#16a34a" }}></span>
              <span>P: Presente</span>
            </div>
            <div className={styles.legendItem}>
              <span className={styles.dot} style={{ background: "#dc2626" }}></span>
              <span>A: Ausente</span>
            </div>
            <div className={styles.legendItem}>
              <span className={styles.dot} style={{ background: "#d97706" }}></span>
              <span>T: Tardanza</span>
            </div>
            <div className={styles.legendItem}>
              <span className={styles.dot} style={{ background: "#7c3aed" }}></span>
              <span>E: Excusa</span>
            </div>
          </div>
        </div>

        <div className={styles.filters}>
          <div className={styles.filterItem}>
            <label>Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>
          <div className={styles.filterItem}>
            <label>Grupo</label>
            <select
              value={selectedGrupo}
              onChange={(e) => setSelectedGrupo(e.target.value)}
            >
              <option value="">Seleccionar</option>
              {grupos.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.filterItem}>
            <label>Asignatura (Opcional)</label>
            <select
              value={selectedAsignatura}
              onChange={(e) => setSelectedAsignatura(e.target.value)}
            >
              <option value="">Dirección de Grupo / General</option>
              {asignaturas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleCargarLista}
            className={styles.loadBtn}
            disabled={loading}
          >
            {loading ? "..." : "Cargar"}
          </button>
        </div>
      </header>

      {estudiantes.length > 0 && (
        <div className={styles.listContainer}>
          <div className={styles.stats}>
            <span>Total: {estudiantes.length}</span>
            <span className={styles.presente}>
              Presentes:{" "}
              {estudiantes.filter((e) => e.estado === "Presente").length}
            </span>
            <span className={styles.absent}>
              Ausentes:{" "}
              {estudiantes.filter((e) => e.estado === "Ausente").length}
            </span>
            <span style={{ color: "#d97706" }}>
              Sin Procesar:{" "}
              {estudiantes.filter((e) => !e.estado).length}
            </span>
          </div>

          <div className={styles.list}>
            {estudiantes.map((est) => (
              <div key={est.id} className={styles.studentItem}>
                <div className={styles.studentInfo}>
                  <p className={styles.studentName}>
                    {est.primer_nombre} {est.primer_apellido}
                  </p>
                  <p className={styles.studentDoc}>{est.numero_documento}</p>
                </div>
                <div className={styles.attendanceActions}>
                  {[
                    { label: "Presente", short: "P" },
                    { label: "Ausente", short: "A" },
                    { label: "Tardanza", short: "T" },
                    { label: "Excusa", short: "E" }
                  ].map(
                    (status) => (
                      <button
                        key={status.label}
                        title={status.label}
                        onClick={() => updateEstado(est.id, status.label)}
                        className={`${styles.stateBtn} ${est.estado === status.label ? styles[status.label.toLowerCase()] : ""}`}
                      >
                        {status.short}
                      </button>
                    ),
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.footer}>
            <button
              onClick={handleGuardar}
              className={styles.saveBtn}
              disabled={saving}
            >
              {saving ? "Guardando..." : "Guardar Asistencia"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
