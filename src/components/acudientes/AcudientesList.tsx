'use client';

import { useEffect, useState, useCallback } from 'react';
import { getAuthToken } from '@/utils/auth';
import styles from './AcudientesList.module.css';

interface Estudiante {
  id: string;
  primer_nombre: string;
  primer_apellido: string;
  numero_documento: string;
}

interface Acudiente {
  id: string;
  primer_nombre: string;
  primer_apellido: string;
  tipo_documento: string;
  numero_documento: string;
  parentesco?: string;
  telefono?: string;
  celular?: string;
  correo_electronico?: string;
  direccion?: string;
  ocupacion?: string;
  empresa?: string;
  estudiante_acudiente?: Array<{
    es_principal: boolean;
    estudiante: Estudiante;
  }>;
}

export const AcudientesList = () => {
  const [acudientes, setAcudientes] = useState<Acudiente[]>([]);
  const [loading, setLoading] = useState(true);
  const [buscar, setBuscar] = useState('');
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [searchEstudiante, setSearchEstudiante] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [showDetalle, setShowDetalle] = useState(false);
  const [selectedAcudiente, setSelectedAcudiente] = useState<Acudiente | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [selectedEstudiante, setSelectedEstudiante] = useState<Estudiante | null>(null);
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

  // Buscar estudiantes para asociar
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
    setFormData({
      primer_nombre: '',
      primer_apellido: '',
      tipo_documento: 'CC',
      numero_documento: '',
      parentesco: 'Padre',
      telefono: '',
      celular: '',
      correo_electronico: '',
      direccion: '',
      ocupacion: '',
      empresa: ''
    });
    setSelectedEstudiante(null);
    setSearchEstudiante('');
    setEstudiantes([]);
    setShowModal(true);
  };

  const viewDetails = (ac: Acudiente) => {
    setSelectedAcudiente(ac);
    setShowDetalle(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const selectEstudiante = (est: Estudiante) => {
    setSelectedEstudiante(est);
    setSearchEstudiante(`${est.primer_nombre} ${est.primer_apellido} - ${est.numero_documento}`);
    setEstudiantes([]);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const token = getAuthToken();

      // Primero crear el acudiente
      const res = await fetch('http://localhost:3005/api/v1/acudientes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const data = await res.json();

        // Si hay estudiante seleccionado, asociarlo desde el estudiante
        if (selectedEstudiante) {
          await fetch(`http://localhost:3005/api/v1/estudiantes/${selectedEstudiante.id}/acudiente`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              estudiante_id: selectedEstudiante.id,
              acudiente_id: data.data?.id,
              es_principal: true
            })
          });
        }

        setShowModal(false);
        fetchAcudientes();
      } else {
        const error = await res.json();
        throw new Error(error.message || 'Error al guardar');
      }
    } catch (err: any) {
      alert(err.message || 'Error al guardar');
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
                <th>Nombre Completo</th>
                <th>Documento</th>
                <th>Parentesco</th>
                <th>Estudiantes</th>
                <th>Contacto</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {acudientes.map(ac => (
                <tr key={ac.id}>
                  <td className={styles.nameCell}>
                    {ac.primer_nombre} {ac.primer_apellido}
                  </td>
                  <td>{ac.tipo_documento}: {ac.numero_documento}</td>
                  <td className={styles.parentesco}>{ac.parentesco}</td>
                  <td>
                    {ac.estudiante_acudiente && ac.estudiante_acudiente.length > 0 ? (
                      ac.estudiante_acudiente.map((ea, idx) => (
                        <div key={idx} style={{ fontSize: '0.8rem' }}>
                          {ea.estudiante.primer_nombre} {ea.estudiante.primer_apellido}
                          {ea.es_principal && <span style={{ marginLeft: '4px', color: '#16a34a' }}>★</span>}
                        </div>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Sin asociación</span>
                    )}
                  </td>
                  <td>
                    <div>{ac.celular}</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{ac.correo_electronico}</div>
                  </td>
                  <td>
                    <button className={styles.editBtn} onClick={() => viewDetails(ac)}>Detalles</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal} style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <h2>Nuevo Acudiente</h2>
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
                  <option value="NIT">NIT</option>
                  <option value="Pasaporte">Pasaporte</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Número Documento *</label>
                <input name="numero_documento" value={formData.numero_documento || ''} onChange={handleChange} required />
              </div>
              <div className={styles.formGroup}>
                <label>Parentesco *</label>
                <select name="parentesco" value={formData.parentesco || 'Padre'} onChange={handleChange}>
                  <option value="Padre">Padre</option>
                  <option value="Madre">Madre</option>
                  <option value="Abuelo">Abuelo/a</option>
                  <option value="Tío">Tío/a</option>
                  <option value="Hermano">Hermano/a</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Teléfono</label>
                <input name="telefono" value={formData.telefono || ''} onChange={handleChange} />
              </div>
              <div className={styles.formGroup}>
                <label>Celular</label>
                <input name="celular" value={formData.celular || ''} onChange={handleChange} />
              </div>
              <div className={styles.formGroup}>
                <label>Correo Electrónico</label>
                <input name="correo_electronico" type="email" value={formData.correo_electronico || ''} onChange={handleChange} />
              </div>
              <div className={styles.formGroup}>
                <label>Dirección</label>
                <input name="direccion" value={formData.direccion || ''} onChange={handleChange} />
              </div>
              <div className={styles.formGroup}>
                <label>Ocupación</label>
                <input name="ocupacion" value={formData.ocupacion || ''} onChange={handleChange} />
              </div>
              <div className={styles.formGroup}>
                <label>Empresa</label>
                <input name="empresa" value={formData.empresa || ''} onChange={handleChange} />
              </div>

              {/* Asociación de estudiante */}
              <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                <label>Asociar Estudiante (opcional)</label>
                <input
                  type="text"
                  placeholder="Buscar estudiante por nombre o documento..."
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
                {selectedEstudiante && (
                  <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#dcfce7', borderRadius: '6px', fontSize: '0.875rem' }}>
                    Estudiante seleccionado: <strong>{selectedEstudiante.primer_nombre} {selectedEstudiante.primer_apellido}</strong>
                  </div>
                )}
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

      {showDetalle && selectedAcudiente && (
        <div className={styles.modalOverlay} onClick={() => setShowDetalle(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h2>Detalles del Acudiente</h2>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Nombre Completo</label>
                <div style={{ padding: '0.5rem', background: '#f8fafc', borderRadius: '6px' }}>
                  {selectedAcudiente.primer_nombre} {selectedAcudiente.primer_apellido}
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Documento</label>
                <div style={{ padding: '0.5rem', background: '#f8fafc', borderRadius: '6px' }}>
                  {selectedAcudiente.numero_documento}
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Parentesco</label>
                <div style={{ padding: '0.5rem', background: '#f8fafc', borderRadius: '6px' }}>
                  {selectedAcudiente.parentesco}
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Celular</label>
                <div style={{ padding: '0.5rem', background: '#f8fafc', borderRadius: '6px' }}>
                  {selectedAcudiente.celular || 'No registrado'}
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Correo Electrónico</label>
                <div style={{ padding: '0.5rem', background: '#f8fafc', borderRadius: '6px' }}>
                  {selectedAcudiente.correo_electronico || 'No registrado'}
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button onClick={() => setShowDetalle(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
