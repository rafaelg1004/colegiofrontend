'use client';

import { useEffect, useState } from 'react';
import { getAuthToken } from '@/utils/auth';

interface Actividad {
  id: string;
  nombre: string;
  descripcion?: string;
  porcentaje_peso?: number;
  fecha?: string;
  tipo_actividad?: { nombre: string };
  asignatura?: { nombre: string; area?: { nombre: string } };
  grupo?: { nombre: string };
  periodo?: { nombre: string; numero: number };
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
  estudiante?: { primer_nombre: string; primer_apellido: string; numero_documento: string };
  asignatura?: { nombre: string };
  periodo?: { nombre: string; numero: number };
}

const API = 'http://localhost:3005/api/v1';

export default function EvaluacionPage() {
  const [activeTab, setActiveTab] = useState('actividades');
  const [loading, setLoading] = useState(false);

  // Datos
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [bloques, setBloques] = useState<BloqueHorario[]>([]);
  const [notasPeriodo, setNotasPeriodo] = useState<NotaPeriodo[]>([]);

  // Filtros
  const [grupoFiltro, setGrupoFiltro] = useState('');
  const [periodoFiltro, setPeriodoFiltro] = useState('');
  const [estudianteFiltro, setEstudianteFiltro] = useState('');

  useEffect(() => {
    loadActividades();
    loadBloques();
    loadNotasPeriodo();
  }, []);

  const loadActividades = async () => {
    const token = getAuthToken();
    const params = new URLSearchParams();
    if (grupoFiltro) params.append('grupo_id', grupoFiltro);
    if (periodoFiltro) params.append('periodo_id', periodoFiltro);

    const res = await fetch(`${API}/evaluacion/actividades?${params}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setActividades(Array.isArray(data) ? data : []);
  };

  const loadBloques = async () => {
    const token = getAuthToken();
    const res = await fetch(`${API}/evaluacion/bloques-horarios`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setBloques(Array.isArray(data) ? data : []);
  };

  const loadNotasPeriodo = async () => {
    const token = getAuthToken();
    const params = new URLSearchParams();
    if (estudianteFiltro) params.append('estudiante_id', estudianteFiltro);

    const res = await fetch(`${API}/evaluacion/notas-periodo?${params}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setNotasPeriodo(Array.isArray(data) ? data : []);
  };

  const handleDeleteActividad = async (id: string) => {
    if (!confirm('¿Eliminar actividad?')) return;
    const token = getAuthToken();
    await fetch(`${API}/evaluacion/actividades/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    loadActividades();
  };

  const handleDeleteBloque = async (id: string) => {
    if (!confirm('¿Eliminar bloque?')) return;
    const token = getAuthToken();
    await fetch(`${API}/evaluacion/bloques-horarios/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    loadBloques();
  };

  const handleDeleteNota = async (id: string) => {
    if (!confirm('¿Eliminar nota?')) return;
    const token = getAuthToken();
    await fetch(`${API}/evaluacion/notas-periodo/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    loadNotasPeriodo();
  };

  const tabs = [
    { id: 'actividades', label: 'Actividades Evaluativas' },
    { id: 'bloques', label: 'Bloques Horarios' },
    { id: 'notas', label: 'Notas por Período' }
  ];

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ marginBottom: '20px' }}>Evaluación Académica</h1>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #ccc' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: activeTab === tab.id ? '#3b82f6' : '#e5e7eb',
              color: activeTab === tab.id ? 'white' : 'black',
              cursor: 'pointer',
              borderRadius: '4px 4px 0 0'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'actividades' && (
        <div>
          <h3>Actividades Evaluativas</h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <input placeholder="Buscar actividad..." style={{ padding: '8px', flex: 1 }} />
            <button onClick={loadActividades} style={{ padding: '8px 20px', background: '#3b82f6', color: 'white', border: 'none' }}>Buscar</button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                <th style={{ padding: '10px', textAlign: 'left' }}>Nombre</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Tipo</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Asignatura</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Grupo</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Peso %</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Fecha</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {actividades.map(act => (
                <tr key={act.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '10px' }}>{act.nombre}</td>
                  <td style={{ padding: '10px' }}>{act.tipo_actividad?.nombre}</td>
                  <td style={{ padding: '10px' }}>{act.asignatura?.nombre}</td>
                  <td style={{ padding: '10px' }}>{act.grupo?.nombre}</td>
                  <td style={{ padding: '10px' }}>{act.porcentaje_peso}%</td>
                  <td style={{ padding: '10px' }}>{act.fecha?.split('T')[0]}</td>
                  <td style={{ padding: '10px' }}>
                    <button onClick={() => handleDeleteActividad(act.id)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer' }}>Eliminar</button>
                  </td>
                </tr>
              ))}
              {actividades.length === 0 && (
                <tr><td colSpan={7} style={{ padding: '20px', textAlign: 'center' }}>No hay actividades</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'bloques' && (
        <div>
          <h3>Horario de Clases</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                <th style={{ padding: '10px', textAlign: 'left' }}>Día</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Hora Inicio</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Hora Fin</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Aula</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Docente</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Asignatura</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Grupo</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {bloques.map(bloque => (
                <tr key={bloque.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '10px' }}>{bloque.dia_semana}</td>
                  <td style={{ padding: '10px' }}>{bloque.hora_inicio?.slice(0,5)}</td>
                  <td style={{ padding: '10px' }}>{bloque.hora_fin?.slice(0,5)}</td>
                  <td style={{ padding: '10px' }}>{bloque.aula || '-'}</td>
                  <td style={{ padding: '10px' }}>{bloque.asignacion?.docente ? `${bloque.asignacion.docente.primer_nombre} ${bloque.asignacion.docente.primer_apellido}` : '-'}</td>
                  <td style={{ padding: '10px' }}>{bloque.asignacion?.asignatura?.nombre || '-'}</td>
                  <td style={{ padding: '10px' }}>{bloque.asignacion?.grupo?.nombre || '-'}</td>
                  <td style={{ padding: '10px' }}>
                    <button onClick={() => handleDeleteBloque(bloque.id)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer' }}>Eliminar</button>
                  </td>
                </tr>
              ))}
              {bloques.length === 0 && (
                <tr><td colSpan={8} style={{ padding: '20px', textAlign: 'center' }}>No hay bloques horarios</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'notas' && (
        <div>
          <h3>Notas por Período</h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <input
              placeholder="Buscar estudiante..."
              value={estudianteFiltro}
              onChange={e => setEstudianteFiltro(e.target.value)}
              style={{ padding: '8px', flex: 1 }}
            />
            <button onClick={loadNotasPeriodo} style={{ padding: '8px 20px', background: '#3b82f6', color: 'white', border: 'none' }}>Buscar</button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                <th style={{ padding: '10px', textAlign: 'left' }}>Estudiante</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Documento</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Asignatura</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Período</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Nota</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Desempeño</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {notasPeriodo.map(nota => (
                <tr key={nota.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '10px' }}>{nota.estudiante?.primer_nombre} {nota.estudiante?.primer_apellido}</td>
                  <td style={{ padding: '10px' }}>{nota.estudiante?.numero_documento}</td>
                  <td style={{ padding: '10px' }}>{nota.asignatura?.nombre}</td>
                  <td style={{ padding: '10px' }}>{nota.periodo?.nombre}</td>
                  <td style={{ padding: '10px' }}>{nota.nota_final?.toFixed(1)}</td>
                  <td style={{ padding: '10px' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '10px',
                      background: nota.desempeno === 'Superior' ? '#22c55e' : nota.desempeno === 'Alto' ? '#3b82f6' : nota.desempeno === 'Básico' ? '#f59e0b' : '#ef4444',
                      color: 'white',
                      fontSize: '12px'
                    }}>
                      {nota.desempeno}
                    </span>
                  </td>
                  <td style={{ padding: '10px' }}>
                    <button onClick={() => handleDeleteNota(nota.id)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer' }}>Eliminar</button>
                  </td>
                </tr>
              ))}
              {notasPeriodo.length === 0 && (
                <tr><td colSpan={7} style={{ padding: '20px', textAlign: 'center' }}>No hay notas</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}