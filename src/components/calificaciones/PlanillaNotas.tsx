'use client';

import React, { useEffect, useState } from 'react';
import { getAuthToken, clearAuthCookie, isTokenExpired, logout } from '@/utils/auth';
import styles from './PlanillaNotas.module.css';

// Helper to check auth before making requests
const checkAuth = () => {
  const token = getAuthToken();
  if (!token || isTokenExpired(token)) {
    logout();
    return false;
  }
  return true;
};

interface Actividad {
  id: string;
  nombre: string;
  porcentaje_peso: number;
  tipo_actividad?: { nombre: string };
  fecha?: string;
}

interface Estudiante {
  id: string;
  primer_nombre: string;
  primer_apellido: string;
}

interface NotaActividad {
  actividad_id: string;
  nota: number | null;
  calificacion_id: string | null;
}

interface FilaPlanilla {
  estudiante: Estudiante;
  notas: NotaActividad[];
  nota_final: number | null;
  desempeno: string | null;
}

interface PlanillaData {
  actividades: Actividad[];
  planilla: FilaPlanilla[];
}

export const PlanillaNotas = () => {
  const [grupos, setGrupos] = useState<any[]>([]);
  const [periodos, setPeriodos] = useState<any[]>([]);
  const [asignaturas, setAsignaturas] = useState<any[]>([]);
  const [tiposActividad, setTiposActividad] = useState<any[]>([]);

  const [selectedGrupo, setSelectedGrupo] = useState('');
  const [selectedPeriodo, setSelectedPeriodo] = useState('');
  const [selectedAsignatura, setSelectedAsignatura] = useState('');

  const [planillaData, setPlanillaData] = useState<PlanillaData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Modal for creating/editing activities
  const [showModal, setShowModal] = useState(false);
  const [editingActividad, setEditingActividad] = useState<Actividad | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    porcentaje_peso: 10,
    tipo_actividad_id: '',
    fecha: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!checkAuth()) return;

      const token = getAuthToken();
      if (!token) {
        console.warn('No hay token de autenticación');
        return;
      }

      const resGrupos = await fetch('http://localhost:3005/api/v1/grupos', { headers: { 'Authorization': `Bearer ${token}` } });
      if (resGrupos.status === 401) { logout(); return; }
      const dataGrupos = await resGrupos.json();
      setGrupos(Array.isArray(dataGrupos) ? dataGrupos : dataGrupos.data || []);

      const resAnios = await fetch('http://localhost:3005/api/v1/academico/anios-lectivos', { headers: { 'Authorization': `Bearer ${token}` } });
      if (resAnios.status === 401) { logout(); return; }
      const anios = await resAnios.json();
      if (anios && anios.length > 0) {
        const resPeriodos = await fetch(`http://localhost:3005/api/v1/academico/periodos?anio_lectivo_id=${anios[0].id}`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (resPeriodos.status === 401) { logout(); return; }
        const periodosData = await resPeriodos.json();
        setPeriodos(Array.isArray(periodosData) ? periodosData : []);
      }

      const resAreas = await fetch('http://localhost:3005/api/v1/academico/areas', { headers: { 'Authorization': `Bearer ${token}` } });
      if (resAreas.status === 401) { logout(); return; }
      const areas = await resAreas.json();
      const allAsig = Array.isArray(areas) ? areas.flatMap((a: any) => a.asignatura || []) : [];
      setAsignaturas(allAsig);

      const resTipos = await fetch('http://localhost:3005/api/v1/calificaciones/tipos-actividad', { headers: { 'Authorization': `Bearer ${token}` } });
      if (resTipos.status === 401) { logout(); return; }
      const tipos = await resTipos.json();
      setTiposActividad(Array.isArray(tipos) ? tipos : []);
    };
    fetchData();
  }, []);

  const handleCargarPlanilla = async () => {
    if (!selectedGrupo || !selectedPeriodo || !selectedAsignatura) return;
    if (!checkAuth()) return;

    setLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`http://localhost:3005/api/v1/calificaciones/planilla?grupo_id=${selectedGrupo}&asignatura_id=${selectedAsignatura}&periodo_id=${selectedPeriodo}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) { logout(); return; }
      const data = await res.json();
      setPlanillaData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleNotaChange = (estudianteId: string, actividadId: string, value: string) => {
    if (!planillaData) return;

    const newPlanilla = {
      ...planillaData,
      planilla: planillaData.planilla.map(row => {
        if (row.estudiante.id === estudianteId) {
          const newNotas = row.notas.map(n =>
            n.actividad_id === actividadId
              ? { ...n, nota: value ? parseFloat(value) : null }
              : n
          );
          return { ...row, notas: newNotas };
        }
        return row;
      })
    };
    setPlanillaData(newPlanilla);
  };

  const handleGuardarNotas = async () => {
    if (!planillaData) return;
    if (!checkAuth()) return;

    setSaving(true);
    try {
      const token = getAuthToken();

      // Get all activities that have at least one grade
      for (const actividad of planillaData.actividades) {
        const calificaciones = planillaData.planilla
          .filter(row => row.notas.find(n => n.actividad_id === actividad.id)?.nota !== null)
          .map(row => {
            const nota = row.notas.find(n => n.actividad_id === actividad.id);
            return {
              estudiante_id: row.estudiante.id,
              nota: nota?.nota,
            };
          });

        if (calificaciones.length > 0) {
          const res = await fetch('http://localhost:3005/api/v1/calificaciones/registrar', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              actividad_evaluativa_id: actividad.id,
              calificaciones,
            }),
          });
          if (res.status === 401) { logout(); return; }
        }
      }

      alert('Calificaciones guardadas exitosamente');
      handleCargarPlanilla();
    } catch (err) {
      console.error(err);
      alert('Error al guardar calificaciones');
    } finally {
      setSaving(false);
    }
  };

  const handleCrearActividad = async () => {
    if (!selectedGrupo || !selectedPeriodo || !selectedAsignatura || !formData.nombre) {
      alert('Completa todos los campos');
      return;
    }
    if (!checkAuth()) return;

    setSaving(true);
    try {
      const token = getAuthToken();
      const res = await fetch('http://localhost:3005/api/v1/calificaciones/actividades', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          porcentaje_peso: formData.porcentaje_peso,
          tipo_actividad_id: formData.tipo_actividad_id || null,
          grupo_id: selectedGrupo,
          asignatura_id: selectedAsignatura,
          periodo_academico_id: selectedPeriodo,
          fecha: formData.fecha,
        }),
      });
      if (res.status === 401) { logout(); return; }

      setShowModal(false);
      setFormData({ nombre: '', porcentaje_peso: 10, tipo_actividad_id: '', fecha: new Date().toISOString().split('T')[0] });
      handleCargarPlanilla();
    } catch (err) {
      console.error(err);
      alert('Error al crear actividad');
    } finally {
      setSaving(false);
    }
  };

  const handleEliminarActividad = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta actividad?')) return;
    if (!checkAuth()) return;

    try {
      const token = getAuthToken();
      const res = await fetch(`http://localhost:3005/api/v1/calificaciones/actividades/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.status === 401) { logout(); return; }
      handleCargarPlanilla();
    } catch (err) {
      console.error(err);
      alert('Error al eliminar actividad');
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Planilla de Calificaciones</h1>
        <div className={styles.selectors}>
          <select value={selectedGrupo} onChange={(e) => setSelectedGrupo(e.target.value)}>
            <option value="">Seleccionar Grupo</option>
            {grupos.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
          </select>
          <select value={selectedAsignatura} onChange={(e) => setSelectedAsignatura(e.target.value)}>
            <option value="">Seleccionar Asignatura</option>
            {asignaturas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
          <select value={selectedPeriodo} onChange={(e) => setSelectedPeriodo(e.target.value)}>
            <option value="">Seleccionar Periodo</option>
            {periodos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
          <button onClick={handleCargarPlanilla} className={styles.loadBtn} disabled={loading}>
            {loading ? 'Cargando...' : 'Cargar Planilla'}
          </button>
          {planillaData && (
            <button onClick={() => setShowModal(true)} className={styles.addBtn}>
              + Nueva Actividad
            </button>
          )}
        </div>
      </header>

      {planillaData && planillaData.actividades && planillaData.actividades.length > 0 && (
        <>
          <div className={styles.actions}>
            <button onClick={handleGuardarNotas} className={styles.saveBtn} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar Calificaciones'}
            </button>
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Estudiante</th>
                  {planillaData.actividades.map(act => (
                    <th key={act.id} title={act.nombre}>
                      <div className={styles.activityHeader}>
                        <span>{act.nombre.substring(0, 12)}</span>
                        <small>{act.porcentaje_peso}%</small>
                        <button
                          className={styles.deleteActBtn}
                          onClick={() => handleEliminarActividad(act.id)}
                          title="Eliminar actividad"
                        >
                          ×
                        </button>
                      </div>
                    </th>
                  ))}
                  <th className={styles.finalCol}>Nota Final</th>
                </tr>
              </thead>
              <tbody>
                {planillaData.planilla.map(row => (
                  <tr key={row.estudiante.id}>
                    <td className={styles.studentName}>
                      {row.estudiante.primer_nombre} {row.estudiante.primer_apellido}
                    </td>
                    {row.notas.map((n: any, idx: number) => (
                      <td key={idx} className={styles.scoreCell}>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="5"
                          value={n.nota ?? ''}
                          onChange={(e) => handleNotaChange(row.estudiante.id, n.actividad_id, e.target.value)}
                          className={styles.scoreInput}
                        />
                      </td>
                    ))}
                    <td className={`${styles.finalScore} ${(row.nota_final ?? 0) >= 3 ? styles.pass : styles.fail}`}>
                      {row.nota_final || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {planillaData && planillaData.actividades && planillaData.actividades.length === 0 && (
        <div className={styles.emptyState}>
          <p>No hay actividades evaluativas para este grupo, asignatura y período.</p>
          <button onClick={() => setShowModal(true)} className={styles.addBtn}>
            + Crear Primera Actividad
          </button>
        </div>
      )}

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>Nueva Actividad Evaluativa</h2>
            <div className={styles.formGroup}>
              <label>Nombre de la actividad</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Parcial 1, Taller, Quiz..."
              />
            </div>
            <div className={styles.formGroup}>
              <label>Porcentaje (%)</label>
              <input
                type="number"
                value={formData.porcentaje_peso}
                onChange={(e) => setFormData({ ...formData, porcentaje_peso: parseFloat(e.target.value) })}
                min="1"
                max="100"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Tipo de actividad</label>
              <select
                value={formData.tipo_actividad_id}
                onChange={(e) => setFormData({ ...formData, tipo_actividad_id: e.target.value })}
              >
                <option value="">Seleccionar tipo</option>
                {tiposActividad.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Fecha</label>
              <input
                type="date"
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
              />
            </div>
            <div className={styles.modalActions}>
              <button onClick={() => setShowModal(false)} className={styles.cancelBtn}>Cancelar</button>
              <button onClick={handleCrearActividad} className={styles.confirmBtn} disabled={saving}>
                {saving ? 'Creando...' : 'Crear Actividad'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
