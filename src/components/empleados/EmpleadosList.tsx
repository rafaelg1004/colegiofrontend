'use client';

import { useEffect, useState, useCallback } from 'react';
import { getAuthToken } from '@/utils/auth';
import styles from './EmpleadosList.module.css';

interface Empleado {
  id: string;
  primer_nombre: string;
  primer_apellido: string;
  numero_documento: string;
  cargo: string;
  estado: string;
  correo_electronico?: string;
  celular?: string;
  fecha_ingreso: string;
}

export const EmpleadosList = () => {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [buscar, setBuscar] = useState('');
  const [cargoFiltro, setCargoFiltro] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedEmpleado, setSelectedEmpleado] = useState<Empleado | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<any>({});

  const fetchEmpleados = useCallback(async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const params = new URLSearchParams();
      if (buscar) params.append('buscar', buscar);
      if (cargoFiltro) params.append('cargo', cargoFiltro);

      const res = await fetch(`http://localhost:3005/api/v1/nomina/empleados?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEmpleados(Array.isArray(data) ? data : []);
      }
    } finally {
      setLoading(false);
    }
  }, [buscar, cargoFiltro]);

  useEffect(() => {
    const timer = setTimeout(fetchEmpleados, 500);
    return () => clearTimeout(timer);
  }, [fetchEmpleados, buscar, cargoFiltro]);

  const openCreate = () => {
    setModalMode('create');
    setFormData({
      primer_nombre: '',
      primer_apellido: '',
      tipo_documento: 'CC',
      numero_documento: '',
      cargo: 'Docente',
      fecha_ingreso: new Date().toISOString().split('T')[0],
      estado: 'Activo'
    });
    setShowModal(true);
  };

  const openEdit = (emp: Empleado) => {
    setModalMode('edit');
    setSelectedEmpleado(emp);
    setFormData({ ...emp });
    setShowModal(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const token = getAuthToken();
      const url = modalMode === 'create'
        ? 'http://localhost:3005/api/v1/nomina/empleados'
        : `http://localhost:3005/api/v1/nomina/empleados/${selectedEmpleado?.id}`;
      
      const res = await fetch(url, {
        method: modalMode === 'create' ? 'POST' : 'PATCH',
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
      fetchEmpleados();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleSection}>
          <h1>Docentes y Empleados</h1>
          <p>Gestión de talento humano y personal administrativo</p>
        </div>
        <button className={styles.addBtn} onClick={openCreate}>+ Nuevo Empleado</button>
      </header>

      <div className={styles.filters}>
        <input 
          className={styles.searchInput}
          placeholder="Buscar por nombre o documento..."
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
        />
        <select 
          className={styles.filterSelect}
          value={cargoFiltro}
          onChange={(e) => setCargoFiltro(e.target.value)}
        >
          <option value="">Todos los cargos</option>
          <option value="Docente">Docente</option>
          <option value="Rector">Rector</option>
          <option value="Coordinador">Coordinador</option>
          <option value="Secretaria">Secretaria</option>
          <option value="Servicios Generales">Servicios Generales</option>
        </select>
      </div>

      <div className={styles.tableContainer}>
        {loading ? (
          <div className={styles.loading}>Cargando personal...</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nombre Completo</th>
                <th>Documento</th>
                <th>Cargo</th>
                <th>Contacto</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {empleados.map(emp => (
                <tr key={emp.id}>
                  <td className={styles.nameCell}>{emp.primer_nombre} {emp.primer_apellido}</td>
                  <td>{emp.numero_documento}</td>
                  <td>
                    <span className={`${styles.cargoTag} ${emp.cargo === 'Docente' ? styles.cargoDocente : styles.cargoAdmin}`}>
                      {emp.cargo}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.8rem' }}>{emp.correo_electronico}</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{emp.celular}</div>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${emp.estado === 'Activo' ? styles.activo : styles.inactivo}`}>
                      {emp.estado}
                    </span>
                  </td>
                  <td className={styles.actionsCell}>
                    <button className={styles.editBtn} onClick={() => openEdit(emp)}>Editar</button>
                  </td>
                </tr>
              ))}
              {empleados.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No se encontraron empleados</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{modalMode === 'create' ? 'Nuevo Empleado' : 'Editar Empleado'}</h2>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Primer Nombre *</label>
                  <input name="primer_nombre" value={formData.primer_nombre || ''} onChange={handleChange} required />
                </div>
                <div className={styles.formGroup}>
                  <label>Primer Apellido *</label>
                  <input name="primer_apellido" value={formData.primer_apellido || ''} onChange={handleChange} required />
                </div>
                <div className={styles.formGroup}>
                  <label>Tipo Documento *</label>
                  <select name="tipo_documento" value={formData.tipo_documento || 'CC'} onChange={handleChange}>
                    <option value="CC">Cédula de Ciudadanía</option>
                    <option value="CE">Cédula de Extranjería</option>
                    <option value="Pasaporte">Pasaporte</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Número Documento *</label>
                  <input name="numero_documento" value={formData.numero_documento || ''} onChange={handleChange} required />
                </div>
                <div className={styles.formGroup}>
                  <label>Cargo *</label>
                  <select name="cargo" value={formData.cargo || 'Docente'} onChange={handleChange}>
                    <option value="Docente">Docente</option>
                    <option value="Rector">Rector</option>
                    <option value="Coordinador">Coordinador</option>
                    <option value="Secretaria">Secretaria</option>
                    <option value="Psicologo">Psicólogo/a</option>
                    <option value="Servicios Generales">Servicios Generales</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Fecha Ingreso *</label>
                  <input type="date" name="fecha_ingreso" value={formData.fecha_ingreso || ''} onChange={handleChange} required />
                </div>
                <div className={styles.formGroup}>
                  <label>Correo Electrónico</label>
                  <input type="email" name="correo_electronico" value={formData.correo_electronico || ''} onChange={handleChange} />
                </div>
                <div className={styles.formGroup}>
                  <label>Celular</label>
                  <input name="celular" value={formData.celular || ''} onChange={handleChange} />
                </div>
                {modalMode === 'edit' && (
                  <div className={styles.formGroup}>
                    <label>Estado</label>
                    <select name="estado" value={formData.estado || 'Activo'} onChange={handleChange}>
                      <option value="Activo">Activo</option>
                      <option value="Inactivo">Inactivo</option>
                      <option value="Licencia">Licencia</option>
                      <option value="Retirado">Retirado</option>
                    </select>
                  </div>
                )}
              </div>
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
