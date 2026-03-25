'use client';

import { useEffect, useState, useCallback } from 'react';
import { getAuthToken } from '@/utils/auth';
import styles from './AcudientesList.module.css';

interface Acudiente {
  id: string;
  primer_nombre: string;
  primer_apellido: string;
  numero_documento: string;
  parentesco?: string;
  celular?: string;
  correo_electronico?: string;
}

export const AcudientesList = () => {
  const [acudientes, setAcudientes] = useState<Acudiente[]>([]);
  const [loading, setLoading] = useState(true);
  const [buscar, setBuscar] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);

  const fetchAcudientes = useCallback(async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`http://localhost:3005/api/v1/acudientes?buscar=${buscar}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAcudientes(Array.isArray(data) ? data : []);
      }
    } finally {
      setLoading(false);
    }
  }, [buscar]);

  useEffect(() => {
    const timer = setTimeout(fetchAcudientes, 500);
    return () => clearTimeout(timer);
  }, [fetchAcudientes, buscar]);

  const openCreate = () => {
    setFormData({
      primer_nombre: '',
      primer_apellido: '',
      tipo_documento: 'CC',
      numero_documento: '',
      parentesco: 'Padre'
    });
    setShowModal(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const token = getAuthToken();
      const res = await fetch('http://localhost:3005/api/v1/acudientes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setShowModal(false);
        fetchAcudientes();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleSection}>
          <h1>Acudientes y Padres</h1>
          <p>Gestión de representantes legales y contacto familiar</p>
        </div>
        <button className={styles.addBtn} onClick={openCreate}>+ Nuevo Acudiente</button>
      </header>

      <div className={styles.filters}>
        <input 
          className={styles.searchInput}
          placeholder="Buscar por nombre o documento..."
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
        />
      </div>

      <div className={styles.tableContainer}>
        {loading ? (
          <div className={styles.loading}>Cargando datos...</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Documento</th>
                <th>Parentesco</th>
                <th>Contacto</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {acudientes.map(ac => (
                <tr key={ac.id}>
                  <td className={styles.nameCell}>{ac.primer_nombre} {ac.primer_apellido}</td>
                  <td>{ac.numero_documento}</td>
                  <td className={styles.parentesco}>{ac.parentesco}</td>
                  <td>
                    <div>{ac.celular}</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{ac.correo_electronico}</div>
                  </td>
                  <td>
                    <button className={styles.editBtn}>Detalles</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h2>Nuevo Acudiente</h2>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Nombre *</label>
                <input name="primer_nombre" value={formData.primer_nombre || ''} onChange={handleChange} />
              </div>
              <div className={styles.formGroup}>
                <label>Apellido *</label>
                <input name="primer_apellido" value={formData.primer_apellido || ''} onChange={handleChange} />
              </div>
              <div className={styles.formGroup}>
                <label>Documento *</label>
                <input name="numero_documento" value={formData.numero_documento || ''} onChange={handleChange} />
              </div>
              <div className={styles.formGroup}>
                <label>Parentesco</label>
                <input name="parentesco" value={formData.parentesco || ''} onChange={handleChange} />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button onClick={() => setShowModal(false)}>Cancelar</button>
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
