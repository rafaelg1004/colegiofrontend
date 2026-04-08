'use client';

import { useEffect, useState, useCallback } from 'react';
import { getAuthToken } from '@/utils/auth';
import { API_URL } from '@/utils/api';
import styles from './CircularesList.module.css';

interface Circular {
  id: string;
  titulo: string;
  contenido: string;
  dirigida_a: string;
  fecha_publicacion: string;
  archivo_adjunto_url?: string;
  publicado_por_empleado?: {
    primer_nombre: string;
    primer_apellido: string;
    cargo: string;
  };
  grupo?: {
    nombre: string;
    grado: { nombre: string };
  };
}

const DESTINATARIOS = ['Todos', 'Acudientes', 'Docentes', 'Estudiantes', 'Grupo especifico'];

export const CircularesList = () => {
  const [circulares, setCirculares] = useState<Circular[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetalle, setShowDetalle] = useState<Circular | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<any>({});

  const fetchCirculares = useCallback(async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const params = filtro ? `?dirigida_a=${encodeURIComponent(filtro)}` : '';
      const res = await fetch(`${API_URL}/comunicacion/circulares${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCirculares(Array.isArray(data) ? data : []);
      }
    } finally {
      setLoading(false);
    }
  }, [filtro]);

  useEffect(() => {
    fetchCirculares();
  }, [fetchCirculares]);

  const openModal = () => {
    setFormData({
      titulo: '',
      contenido: '',
      dirigida_a: 'Todos'
    });
    setShowModal(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const token = getAuthToken();
      const res = await fetch('${API_URL}/comunicacion/circulares', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Error al publicar');
      }

      setShowModal(false);
      fetchCirculares();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const getDestinatarioIcon = (dest: string) => {
    const icons: Record<string, string> = {
      'Todos': '📢',
      'Acudientes': '👨‍👩‍👧',
      'Docentes': '👨‍🏫',
      'Estudiantes': '🎒',
      'Grupo especifico': '👥',
    };
    return icons[dest] || '📋';
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleSection}>
          <h1>Circulares</h1>
          <p>Comunicados institucionales</p>
        </div>
        <button className={styles.addBtn} onClick={openModal}>
          + Nueva Circular
        </button>
      </header>

      <div className={styles.filters}>
        <select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">Todas las circulares</option>
          {DESTINATARIOS.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className={styles.loading}>Cargando circulares...</div>
      ) : (
        <div className={styles.circularesList}>
          {circulares.map(circular => (
            <div
              key={circular.id}
              className={styles.circularCard}
              onClick={() => setShowDetalle(circular)}
            >
              <div className={styles.circularIcon}>
                {getDestinatarioIcon(circular.dirigida_a)}
              </div>
              <div className={styles.circularContent}>
                <div className={styles.circularHeader}>
                  <h3>{circular.titulo}</h3>
                  <span className={styles.fecha}>
                    {new Date(circular.fecha_publicacion).toLocaleDateString('es-CO')}
                  </span>
                </div>
                <p className={styles.preview}>
                  {circular.contenido.substring(0, 150)}
                  {circular.contenido.length > 150 ? '...' : ''}
                </p>
                <div className={styles.circularMeta}>
                  <span className={styles.destinatario}>{circular.dirigida_a}</span>
                  {circular.publicado_por_empleado && (
                    <span className={styles.autor}>
                      Por: {circular.publicado_por_empleado.primer_nombre} {circular.publicado_por_empleado.primer_apellido}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {circulares.length === 0 && (
            <div className={styles.empty}>No hay circulares publicadas</div>
          )}
        </div>
      )}

      {/* Modal Crear */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Nueva Circular</h2>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>x</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Titulo *</label>
                <input
                  name="titulo"
                  value={formData.titulo || ''}
                  onChange={handleChange}
                  placeholder="Titulo de la circular"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Dirigida a *</label>
                <select name="dirigida_a" value={formData.dirigida_a || 'Todos'} onChange={handleChange}>
                  {DESTINATARIOS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Contenido *</label>
                <textarea
                  name="contenido"
                  value={formData.contenido || ''}
                  onChange={handleChange}
                  rows={8}
                  placeholder="Escriba el contenido de la circular..."
                  required
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancelar</button>
              <button className={styles.saveBtn} onClick={handleSubmit} disabled={saving}>
                {saving ? 'Publicando...' : 'Publicar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalle */}
      {showDetalle && (
        <div className={styles.modalOverlay} onClick={() => setShowDetalle(null)}>
          <div className={styles.modalLarge} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{showDetalle.titulo}</h2>
              <button className={styles.closeBtn} onClick={() => setShowDetalle(null)}>x</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.detalleMeta}>
                <span className={styles.destinatarioTag}>{showDetalle.dirigida_a}</span>
                <span className={styles.fechaDetalle}>
                  {new Date(showDetalle.fecha_publicacion).toLocaleDateString('es-CO', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <div className={styles.contenidoFull}>
                {showDetalle.contenido}
              </div>
              {showDetalle.publicado_por_empleado && (
                <div className={styles.firma}>
                  <strong>Publicado por:</strong>
                  <p>{showDetalle.publicado_por_empleado.primer_nombre} {showDetalle.publicado_por_empleado.primer_apellido}</p>
                  <span>{showDetalle.publicado_por_empleado.cargo}</span>
                </div>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowDetalle(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
