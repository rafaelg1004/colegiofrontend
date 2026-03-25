'use client';

import { useEffect, useState, useCallback } from 'react';
import { getAuthToken } from '@/utils/auth';
import styles from './ConfiguracionAcademica.module.css';

// Interfaces
interface Sede {
  id: string;
  nombre: string;
  direccion?: string;
  telefono?: string;
}

interface AnioLectivo {
  id: string;
  anio: number;
  activo: boolean;
}

interface Periodo {
  id: string;
  nombre: string;
  numero: number;
  porcentaje_peso: number;
  activo: boolean;
  anio_lectivo_id: string;
}

interface Area {
  id: string;
  nombre: string;
  asignatura?: Asignatura[];
}

interface Asignatura {
  id: string;
  nombre: string;
  area_id: string;
}

type TabId = 'sedes' | 'anios' | 'periodos' | 'areas';

export const ConfiguracionAcademica = () => {
  const [activeTab, setActiveTab] = useState<TabId>('anios');
  const [loading, setLoading] = useState(false);

  // Data states
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [anios, setAnios] = useState<AnioLectivo[]>([]);
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [anioSeleccionado, setAnioSeleccionado] = useState<string>('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'sede' | 'anio' | 'periodo' | 'area' | 'asignatura'>('sede');
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<any>({});

  const tabs = [
    { id: 'anios' as TabId, name: 'Años Lectivos', icon: '📅' },
    { id: 'periodos' as TabId, name: 'Periodos', icon: '📊' },
    { id: 'sedes' as TabId, name: 'Sedes', icon: '🏫' },
    { id: 'areas' as TabId, name: 'Áreas y Asignaturas', icon: '📚' },
  ];

  // Fetch functions
  const fetchSedes = useCallback(async () => {
    const token = getAuthToken();
    const res = await fetch('http://localhost:3005/api/v1/academico/sedes', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) setSedes(await res.json());
  }, []);

  const fetchAnios = useCallback(async () => {
    const token = getAuthToken();
    const res = await fetch('http://localhost:3005/api/v1/academico/anios-lectivos', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setAnios(data || []);
      const activo = data.find((a: AnioLectivo) => a.activo);
      if (activo && !anioSeleccionado) setAnioSeleccionado(activo.id);
    }
  }, [anioSeleccionado]);

  const fetchPeriodos = useCallback(async () => {
    if (!anioSeleccionado) return;
    const token = getAuthToken();
    const res = await fetch(`http://localhost:3005/api/v1/academico/periodos?anio_lectivo_id=${anioSeleccionado}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) setPeriodos(await res.json());
  }, [anioSeleccionado]);

  const fetchAreas = useCallback(async () => {
    const token = getAuthToken();
    const res = await fetch('http://localhost:3005/api/v1/academico/areas', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) setAreas(await res.json());
  }, []);

  // Load data on tab change
  useEffect(() => {
    setLoading(true);
    const loadData = async () => {
      switch (activeTab) {
        case 'sedes': await fetchSedes(); break;
        case 'anios': await fetchAnios(); break;
        case 'periodos': await fetchAnios(); await fetchPeriodos(); break;
        case 'areas': await fetchAreas(); break;
      }
      setLoading(false);
    };
    loadData();
  }, [activeTab, fetchSedes, fetchAnios, fetchPeriodos, fetchAreas]);

  useEffect(() => {
    if (activeTab === 'periodos' && anioSeleccionado) {
      fetchPeriodos();
    }
  }, [anioSeleccionado, activeTab, fetchPeriodos]);

  // Open modals
  const openModal = (type: typeof modalType, data?: any) => {
    setModalType(type);
    // Inicializar con valores por defecto según el tipo
    let defaultData = data || {};
    if (type === 'anio' && !data) {
      defaultData = { anio: new Date().getFullYear(), activo: false };
    }
    if (type === 'periodo' && !data) {
      defaultData = { numero: 1, porcentaje_peso: 25, activo: false };
    }
    setFormData(defaultData);
    setShowModal(true);
  };

  // Handle submit
  const handleSubmit = async () => {
    setSaving(true);
    try {
      const token = getAuthToken();
      let endpoint = '';
      let body: any = {};

      switch (modalType) {
        case 'sede':
          endpoint = 'sedes';
          body = { nombre: formData.nombre, direccion: formData.direccion, telefono: formData.telefono };
          break;
        case 'anio':
          endpoint = 'anios-lectivos';
          const anioValue = parseInt(formData.anio) || new Date().getFullYear();
          body = {
            anio: anioValue,
            fecha_inicio: formData.fecha_inicio,
            fecha_fin: formData.fecha_fin,
            activo: formData.activo || false
          };
          break;
        case 'periodo':
          endpoint = 'periodos';
          body = {
            nombre: formData.nombre,
            numero: parseInt(formData.numero),
            porcentaje_peso: parseFloat(formData.porcentaje_peso),
            anio_lectivo_id: anioSeleccionado,
            fecha_inicio: formData.fecha_inicio,
            fecha_fin: formData.fecha_fin
          };
          break;
        case 'area':
          endpoint = 'areas';
          body = { nombre: formData.nombre };
          break;
        case 'asignatura':
          endpoint = 'asignaturas';
          body = { nombre: formData.nombre, area_id: formData.area_id };
          break;
      }

      const res = await fetch(`http://localhost:3005/api/v1/academico/${endpoint}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Error al guardar');
      }

      setShowModal(false);
      // Refresh data
      switch (modalType) {
        case 'sede': fetchSedes(); break;
        case 'anio': fetchAnios(); break;
        case 'periodo': fetchPeriodos(); break;
        case 'area':
        case 'asignatura': fetchAreas(); break;
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  // Render content based on active tab
  const renderContent = () => {
    if (loading) return <div className={styles.loading}>Cargando...</div>;

    switch (activeTab) {
      case 'sedes':
        return (
          <div className={styles.dataGrid}>
            {sedes.length > 0 ? sedes.map(sede => (
              <div key={sede.id} className={styles.card}>
                <div className={styles.cardIcon}>🏫</div>
                <div className={styles.cardInfo}>
                  <h3>{sede.nombre}</h3>
                  <p>{sede.direccion || 'Sin dirección'}</p>
                  {sede.telefono && <span className={styles.meta}>Tel: {sede.telefono}</span>}
                </div>
              </div>
            )) : <div className={styles.empty}>No hay sedes registradas</div>}
          </div>
        );

      case 'anios':
        return (
          <div className={styles.dataGrid}>
            {anios.length > 0 ? anios.map(anio => (
              <div key={anio.id} className={`${styles.card} ${anio.activo ? styles.cardActive : ''}`}>
                <div className={styles.cardIcon}>📅</div>
                <div className={styles.cardInfo}>
                  <h3>{anio.anio}</h3>
                  <span className={`${styles.badge} ${anio.activo ? styles.badgeActive : styles.badgeInactive}`}>
                    {anio.activo ? 'Vigente' : 'Inactivo'}
                  </span>
                </div>
              </div>
            )) : <div className={styles.empty}>No hay años lectivos</div>}
          </div>
        );

      case 'periodos':
        return (
          <>
            <div className={styles.filterBar}>
              <select
                value={anioSeleccionado}
                onChange={(e) => setAnioSeleccionado(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="">Seleccionar año...</option>
                {anios.map(a => (
                  <option key={a.id} value={a.id}>{a.anio} {a.activo ? '(Activo)' : ''}</option>
                ))}
              </select>
            </div>
            <div className={styles.dataGrid}>
              {periodos.length > 0 ? periodos.map(periodo => (
                <div key={periodo.id} className={`${styles.card} ${periodo.activo ? styles.cardActive : ''}`}>
                  <div className={styles.cardIcon}>📊</div>
                  <div className={styles.cardInfo}>
                    <h3>{periodo.nombre}</h3>
                    <p>Periodo #{periodo.numero}</p>
                    <div className={styles.metaRow}>
                      <span className={styles.meta}>Peso: {periodo.porcentaje_peso}%</span>
                      <span className={`${styles.badge} ${periodo.activo ? styles.badgeActive : styles.badgeInactive}`}>
                        {periodo.activo ? 'Activo' : 'Cerrado'}
                      </span>
                    </div>
                  </div>
                </div>
              )) : <div className={styles.empty}>{anioSeleccionado ? 'No hay periodos para este año' : 'Seleccione un año lectivo'}</div>}
            </div>
          </>
        );

      case 'areas':
        return (
          <div className={styles.areasContainer}>
            {areas.length > 0 ? areas.map(area => (
              <div key={area.id} className={styles.areaCard}>
                <div className={styles.areaHeader}>
                  <h3>📚 {area.nombre}</h3>
                  <button
                    className={styles.addSmallBtn}
                    onClick={() => openModal('asignatura', { area_id: area.id })}
                  >
                    + Asignatura
                  </button>
                </div>
                <div className={styles.asignaturasList}>
                  {area.asignatura && area.asignatura.length > 0 ? (
                    area.asignatura.map(asig => (
                      <div key={asig.id} className={styles.asignaturaItem}>
                        <span>{asig.nombre}</span>
                      </div>
                    ))
                  ) : (
                    <p className={styles.noAsignaturas}>Sin asignaturas</p>
                  )}
                </div>
              </div>
            )) : <div className={styles.empty}>No hay áreas registradas</div>}
          </div>
        );

      default:
        return null;
    }
  };

  const getAddButtonConfig = () => {
    switch (activeTab) {
      case 'sedes': return { label: '+ Nueva Sede', type: 'sede' as const };
      case 'anios': return { label: '+ Nuevo Año', type: 'anio' as const };
      case 'periodos': return { label: '+ Nuevo Periodo', type: 'periodo' as const };
      case 'areas': return { label: '+ Nueva Área', type: 'area' as const };
    }
  };

  const addBtn = getAddButtonConfig();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleSection}>
          <h1>Configuración Académica</h1>
          <p>Parámetros base del sistema escolar</p>
        </div>
        <button className={styles.addBtn} onClick={() => openModal(addBtn.type)}>
          {addBtn.label}
        </button>
      </header>

      <div className={styles.tabs}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`${styles.tabBtn} ${activeTab === tab.id ? styles.activeTab : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className={styles.tabIcon}>{tab.icon}</span>
            {tab.name}
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {renderContent()}
      </div>

      {/* Modal */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>
                {modalType === 'sede' && 'Nueva Sede'}
                {modalType === 'anio' && 'Nuevo Año Lectivo'}
                {modalType === 'periodo' && 'Nuevo Periodo'}
                {modalType === 'area' && 'Nueva Área'}
                {modalType === 'asignatura' && 'Nueva Asignatura'}
              </h2>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>×</button>
            </div>

            <div className={styles.modalBody}>
              {modalType === 'sede' && (
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Nombre *</label>
                    <input name="nombre" value={formData.nombre || ''} onChange={handleChange} required />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Dirección</label>
                    <input name="direccion" value={formData.direccion || ''} onChange={handleChange} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Teléfono</label>
                    <input name="telefono" value={formData.telefono || ''} onChange={handleChange} />
                  </div>
                </div>
              )}

              {modalType === 'anio' && (
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Año *</label>
                    <input type="number" name="anio" value={formData.anio || new Date().getFullYear()} onChange={handleChange} min="2000" max="2100" required />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Fecha Inicio *</label>
                    <input type="date" name="fecha_inicio" value={formData.fecha_inicio || ''} onChange={handleChange} required />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Fecha Fin *</label>
                    <input type="date" name="fecha_fin" value={formData.fecha_fin || ''} onChange={handleChange} required />
                  </div>
                  <div className={styles.formGroupCheck}>
                    <label>
                      <input type="checkbox" name="activo" checked={formData.activo || false} onChange={handleChange} />
                      Marcar como año activo
                    </label>
                  </div>
                </div>
              )}

              {modalType === 'periodo' && (
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Nombre *</label>
                    <input name="nombre" value={formData.nombre || ''} onChange={handleChange} placeholder="Ej: Primer Periodo" required />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Número *</label>
                    <input type="number" name="numero" value={formData.numero || ''} onChange={handleChange} min="1" max="5" required />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Peso (%) *</label>
                    <input type="number" name="porcentaje_peso" value={formData.porcentaje_peso || ''} onChange={handleChange} min="0" max="100" required />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Fecha Inicio *</label>
                    <input type="date" name="fecha_inicio" value={formData.fecha_inicio || ''} onChange={handleChange} required />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Fecha Fin *</label>
                    <input type="date" name="fecha_fin" value={formData.fecha_fin || ''} onChange={handleChange} required />
                  </div>
                </div>
              )}

              {modalType === 'area' && (
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Nombre del Área *</label>
                    <input name="nombre" value={formData.nombre || ''} onChange={handleChange} placeholder="Ej: Matemáticas" required />
                  </div>
                </div>
              )}

              {modalType === 'asignatura' && (
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Nombre *</label>
                    <input name="nombre" value={formData.nombre || ''} onChange={handleChange} placeholder="Ej: Álgebra" required />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Área *</label>
                    <select name="area_id" value={formData.area_id || ''} onChange={handleChange} required>
                      <option value="">Seleccionar...</option>
                      {areas.map(a => (
                        <option key={a.id} value={a.id}>{a.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancelar</button>
              <button className={styles.saveBtn} onClick={handleSubmit} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
