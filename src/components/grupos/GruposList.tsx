'use client';

import { useEffect, useState, useCallback } from 'react';
import { getAuthToken } from '@/utils/auth';
import styles from './GruposList.module.css';

interface Grado {
  nombre: string;
  orden: number;
  nivel: { nombre: string };
}

interface AnioLectivo {
  id: string;
  anio: number;
  activo: boolean;
}

interface Grupo {
  id: string;
  nombre: string;
  jornada: string;
  cupo_maximo: number;
  grado_id: string;
  anio_lectivo_id: string;
  sede_id?: string;
  grado: Grado;
  anio_lectivo: { anio: number; activo: boolean };
  sede?: { nombre: string };
}

interface Estudiante {
  id: string;
  estudiante: {
    id: string;
    primer_nombre: string;
    primer_apellido: string;
    numero_documento: string;
    genero?: string;
  };
}

interface GradoOption {
  id: string;
  nombre: string;
  nivel_id: string;
}

export const GruposList = () => {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [anios, setAnios] = useState<AnioLectivo[]>([]);
  const [grados, setGrados] = useState<GradoOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [anioFiltro, setAnioFiltro] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showEstudiantes, setShowEstudiantes] = useState(false);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<Grupo | null>(null);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<any>({});

  const fetchAnios = useCallback(async () => {
    const token = getAuthToken();
    const res = await fetch('http://localhost:3005/api/v1/academico/anios-lectivos', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setAnios(data || []);
      const activo = data.find((a: AnioLectivo) => a.activo);
      if (activo && !anioFiltro) setAnioFiltro(activo.id);
    }
  }, [anioFiltro]);

  const fetchGrados = useCallback(async () => {
    const token = getAuthToken();
    const res = await fetch('http://localhost:3005/api/v1/grupos/grados', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setGrados(data || []);
    }
  }, []);

  const fetchGrupos = useCallback(async () => {
    if (!anioFiltro) return;
    setLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`http://localhost:3005/api/v1/grupos?anio_lectivo_id=${anioFiltro}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setGrupos(Array.isArray(data) ? data : []);
      }
    } finally {
      setLoading(false);
    }
  }, [anioFiltro]);

  useEffect(() => {
    fetchAnios();
    fetchGrados();
  }, [fetchAnios, fetchGrados]);

  useEffect(() => {
    fetchGrupos();
  }, [fetchGrupos]);

  const fetchEstudiantes = async (grupo: Grupo) => {
    setGrupoSeleccionado(grupo);
    const token = getAuthToken();
    const res = await fetch(`http://localhost:3005/api/v1/grupos/${grupo.id}/estudiantes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setEstudiantes(data || []);
    }
    setShowEstudiantes(true);
  };

  const openModal = () => {
    setFormData({
      nombre: '',
      jornada: 'Manana',
      cupo_maximo: 35,
      grado_id: grados[0]?.id || '',
      anio_lectivo_id: anioFiltro
    });
    setShowModal(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'number' ? parseInt(e.target.value) : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const token = getAuthToken();
      const res = await fetch('http://localhost:3005/api/v1/grupos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Error al crear grupo');
      }

      setShowModal(false);
      fetchGrupos();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const gruposPorNivel = grupos.reduce((acc, grupo) => {
    const nivel = grupo.grado?.nivel?.nombre || 'Sin nivel';
    if (!acc[nivel]) acc[nivel] = [];
    acc[nivel].push(grupo);
    return acc;
  }, {} as Record<string, Grupo[]>);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleSection}>
          <h1>Grupos</h1>
          <p>Gestion de grupos por ano lectivo</p>
        </div>
        <button className={styles.addBtn} onClick={openModal}>
          + Nuevo Grupo
        </button>
      </header>

      <div className={styles.filters}>
        <select
          value={anioFiltro}
          onChange={(e) => setAnioFiltro(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">Seleccionar ano...</option>
          {anios.map(a => (
            <option key={a.id} value={a.id}>
              {a.anio} {a.activo ? '(Activo)' : ''}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className={styles.loading}>Cargando grupos...</div>
      ) : (
        <div className={styles.nivelesContainer}>
          {Object.entries(gruposPorNivel).map(([nivel, gruposNivel]) => (
            <div key={nivel} className={styles.nivelSection}>
              <h2 className={styles.nivelTitle}>{nivel}</h2>
              <div className={styles.gruposGrid}>
                {gruposNivel.sort((a, b) => a.grado.orden - b.grado.orden).map(grupo => (
                  <div key={grupo.id} className={styles.grupoCard} onClick={() => fetchEstudiantes(grupo)}>
                    <div className={styles.grupoHeader}>
                      <span className={styles.gradoTag}>{grupo.grado.nombre}</span>
                      <span className={styles.jornadaTag}>{grupo.jornada}</span>
                    </div>
                    <h3 className={styles.grupoNombre}>{grupo.nombre}</h3>
                    <div className={styles.grupoInfo}>
                      <div className={styles.infoItem}>
                        <span className={styles.label}>Cupo:</span>
                        <span>{grupo.cupo_maximo}</span>
                      </div>
                      {grupo.sede && (
                        <div className={styles.infoItem}>
                          <span className={styles.label}>Sede:</span>
                          <span>{grupo.sede.nombre}</span>
                        </div>
                      )}
                    </div>
                    <div className={styles.verEstudiantes}>
                      Ver estudiantes
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {Object.keys(gruposPorNivel).length === 0 && (
            <div className={styles.empty}>No hay grupos para este ano lectivo</div>
          )}
        </div>
      )}

      {/* Modal Crear Grupo */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Nuevo Grupo</h2>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>x</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Nombre del Grupo *</label>
                  <input name="nombre" value={formData.nombre || ''} onChange={handleChange} placeholder="Ej: 1-A" required />
                </div>
                <div className={styles.formGroup}>
                  <label>Grado *</label>
                  <select name="grado_id" value={formData.grado_id || ''} onChange={handleChange} required>
                    <option value="">Seleccionar...</option>
                    {grados.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Jornada *</label>
                  <select name="jornada" value={formData.jornada || 'Manana'} onChange={handleChange}>
                    <option value="Manana">Manana</option>
                    <option value="Tarde">Tarde</option>
                    <option value="Completa">Completa</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Cupo Maximo</label>
                  <input type="number" name="cupo_maximo" value={formData.cupo_maximo || 35} onChange={handleChange} min="1" max="50" />
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancelar</button>
              <button className={styles.saveBtn} onClick={handleSubmit} disabled={saving}>
                {saving ? 'Guardando...' : 'Crear Grupo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Estudiantes */}
      {showEstudiantes && grupoSeleccionado && (
        <div className={styles.modalOverlay} onClick={() => setShowEstudiantes(false)}>
          <div className={styles.modalLarge} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Estudiantes de {grupoSeleccionado.grado.nombre} - {grupoSeleccionado.nombre}</h2>
              <button className={styles.closeBtn} onClick={() => setShowEstudiantes(false)}>x</button>
            </div>
            <div className={styles.modalBody}>
              {estudiantes.length > 0 ? (
                <div className={styles.estudiantesList}>
                  {estudiantes.map((est, idx) => (
                    <div key={est.id} className={styles.estudianteItem}>
                      <span className={styles.numero}>{idx + 1}</span>
                      <div className={styles.estudianteInfo}>
                        <span className={styles.estudianteNombre}>
                          {est.estudiante.primer_apellido}, {est.estudiante.primer_nombre}
                        </span>
                        <span className={styles.estudianteDoc}>{est.estudiante.numero_documento}</span>
                      </div>
                      <span className={`${styles.generoTag} ${est.estudiante.genero === 'M' ? styles.generoM : styles.generoF}`}>
                        {est.estudiante.genero || '-'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.empty}>No hay estudiantes matriculados en este grupo</div>
              )}
            </div>
            <div className={styles.modalFooter}>
              <span className={styles.totalEstudiantes}>Total: {estudiantes.length} estudiantes</span>
              <button className={styles.cancelBtn} onClick={() => setShowEstudiantes(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
