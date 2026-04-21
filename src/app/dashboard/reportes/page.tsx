"use client";

import { useEffect, useState } from "react";
import { getAuthToken } from "@/utils/auth";
import { API_URL } from "@/utils/api";

interface Estudiante {
  id: string;
  primer_nombre: string;
  primer_apellido: string;
  numero_documento: string;
}

interface Grupo {
  id: string;
  nombre: string;
  grado: { nombre: string };
}

interface DashboardStats {
  total_estudiantes?: number;
  total_empleados?: number;
  total_matriculas?: number;
  promedio_asistencia?: number;
}

interface GrupoStats {
  promedio_notas?: number;
  cantidad_estudiantes?: number;
  promedio_asistencia?: number;
}

const API = `${API_URL}`;

export default function ReportesPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);

  // Datos
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(
    null,
  );
  const [grupoStats, setGrupoStats] = useState<Record<string, GrupoStats>>({});
  const [boletin, setBoletin] = useState<any>(null);

  // Selecciones
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState("");
  const [grupoSeleccionado, setGrupoSeleccionado] = useState("");

  useEffect(() => {
    loadEstudiantes();
    loadGrupos();
    loadDashboardStats();
  }, []);

  const loadEstudiantes = async () => {
    const token = getAuthToken();
    const res = await fetch(`${API}/estudiantes?limit=100`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    setEstudiantes(Array.isArray(data.data) ? data.data : []);
  };

  const loadGrupos = async () => {
    const token = getAuthToken();
    const res = await fetch(`${API}/grupos`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    setGrupos(Array.isArray(data) ? data : data.data || []);
  };

  const loadDashboardStats = async () => {
    const token = getAuthToken();
    const res = await fetch(`${API}/reportes/dashboard/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    // Mapear nombres de campos del backend
    setDashboardStats({
      total_estudiantes: data.matriculados || data.total_estudiantes || 0,
      total_empleados: data.personal || data.total_empleados || 0,
      total_matriculas: data.matriculados || 0,
      promedio_asistencia: data.promedio_asistencia || 0,
    });
  };

  const loadGrupoStats = async (grupoId: string) => {
    const token = getAuthToken();
    try {
      const res = await fetch(`${API}/reportes/grupo/${grupoId}/estadisticas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setGrupoStats((prev) => ({ ...prev, [grupoId]: data }));
    } catch (err) {
      console.error("Error cargando stats:", err);
    }
  };

  const loadBoletin = async (estudianteId: string) => {
    if (!estudianteId) return;
    setLoading(true);
    setBoletin(null);
    const token = getAuthToken();
    try {
      const res = await fetch(`${API}/reportes/boletin/${estudianteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        console.error("Error Response:", res.status, res.statusText);
        alert(`Error ${res.status}: ${res.statusText}`);
        return;
      }
      const text = await res.text();
      console.log("Response text:", text.substring(0, 500));
      if (!text) {
        setBoletin({
          estudiante: { primer_nombre: "", primer_apellido: "" },
          calificaciones: [],
        });
        return;
      }
      const data = JSON.parse(text);
      setBoletin(data);
    } catch (err) {
      console.error("Error cargando boletin:", err);
      alert("Error al parsear respuesta del servidor");
    }
    setLoading(false);
  };

  const handleVerEstadisticasGrupo = (grupoId: string) => {
    if (!grupoStats[grupoId]) {
      loadGrupoStats(grupoId);
    }
  };

  // Auto-load stats when switching to grupos tab
  useEffect(() => {
    if (
      activeTab === "grupos" &&
      grupos.length > 0 &&
      Object.keys(grupoStats).length === 0
    ) {
      // Load stats for first few groups
      grupos.slice(0, 5).forEach((g) => loadGrupoStats(g.id));
    }
  }, [activeTab]);

  const tabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "boletin", label: "Boletín de Notas" },
    { id: "grupos", label: "Estadísticas por Grupo" },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <h1 style={{ marginBottom: "20px" }}>Reportes</h1>

      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
          borderBottom: "1px solid #ccc",
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "10px 20px",
              border: "none",
              background: activeTab === tab.id ? "#3b82f6" : "#e5e7eb",
              color: activeTab === tab.id ? "white" : "black",
              cursor: "pointer",
              borderRadius: "4px 4px 0 0",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "dashboard" && (
        <div>
          <h3>Estadísticas Generales</h3>
          {dashboardStats && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "20px",
                marginTop: "20px",
              }}
            >
              <div
                style={{
                  padding: "20px",
                  background: "#3b82f6",
                  color: "white",
                  borderRadius: "8px",
                }}
              >
                <div style={{ fontSize: "32px", fontWeight: "bold" }}>
                  {dashboardStats.total_estudiantes || 0}
                </div>
                <div>Estudiantes</div>
              </div>
              <div
                style={{
                  padding: "20px",
                  background: "#22c55e",
                  color: "white",
                  borderRadius: "8px",
                }}
              >
                <div style={{ fontSize: "32px", fontWeight: "bold" }}>
                  {dashboardStats.total_empleados || 0}
                </div>
                <div>Empleados</div>
              </div>
              <div
                style={{
                  padding: "20px",
                  background: "#f59e0b",
                  color: "white",
                  borderRadius: "8px",
                }}
              >
                <div style={{ fontSize: "32px", fontWeight: "bold" }}>
                  {dashboardStats.total_matriculas || 0}
                </div>
                <div>Matrículas</div>
              </div>
              <div
                style={{
                  padding: "20px",
                  background: "#8b5cf6",
                  color: "white",
                  borderRadius: "8px",
                }}
              >
                <div style={{ fontSize: "32px", fontWeight: "bold" }}>
                  {dashboardStats.promedio_asistencia?.toFixed(1) || 0}%
                </div>
                <div>Asistencia Promedio</div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "boletin" && (
        <div>
          <h3>Boletín de Notas por Estudiante</h3>
          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            <select
              value={estudianteSeleccionado}
              onChange={(e) => {
                setEstudianteSeleccionado(e.target.value);
                loadBoletin(e.target.value);
              }}
              style={{ padding: "8px", flex: 1 }}
            >
              <option value="">Seleccionar estudiante...</option>
              {estudiantes.map((est) => (
                <option key={est.id} value={est.id}>
                  {est.primer_nombre} {est.primer_apellido} -{" "}
                  {est.numero_documento}
                </option>
              ))}
            </select>
          </div>

          {loading && <p>Cargando...</p>}

          {boletin && (
            <div
              style={{
                background: "white",
                padding: "20px",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
              }}
            >
              <h4 style={{ marginBottom: "15px" }}>
                {boletin.estudiante?.primer_nombre}{" "}
                {boletin.estudiante?.primer_apellido}
              </h4>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f3f4f6" }}>
                    <th style={{ padding: "10px", textAlign: "left" }}>
                      Asignatura
                    </th>
                    <th style={{ padding: "10px", textAlign: "center" }}>
                      Nota Final
                    </th>
                    <th style={{ padding: "10px", textAlign: "center" }}>
                      Desempeño
                    </th>
                    <th style={{ padding: "10px", textAlign: "left" }}>
                      Observación
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(boletin.calificaciones || boletin.notas || []).map(
                    (nota: any, idx: number) => (
                      <tr
                        key={idx}
                        style={{ borderBottom: "1px solid #e5e7eb" }}
                      >
                        <td style={{ padding: "10px" }}>
                          {nota.asignatura?.nombre || nota.asignatura || "-"}
                        </td>
                        <td style={{ padding: "10px", textAlign: "center" }}>
                          {nota.nota_final !== null &&
                          nota.nota_final !== undefined
                            ? Number(nota.nota_final).toFixed(1)
                            : "-"}
                        </td>
                        <td style={{ padding: "10px", textAlign: "center" }}>
                          <span
                            style={{
                              padding: "2px 8px",
                              borderRadius: "10px",
                              background:
                                nota.desempeno === "Superior"
                                  ? "#22c55e"
                                  : nota.desempeno === "Alto"
                                    ? "#3b82f6"
                                    : nota.desempeno === "Básico"
                                      ? "#f59e0b"
                                      : "#ef4444",
                              color: "white",
                              fontSize: "12px",
                            }}
                          >
                            {nota.desempeno || "-"}
                          </span>
                        </td>
                        <td style={{ padding: "10px" }}>
                          {nota.observacion_docente || "-"}
                        </td>
                      </tr>
                    ),
                  )}
                  {boletin.calificaciones?.length === 0 &&
                    boletin.notas?.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          style={{ padding: "20px", textAlign: "center" }}
                        >
                          No hay calificaciones registradas
                        </td>
                      </tr>
                    )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "grupos" && (
        <div>
          <h3>Estadísticas por Grupo</h3>
          <p style={{ fontSize: "12px", color: "#666", marginBottom: "10px" }}>
            Haz clic en "Cargar" para ver las estadísticas de cada grupo
          </p>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f3f4f6" }}>
                <th style={{ padding: "10px", textAlign: "left" }}>Grupo</th>
                <th style={{ padding: "10px", textAlign: "center" }}>
                  Estudiantes
                </th>
                <th style={{ padding: "10px", textAlign: "center" }}>
                  Promedio Notas
                </th>
                <th style={{ padding: "10px", textAlign: "center" }}>
                  Asistencia
                </th>
                <th style={{ padding: "10px", textAlign: "center" }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {grupos.map((grupo) => (
                <tr
                  key={grupo.id}
                  style={{ borderBottom: "1px solid #e5e7eb" }}
                >
                  <td style={{ padding: "10px" }}>
                    {grupo.grado?.nombre} - {grupo.nombre}
                  </td>
                  <td style={{ padding: "10px", textAlign: "center" }}>
                    {grupoStats[grupo.id] !== undefined
                      ? grupoStats[grupo.id]?.cantidad_estudiantes || 0
                      : "-"}
                  </td>
                  <td style={{ padding: "10px", textAlign: "center" }}>
                    {grupoStats[grupo.id] !== undefined
                      ? grupoStats[grupo.id]?.promedio_notas?.toFixed(2) ||
                        "0.00"
                      : "-"}
                  </td>
                  <td style={{ padding: "10px", textAlign: "center" }}>
                    {grupoStats[grupo.id] !== undefined
                      ? `${grupoStats[grupo.id]?.promedio_asistencia?.toFixed(1) || "0"}%`
                      : "-"}
                  </td>
                  <td style={{ padding: "10px", textAlign: "center" }}>
                    <button
                      onClick={() => handleVerEstadisticasGrupo(grupo.id)}
                      style={{
                        padding: "5px 10px",
                        background: "#3b82f6",
                        color: "white",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      {grupoStats[grupo.id] ? "Actualizar" : "Cargar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
