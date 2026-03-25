'use client';

import { useEffect, useState, useCallback } from 'react';
import { getAuthToken } from '@/utils/auth';
import styles from './MatriculasList.module.css';

interface Matricula {
  id: string;
  estado: string;
  fecha_matricula?: string;
  observaciones?: string;
  created_at: string;
  estudiante: {
    id: string;
    primer_nombre: string;
    primer_apellido: string;
    numero_documento: string;
  };
  grupo: {
    id: string;
    nombre: string;
    grado: {
      nombre: string;
      nivel?: { nombre: string };
    };
  };
  anio_lectivo: {
    id: string;
    anio: number;
    activo: boolean;
  };
}

interface AnioLectivo {
  id: string;
  anio: number;
  activo: boolean;
}

interface Grupo {
  id: string;
  nombre: string;
  grado: { nombre: string; nivel: { nombre: string } };
}

interface Estudiante {
  id: string;
  primer_nombre: string;
  primer_apellido: string;
  numero_documento: string;
}

export const MatriculasList = () => {
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtros
  const [aniosLectivos, setAniosLectivos] = useState<AnioLectivo[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [anioFiltro, setAnioFiltro] = useState('');
  const [grupoFiltro, setGrupoFiltro] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [saving, setSaving] = useState(false);
  const [selectedMatricula, setSelectedMatricula] = useState<Matricula | null>(null);

  // Form para crear
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [searchEstudiante, setSearchEstudiante] = useState('');
  const [formData, setFormData] = useState({
    estudiante_id: '',
    grupo_id: '',
    anio_lectivo_id: '',
    observaciones: '',
    estado: 'Activa'
  });

  // Cargar datos iniciales
  useEffect(() => {
    const fetchInitialData = async () => {
      const token = getAuthToken();
      if (!token) return;

      try {
        // Cargar años lectivos
        const resAnios = await fetch('http://localhost:3005/api/v1/academico/anios-lectivos', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resAnios.ok) {
          const anios = await resAnios.json();
          setAniosLectivos(Array.isArray(anios) ? anios : []);
          const activo = anios.find((a: AnioLectivo) => a.activo);
          if (activo) setAnioFiltro(activo.id);
        }

        // Cargar grupos
        const resGrupos = await fetch('http://localhost:3005/api/v1/grupos', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resGrupos.ok) {
          const data = await resGrupos.json();
          setGrupos(Array.isArray(data) ? data : data.data || []);
        }
      } catch (err) {
        console.error('Error cargando datos iniciales:', err);
      }
    };
    fetchInitialData();
  }, []);

  const fetchMatriculas = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const token = getAuthToken();
      if (!token) return;

      const params = new URLSearchParams();
      if (anioFiltro) params.append('anio_lectivo_id', anioFiltro);
      if (grupoFiltro) params.append('grupo_id', grupoFiltro);

      const response = await fetch(`http://localhost:3005/api/v1/matriculas?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Error al cargar matrículas');

      const data = await response.json();
      setMatriculas(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message);
      setMatriculas([]);
    } finally {
      setLoading(false);
    }
  }, [anioFiltro, grupoFiltro]);

  useEffect(() => {
    if (anioFiltro) {
      fetchMatriculas();
    }
  }, [fetchMatriculas, anioFiltro]);

  // Buscar estudiantes
  useEffect(() => {
    const searchStudents = async () => {
      if (searchEstudiante.length < 2) {
        setEstudiantes([]);
        return;
      }

      const token = getAuthToken();
      const res = await fetch(`http://localhost:3005/api/v1/estudiantes?buscar=${searchEstudiante}&limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const result = await res.json();
        setEstudiantes(result.data || []);
      }
    };

    const timer = setTimeout(searchStudents, 300);
    return () => clearTimeout(timer);
  }, [searchEstudiante]);

  const openCreate = () => {
    const anioActivo = aniosLectivos.find(a => a.activo);
    setFormData({
      estudiante_id: '',
      grupo_id: '',
      anio_lectivo_id: anioActivo?.id || '',
      observaciones: '',
      estado: 'Activa'
    });
    setSearchEstudiante('');
    setEstudiantes([]);
    setModalMode('create');
    setShowModal(true);
  };

  const openEdit = (mat: Matricula) => {
    setSelectedMatricula(mat);
    setFormData({
      estudiante_id: mat.estudiante.id,
      grupo_id: mat.grupo.id,
      anio_lectivo_id: mat.anio_lectivo.id,
      observaciones: mat.observaciones || '',
      estado: mat.estado
    });
    setModalMode('edit');
    setShowModal(true);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const token = getAuthToken();

      if (modalMode === 'create') {
        const res = await fetch('http://localhost:3005/api/v1/matriculas', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            estudiante_id: formData.estudiante_id,
            grupo_id: formData.grupo_id,
            anio_lectivo_id: formData.anio_lectivo_id,
            observaciones: formData.observaciones || undefined
          })
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || 'Error al crear matrícula');
        }
      } else {
        const res = await fetch(`http://localhost:3005/api/v1/matriculas/${selectedMatricula?.id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            grupo_id: formData.grupo_id,
            estado: formData.estado,
            observaciones: formData.observaciones || undefined
          })
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || 'Error al actualizar matrícula');
        }
      }

      setShowModal(false);
      fetchMatriculas();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const selectEstudiante = (est: Estudiante) => {
    setFormData({ ...formData, estudiante_id: est.id });
    setSearchEstudiante(`${est.primer_nombre} ${est.primer_apellido} - ${est.numero_documento}`);
    setEstudiantes([]);
  };

  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleSection}>
          <h1>Control de Matrículas</h1>
          <p>Estado de inscripciones y cupos por grupo ({matriculas.length} registros)</p>
        </div>
        <div className={styles.actions}>
          <button className={styles.addBtn} onClick={openCreate}>+ Nueva Matrícula</button>
        </div>
      </header>

      <div className={styles.filters}>
        <select
          value={anioFiltro}
          onChange={(e) => setAnioFiltro(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">Seleccionar año...</option>
          {aniosLectivos.map(a => (
            <option key={a.id} value={a.id}>{a.anio} {a.activo ? '(Activo)' : ''}</option>
          ))}
        </select>

        <select
          value={grupoFiltro}
          onChange={(e) => setGrupoFiltro(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">Todos los grupos</option>
          {grupos.map(g => (
            <option key={g.id} value={g.id}>
              {g.grado?.nivel?.nombre} {g.grado?.nombre} - {g.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.tableContainer}>
        {loading ? (
          <div className={styles.loading}>Cargando registros...</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Documento</th>
                <th>Grupo / Grado</th>
                <th>Año</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {matriculas.length > 0 ? (
                matriculas.map((mat) => (
                  <tr key={mat.id}>
                    <td className={styles.nameCell}>
                      {mat.estudiante?.primer_nombre} {mat.estudiante?.primer_apellido}
                    </td>
                    <td>{mat.estudiante?.numero_documento}</td>
                    <td>
                      {mat.grupo?.grado?.nivel?.nombre} {mat.grupo?.grado?.nombre} - {mat.grupo?.nombre}
                    </td>
                    <td>{mat.anio_lectivo?.anio}</td>
                    <td>
                      <span className={`${styles.badge} ${styles[mat.estado?.toLowerCase() || 'activa']}`}>
                        {mat.estado}
                      </span>
                    </td>
                    <td className={styles.actionsCell}>
                      <button className={styles.editBtn} onClick={() => openEdit(mat)}>Editar</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className={styles.noData}>No hay registros de matrícula</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{modalMode === 'create' ? 'Nueva Matrícula' : 'Editar Matrícula'}</h2>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>×</button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.formGrid}>
                {modalMode === 'create' ? (
                  <>
                    <div className={styles.formGroup}>
                      <label>Buscar Estudiante *</label>
                      <input
                        type="text"
                        placeholder="Nombre o documento..."
                        value={searchEstudiante}
                        onChange={(e) => setSearchEstudiante(e.target.value)}
                      />
                      {estudiantes.length > 0 && (
                        <div className={styles.dropdown}>
                          {estudiantes.map(est => (
                            <div
                              key={est.id}
                              className={styles.dropdownItem}
                              onClick={() => selectEstudiante(est)}
                            >
                              {est.primer_nombre} {est.primer_apellido} - {est.numero_documento}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label>Año Lectivo *</label>
                      <select
                        value={formData.anio_lectivo_id}
                        onChange={(e) => setFormData({ ...formData, anio_lectivo_id: e.target.value })}
                        required
                      >
                        <option value="">Seleccionar...</option>
                        {aniosLectivos.map(a => (
                          <option key={a.id} value={a.id}>{a.anio} {a.activo ? '(Activo)' : ''}</option>
                        ))}
                      </select>
                    </div>
                  </>
                ) : (
                  <div className={styles.formGroup}>
                    <label>Estudiante</label>
                    <input
                      value={`${selectedMatricula?.estudiante.primer_nombre} ${selectedMatricula?.estudiante.primer_apellido}`}
                      disabled
                    />
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label>Grupo *</label>
                  <select
                    value={formData.grupo_id}
                    onChange={(e) => setFormData({ ...formData, grupo_id: e.target.value })}
                    required
                  >
                    <option value="">Seleccionar grupo...</option>
                    {grupos.map(g => (
                      <option key={g.id} value={g.id}>
                        {g.grado?.nivel?.nombre} {g.grado?.nombre} - {g.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {modalMode === 'edit' && (
                  <div className={styles.formGroup}>
                    <label>Estado</label>
                    <select
                      value={formData.estado}
                      onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    >
                      <option value="Activa">Activa</option>
                      <option value="Cancelada">Cancelada</option>
                      <option value="Pendiente">Pendiente</option>
                    </select>
                  </div>
                )}

                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                  <label>Observaciones</label>
                  <input
                    value={formData.observaciones}
                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                    placeholder="Notas adicionales..."
                  />
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancelar</button>
              <button
                className={styles.saveBtn}
                onClick={handleSubmit}
                disabled={saving || (modalMode === 'create' && (!formData.estudiante_id || !formData.grupo_id || !formData.anio_lectivo_id))}
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
