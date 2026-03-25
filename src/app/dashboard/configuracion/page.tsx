'use client';

import { useEffect, useState } from 'react';
import { getAuthToken } from '@/utils/auth';

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

interface Nivel {
  id: string;
  nombre: string;
  grado?: any[];
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

const API = 'http://localhost:3005/api/v1';

export default function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState('institucion');
  const [loading, setLoading] = useState(false);

  // Datos
  const [institucion, setInstitucion] = useState<Institucion | null>(null);
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [grados, setGrados] = useState<Grado[]>([]);
  const [tiposActividad, setTiposActividad] = useState<TipoActividad[]>([]);

  // Forms
  const [formInstitucion, setFormInstitucion] = useState<Institucion>({
    nombre: '', nit: '', direccion: '', telefono: '', correo_electronico: '', jornadas: ['Mañana']
  });
  const [formNivel, setFormNivel] = useState({ nombre: '' });
  const [formGrado, setFormGrado] = useState({ nombre: '', codigo: '', orden: 1, nivel_id: '' });
  const [formTipoActividad, setFormTipoActividad] = useState({ nombre: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const [resInst, resNiveles, resGrados, resTipos] = await Promise.all([
        fetch(`${API}/configuracion/institucion`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/configuracion/niveles`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/configuracion/grados`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/configuracion/tipos-actividad`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const instData = await resInst.json();
      const nivelesData = await resNiveles.json();
      const gradosData = await resGrados.json();
      const tiposData = await resTipos.json();

      if (instData) setInstitucion(instData);
      setNiveles(nivelesData || []);
      setGrados(gradosData || []);
      setTiposActividad(tiposData || []);
    } catch (err) {
      console.error('Error cargando datos:', err);
    }
  };

  const handleSaveInstitucion = async () => {
    setLoading(true);
    const token = getAuthToken();
    try {
      if (institucion?.id) {
        await fetch(`${API}/configuracion/institucion/${institucion.id}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(formInstitucion)
        });
      } else {
        await fetch(`${API}/configuracion/institucion`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(formInstitucion)
        });
      }
      loadData();
      alert('Institución guardada');
    } catch (err) { alert('Error guardando'); }
    setLoading(false);
  };

  const handleSaveNivel = async () => {
    if (!formNivel.nombre) return;
    setLoading(true);
    const token = getAuthToken();
    try {
      await fetch(`${API}/configuracion/niveles`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(formNivel)
      });
      setFormNivel({ nombre: '' });
      loadData();
    } catch (err) { alert('Error guardando'); }
    setLoading(false);
  };

  const handleSaveGrado = async () => {
    if (!formGrado.nombre || !formGrado.nivel_id) return;
    setLoading(true);
    const token = getAuthToken();
    try {
      await fetch(`${API}/configuracion/grados`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(formGrado)
      });
      setFormGrado({ nombre: '', codigo: '', orden: 1, nivel_id: '' });
      loadData();
    } catch (err) { alert('Error guardando'); }
    setLoading(false);
  };

  const handleDeleteGrado = async (id: string) => {
    if (!confirm('¿Eliminar grado?')) return;
    const token = getAuthToken();
    await fetch(`${API}/configuracion/grados/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    loadData();
  };

  const handleSaveTipoActividad = async () => {
    if (!formTipoActividad.nombre) return;
    setLoading(true);
    const token = getAuthToken();
    try {
      await fetch(`${API}/configuracion/tipos-actividad`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(formTipoActividad)
      });
      setFormTipoActividad({ nombre: '' });
      loadData();
    } catch (err) { alert('Error guardando'); }
    setLoading(false);
  };

  const handleDeleteTipoActividad = async (id: string) => {
    if (!confirm('¿Eliminar tipo de actividad?')) return;
    const token = getAuthToken();
    await fetch(`${API}/configuracion/tipos-actividad/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    loadData();
  };

  const tabs = [
    { id: 'institucion', label: 'Institución' },
    { id: 'niveles', label: 'Niveles' },
    { id: 'grados', label: 'Grados' },
    { id: 'tipos-actividad', label: 'Tipos de Actividad' }
  ];

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ marginBottom: '20px' }}>Configuración del Sistema</h1>

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

      {activeTab === 'institucion' && (
        <div style={{ maxWidth: '600px' }}>
          <h3>Datos de la Institución</h3>
          <div style={{ display: 'grid', gap: '15px' }}>
            <input placeholder="Nombre*" value={formInstitucion.nombre} onChange={e => setFormInstitucion({...formInstitucion, nombre: e.target.value})} style={{ padding: '8px', width: '100%' }} />
            <input placeholder="NIT*" value={formInstitucion.nit} onChange={e => setFormInstitucion({...formInstitucion, nit: e.target.value})} style={{ padding: '8px', width: '100%' }} />
            <input placeholder="Dirección" value={formInstitucion.direccion} onChange={e => setFormInstitucion({...formInstitucion, direccion: e.target.value})} style={{ padding: '8px', width: '100%' }} />
            <input placeholder="Teléfono" value={formInstitucion.telefono} onChange={e => setFormInstitucion({...formInstitucion, telefono: e.target.value})} style={{ padding: '8px', width: '100%' }} />
            <input placeholder="Correo" value={formInstitucion.correo_electronico} onChange={e => setFormInstitucion({...formInstitucion, correo_electronico: e.target.value})} style={{ padding: '8px', width: '100%' }} />
            <input placeholder="Rector" value={formInstitucion.rector} onChange={e => setFormInstitucion({...formInstitucion, rector: e.target.value})} style={{ padding: '8px', width: '100%' }} />
            <input placeholder="Código DANE" value={formInstitucion.dane} onChange={e => setFormInstitucion({...formInstitucion, dane: e.target.value})} style={{ padding: '8px', width: '100%' }} />
            <input placeholder="Resolución" value={formInstitucion.resolucion_aprobacion} onChange={e => setFormInstitucion({...formInstitucion, resolucion_aprobacion: e.target.value})} style={{ padding: '8px', width: '100%' }} />
            <button onClick={handleSaveInstitucion} disabled={loading} style={{ padding: '10px', background: '#22c55e', color: 'white', border: 'none', cursor: 'pointer' }}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'niveles' && (
        <div>
          <h3>Niveles Educativos</h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <input placeholder="Nombre del nivel" value={formNivel.nombre} onChange={e => setFormNivel({ nombre: e.target.value })} style={{ padding: '8px', flex: 1 }} />
            <button onClick={handleSaveNivel} disabled={loading} style={{ padding: '8px 20px', background: '#22c55e', color: 'white', border: 'none' }}>Agregar</button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                <th style={{ padding: '10px', textAlign: 'left' }}>Nombre</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Grados</th>
              </tr>
            </thead>
            <tbody>
              {niveles.map(nivel => (
                <tr key={nivel.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '10px' }}>{nivel.nombre}</td>
                  <td style={{ padding: '10px' }}>{nivel.grado?.length || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'grados' && (
        <div>
          <h3>Grados</h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <input placeholder="Nombre" value={formGrado.nombre} onChange={e => setFormGrado({...formGrado, nombre: e.target.value})} style={{ padding: '8px' }} />
            <input placeholder="Código" value={formGrado.codigo} onChange={e => setFormGrado({...formGrado, codigo: e.target.value})} style={{ padding: '8px' }} />
            <input type="number" placeholder="Orden" value={formGrado.orden} onChange={e => setFormGrado({...formGrado, orden: parseInt(e.target.value)})} style={{ padding: '8px', width: '80px' }} />
            <select value={formGrado.nivel_id} onChange={e => setFormGrado({...formGrado, nivel_id: e.target.value})} style={{ padding: '8px' }}>
              <option value="">Seleccionar nivel</option>
              {niveles.map(n => <option key={n.id} value={n.id}>{n.nombre}</option>)}
            </select>
            <button onClick={handleSaveGrado} disabled={loading} style={{ padding: '8px 20px', background: '#22c55e', color: 'white', border: 'none' }}>Agregar</button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                <th style={{ padding: '10px', textAlign: 'left' }}>Nombre</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Código</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Nivel</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Orden</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {grados.map(grado => (
                <tr key={grado.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '10px' }}>{grado.nombre}</td>
                  <td style={{ padding: '10px' }}>{grado.codigo}</td>
                  <td style={{ padding: '10px' }}>{grado.nivel?.nombre}</td>
                  <td style={{ padding: '10px' }}>{grado.orden}</td>
                  <td style={{ padding: '10px' }}>
                    <button onClick={() => handleDeleteGrado(grado.id)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer' }}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'tipos-actividad' && (
        <div>
          <h3>Tipos de Actividad Evaluativa</h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <input placeholder="Nombre del tipo" value={formTipoActividad.nombre} onChange={e => setFormTipoActividad({ nombre: e.target.value })} style={{ padding: '8px', flex: 1 }} />
            <button onClick={handleSaveTipoActividad} disabled={loading} style={{ padding: '8px 20px', background: '#22c55e', color: 'white', border: 'none' }}>Agregar</button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                <th style={{ padding: '10px', textAlign: 'left' }}>Nombre</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tiposActividad.map(tipo => (
                <tr key={tipo.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '10px' }}>{tipo.nombre}</td>
                  <td style={{ padding: '10px' }}>
                    <button onClick={() => handleDeleteTipoActividad(tipo.id)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer' }}>Eliminar</button>
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