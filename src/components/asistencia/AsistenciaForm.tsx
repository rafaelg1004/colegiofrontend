"use client";

import React, { useEffect, useState } from "react";
import { getAuthToken } from "@/utils/auth";
import { API_URL } from "@/utils/api";
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
      const token = getAuthToken();
      if (!token) {
        console.warn("No hay token de autenticación");
        return;
      }
      const resGrupos = await fetch(`${API_URL}/grupos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const gruposData = await resGrupos.json();
      setGrupos(Array.isArray(gruposData) ? gruposData : gruposData.data || []);

      const resAreas = await fetch(`${API_URL}/academico/areas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const areas = await resAreas.json();
      setAsignaturas(
        Array.isArray(areas)
          ? areas.flatMap((a: any) => a.asignatura || [])
          : [],
      );
    };
    fetchData();
  }, []);

  const handleCargarLista = async () => {
    if (!selectedGrupo) return;
    setLoading(true);
    try {
      const token = getAuthToken();
      // Primero intentamos ver si ya hay asistencia para esa fecha
      const resExistente = await fetch(
        `${API_URL}/asistencia/fecha?grupo_id=${selectedGrupo}&fecha=${fecha}${selectedAsignatura ? `&asignatura_id=${selectedAsignatura}` : ""}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const dataExistente = await resExistente.json();

      if (dataExistente.length > 0) {
        setEstudiantes(
          dataExistente.map((a: any) => ({
            ...a.estudiante,
            asistencia_id: a.id,
            estado: a.estado,
            justificacion: a.justificacion,
          })),
        );
      } else {
        // Si no hay, cargamos los estudiantes del grupo para crearla
        const resEst = await fetch(
          `${API_URL}/grupos/${selectedGrupo}/estudiantes`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const dataEst = await resEst.json();
        setEstudiantes(
          dataEst.map((e: any) => ({
            ...e.estudiante,
            estado: "Presente",
            justificacion: "",
          })),
        );
      }
    } catch (err) {
      console.error(err);
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
    setSaving(true);
    try {
      const token = getAuthToken();
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

      const res = await fetch(`${API_URL}/asistencia`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert("Asistencia guardada correctamente");
      } else {
        throw new Error(" Error al guardar");
      }
    } catch (err) {
      alert("Error al guardar asistencia");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Control de Asistencia</h1>
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
            <span className={styles.present}>
              Presentes:{" "}
              {estudiantes.filter((e) => e.estado === "Presente").length}
            </span>
            <span className={styles.absent}>
              Ausentes:{" "}
              {estudiantes.filter((e) => e.estado === "Ausente").length}
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
                  {["Presente", "Ausente", "Tardanza", "Excusa"].map(
                    (estado) => (
                      <button
                        key={estado}
                        onClick={() => updateEstado(est.id, estado)}
                        className={`${styles.stateBtn} ${est.estado === estado ? styles[estado.toLowerCase()] : ""}`}
                      >
                        {estado[0]}
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
