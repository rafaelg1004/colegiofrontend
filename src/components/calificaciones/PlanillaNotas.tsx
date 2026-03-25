'use client';

import React, { useEffect, useState } from 'react';
import { getAuthToken } from '@/utils/auth';
import styles from './PlanillaNotas.module.css';

interface PlanillaData {
  actividades: any[];
  planilla: any[];
}

export const PlanillaNotas = () => {
  const [grupos, setGrupos] = useState<any[]>([]);
  const [periodos, setPeriodos] = useState<any[]>([]);
  const [asignaturas, setAsignaturas] = useState<any[]>([]);
  
  const [selectedGrupo, setSelectedGrupo] = useState('');
  const [selectedPeriodo, setSelectedPeriodo] = useState('');
  const [selectedAsignatura, setSelectedAsignatura] = useState('');
  
  const [planillaData, setPlanillaData] = useState<PlanillaData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const token = getAuthToken();
      if (!token) {
        console.warn('No hay token de autenticación');
        return;
      }
      // En un caso real, obtendríamos estos de los endpoints respectivos
      const resGrupos = await fetch('http://localhost:3005/api/v1/grupos', { headers: { 'Authorization': `Bearer ${token}` } });
      const dataGrupos = await resGrupos.json();
      setGrupos(Array.isArray(dataGrupos) ? dataGrupos : dataGrupos.data || []);

      // Mock de periodos y asignaturas por ahora o fetch si existen
      const resAnios = await fetch('http://localhost:3005/api/v1/academico/anios-lectivos', { headers: { 'Authorization': `Bearer ${token}` } });
      const anios = await resAnios.json();
      if (anios && anios.length > 0) {
        const resPeriodos = await fetch(`http://localhost:3005/api/v1/academico/periodos?anio_lectivo_id=${anios[0].id}`, { headers: { 'Authorization': `Bearer ${token}` } });
        const periodosData = await resPeriodos.json();
        setPeriodos(Array.isArray(periodosData) ? periodosData : []);
      }

      const resAreas = await fetch('http://localhost:3005/api/v1/academico/areas', { headers: { 'Authorization': `Bearer ${token}` } });
      const areas = await resAreas.json();
      const allAsig = Array.isArray(areas) ? areas.flatMap((a: any) => a.asignatura || []) : [];
      setAsignaturas(allAsig);
    };
    fetchData();
  }, []);

  const handleCargarPlanilla = async () => {
    if (!selectedGrupo || !selectedPeriodo || !selectedAsignatura) return;
    
    setLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`http://localhost:3005/api/v1/calificaciones/planilla?grupo_id=${selectedGrupo}&asignatura_id=${selectedAsignatura}&periodo_id=${selectedPeriodo}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setPlanillaData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
        </div>
      </header>

      {planillaData && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Estudiante</th>
                {planillaData.actividades.map(act => (
                  <th key={act.id} title={act.nombre}>
                    {act.nombre.substring(0, 10)}...
                    <small>{act.porcentaje_peso}%</small>
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
                        defaultValue={n.nota || ''} 
                        className={styles.scoreInput}
                      />
                    </td>
                  ))}
                  <td className={`${styles.finalScore} ${row.nota_final >= 3 ? styles.pass : styles.fail}`}>
                    {row.nota_final || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
