'use client';

import { useEffect, useState, useCallback } from 'react';
import { getAuthToken } from '@/utils/auth';
import styles from './EstudiantesList.module.css';

interface Estudiante {
  id: string;
  primer_nombre: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  tipo_documento: string;
  numero_documento: string;
  fecha_nacimiento?: string;
  lugar_nacimiento?: string;
  genero?: string;
  grupo_sanguineo?: string;
  direccion?: string;
  barrio?: string;
  municipio?: string;
  departamento?: string;
  eps?: string;
  alergias?: string;
  condicion_especial?: string;
  codigo_simat?: string;
  estado: string;
  matricula?: {
    id: string;
    grupo?: { nombre: string; grado?: { nombre: string; nivel?: { nombre: string } } };
    anio_lectivo?: { anio: number; activo: boolean };
  }[];
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

const initialForm: Partial<Estudiante> = {
  primer_nombre: '',
  segundo_nombre: '',
  primer_apellido: '',
  segundo_apellido: '',
  tipo_documento: 'TI',
  numero_documento: '',
  fecha_nacimiento: '',
  lugar_nacimiento: '',
  genero: '',
  grupo_sanguineo: '',
  direccion: '',
  barrio: '',
  municipio: '',
  departamento: '',
  eps: '',
  alergias: '',
  condicion_especial: '',
  codigo_simat: '',
};

const STEPS = [
  { id: 1, title: 'Datos Básicos' },
  { id: 2, title: 'Ubicación' },
  { id: 3, title: 'Salud' },
];

export const EstudiantesList = () => {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchDebounce, setSearchDebounce] = useState('');
  const [page, setPage] = useState(1);
  const [estadoFiltro, setEstadoFiltro] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [formData, setFormData] = useState<Partial<Estudiante>>(initialForm);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  // Debounce para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounce(searchTerm);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchEstudiantes = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const token = getAuthToken();

      if (!token) {
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      if (searchDebounce) params.append('buscar', searchDebounce);
      if (estadoFiltro) params.append('estado', estadoFiltro);
      params.append('page', page.toString());
      params.append('limit', '20');

      const response = await fetch(`http://localhost:3005/api/v1/estudiantes?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Error al cargar estudiantes');

      const result = await response.json();
      setEstudiantes(Array.isArray(result.data) ? result.data : []);
      setMeta(result.meta || null);
    } catch (err: any) {
      setError(err.message);
      setEstudiantes([]);
    } finally {
      setLoading(false);
    }
  }, [searchDebounce, estadoFiltro, page]);

  useEffect(() => {
    fetchEstudiantes();
  }, [fetchEstudiantes]);

  const getGrupoActual = (est: Estudiante) => {
    const matriculaActiva = est.matricula?.find(m => m.anio_lectivo?.activo);
    if (matriculaActiva?.grupo) {
      const g = matriculaActiva.grupo;
      return `${g.grado?.nivel?.nombre || ''} ${g.grado?.nombre || ''} - ${g.nombre}`.trim();
    }
    return 'Sin matrícula';
  };

  const openCreate = () => {
    setFormData(initialForm);
    setSelectedId(null);
    setModalMode('create');
    setCurrentStep(1);
    setShowModal(true);
  };

  const openEdit = async (id: string) => {
    try {
      const token = getAuthToken();
      const res = await fetch(`http://localhost:3005/api/v1/estudiantes/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Error al cargar estudiante');
      const data = await res.json();
      setFormData(data);
      setSelectedId(id);
      setModalMode('edit');
      setCurrentStep(1);
      setShowModal(true);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openView = async (id: string) => {
    try {
      const token = getAuthToken();
      const res = await fetch(`http://localhost:3005/api/v1/estudiantes/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Error al cargar estudiante');
      const data = await res.json();
      setFormData(data);
      setSelectedId(id);
      setModalMode('view');
      setCurrentStep(1);
      setShowModal(true);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);

    try {
      const token = getAuthToken();
      const url = modalMode === 'edit'
        ? `http://localhost:3005/api/v1/estudiantes/${selectedId}`
        : 'http://localhost:3005/api/v1/estudiantes';

      const res = await fetch(url, {
        method: modalMode === 'edit' ? 'PATCH' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Error al guardar');
      }

      setShowModal(false);
      fetchEstudiantes();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar al estudiante ${nombre}? Esta acción no se puede deshacer.`)) return;

    try {
      const token = getAuthToken();
      const res = await fetch(`http://localhost:3005/api/v1/estudiantes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Error al eliminar');
      }

      fetchEstudiantes();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const canProceed = () => {
    if (currentStep === 1) {
      return formData.primer_nombre && formData.primer_apellido &&
             formData.tipo_documento && formData.numero_documento && formData.fecha_nacimiento;
    }
    return true;
  };

  const isDisabled = modalMode === 'view';

  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleSection}>
          <h1>Gestión de Estudiantes</h1>
          <p>Listado general de alumnos {meta && `(${meta.total} registros)`}</p>
        </div>
        <div className={styles.actions}>
          <button className={styles.addBtn} onClick={openCreate}>+ Nuevo Estudiante</button>
        </div>
      </header>

      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Buscar por nombre o documento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={estadoFiltro}
          onChange={(e) => setEstadoFiltro(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">Todos los estados</option>
          <option value="Activo">Activo</option>
          <option value="Inactivo">Inactivo</option>
          <option value="Retirado">Retirado</option>
          <option value="Graduado">Graduado</option>
        </select>
      </div>

      <div className={styles.tableContainer}>
        {loading ? (
          <div className={styles.loading}>Cargando registros...</div>
        ) : (
          <>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nombre Completo</th>
                  <th>Documento</th>
                  <th>Grupo Actual</th>
                  <th>Género</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {estudiantes.length > 0 ? (
                  estudiantes.map((est) => (
                    <tr key={est.id}>
                      <td className={styles.nameCell}>
                        {est.primer_nombre} {est.segundo_nombre || ''} {est.primer_apellido} {est.segundo_apellido || ''}
                      </td>
                      <td>{est.tipo_documento}: {est.numero_documento}</td>
                      <td>{getGrupoActual(est)}</td>
                      <td>{est.genero === 'M' ? 'Masculino' : est.genero === 'F' ? 'Femenino' : est.genero || '-'}</td>
                      <td>
                        <span className={`${styles.badge} ${styles[est.estado?.toLowerCase() || 'activo']}`}>
                          {est.estado || 'Activo'}
                        </span>
                      </td>
                      <td className={styles.actionsCell}>
                        <button className={styles.viewBtn} onClick={() => openView(est.id)}>Ver</button>
                        <button className={styles.editBtn} onClick={() => openEdit(est.id)}>Editar</button>
                        <button
                          className={styles.deleteBtn}
                          onClick={() => handleDelete(est.id, `${est.primer_nombre} ${est.primer_apellido}`)}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className={styles.noData}>No se encontraron estudiantes</td>
                  </tr>
                )}
              </tbody>
            </table>

            {meta && meta.total_pages > 1 && (
              <div className={styles.pagination}>
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Anterior</button>
                <span>Página {page} de {meta.total_pages}</span>
                <button disabled={page >= meta.total_pages} onClick={() => setPage(p => p + 1)}>Siguiente</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal CRUD por pasos */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>
                {modalMode === 'create' && 'Nuevo Estudiante'}
                {modalMode === 'edit' && 'Editar Estudiante'}
                {modalMode === 'view' && 'Detalle del Estudiante'}
              </h2>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>×</button>
            </div>

            {/* Indicador de pasos */}
            <div className={styles.stepsIndicator}>
              {STEPS.map((step) => (
                <div
                  key={step.id}
                  className={`${styles.step} ${currentStep === step.id ? styles.stepActive : ''} ${currentStep > step.id ? styles.stepCompleted : ''}`}
                  onClick={() => setCurrentStep(step.id)}
                >
                  <span className={styles.stepNumber}>{step.id}</span>
                  <span className={styles.stepTitle}>{step.title}</span>
                </div>
              ))}
            </div>

            <div className={styles.modalBody}>
              {/* Paso 1: Datos Básicos */}
              {currentStep === 1 && (
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Primer Nombre *</label>
                    <input name="primer_nombre" value={formData.primer_nombre || ''} onChange={handleChange} required disabled={isDisabled} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Segundo Nombre</label>
                    <input name="segundo_nombre" value={formData.segundo_nombre || ''} onChange={handleChange} disabled={isDisabled} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Primer Apellido *</label>
                    <input name="primer_apellido" value={formData.primer_apellido || ''} onChange={handleChange} required disabled={isDisabled} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Segundo Apellido</label>
                    <input name="segundo_apellido" value={formData.segundo_apellido || ''} onChange={handleChange} disabled={isDisabled} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Tipo Documento *</label>
                    <select name="tipo_documento" value={formData.tipo_documento || 'TI'} onChange={handleChange} required disabled={isDisabled}>
                      <option value="TI">Tarjeta de Identidad</option>
                      <option value="RC">Registro Civil</option>
                      <option value="CC">Cédula de Ciudadanía</option>
                      <option value="CE">Cédula Extranjería</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Número Documento *</label>
                    <input name="numero_documento" value={formData.numero_documento || ''} onChange={handleChange} required disabled={isDisabled} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Fecha Nacimiento *</label>
                    <input type="date" name="fecha_nacimiento" value={formData.fecha_nacimiento?.split('T')[0] || ''} onChange={handleChange} required disabled={isDisabled} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Lugar de Nacimiento</label>
                    <input name="lugar_nacimiento" value={formData.lugar_nacimiento || ''} onChange={handleChange} disabled={isDisabled} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Género</label>
                    <select name="genero" value={formData.genero || ''} onChange={handleChange} disabled={isDisabled}>
                      <option value="">Seleccionar...</option>
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                  {modalMode === 'edit' && (
                    <div className={styles.formGroup}>
                      <label>Estado</label>
                      <select name="estado" value={formData.estado || 'Activo'} onChange={handleChange}>
                        <option value="Activo">Activo</option>
                        <option value="Inactivo">Inactivo</option>
                        <option value="Retirado">Retirado</option>
                        <option value="Graduado">Graduado</option>
                        <option value="Trasladado">Trasladado</option>
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Paso 2: Ubicación */}
              {currentStep === 2 && (
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Dirección</label>
                    <input name="direccion" value={formData.direccion || ''} onChange={handleChange} disabled={isDisabled} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Barrio</label>
                    <input name="barrio" value={formData.barrio || ''} onChange={handleChange} disabled={isDisabled} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Municipio</label>
                    <input name="municipio" value={formData.municipio || ''} onChange={handleChange} disabled={isDisabled} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Departamento</label>
                    <input name="departamento" value={formData.departamento || ''} onChange={handleChange} disabled={isDisabled} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Código SIMAT</label>
                    <input name="codigo_simat" value={formData.codigo_simat || ''} onChange={handleChange} disabled={isDisabled} />
                  </div>
                </div>
              )}

              {/* Paso 3: Salud */}
              {currentStep === 3 && (
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Grupo Sanguíneo</label>
                    <select name="grupo_sanguineo" value={formData.grupo_sanguineo || ''} onChange={handleChange} disabled={isDisabled}>
                      <option value="">Seleccionar...</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>EPS</label>
                    <input name="eps" value={formData.eps || ''} onChange={handleChange} disabled={isDisabled} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Alergias</label>
                    <input name="alergias" value={formData.alergias || ''} onChange={handleChange} disabled={isDisabled} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Condición Especial</label>
                    <input name="condicion_especial" value={formData.condicion_especial || ''} onChange={handleChange} disabled={isDisabled} />
                  </div>
                </div>
              )}
            </div>

            {/* Footer con navegación */}
            <div className={styles.modalFooter}>
              <div className={styles.footerLeft}>
                {currentStep > 1 && (
                  <button type="button" className={styles.prevBtn} onClick={prevStep}>
                    ← Anterior
                  </button>
                )}
              </div>
              <div className={styles.footerRight}>
                {currentStep < STEPS.length ? (
                  <button
                    type="button"
                    className={styles.nextBtn}
                    onClick={nextStep}
                    disabled={!canProceed()}
                  >
                    Siguiente →
                  </button>
                ) : (
                  modalMode !== 'view' && (
                    <button
                      type="button"
                      className={styles.saveBtn}
                      onClick={handleSubmit}
                      disabled={saving}
                    >
                      {saving ? 'Guardando...' : 'Guardar'}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
