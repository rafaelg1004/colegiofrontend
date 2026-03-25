'use client';

import React, { useEffect, useState } from 'react';
import { getAuthToken } from '@/utils/auth';
import styles from './InventarioList.module.css';

export const InventarioList = () => {
  const [elementos, setElementos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'move' | 'history'>('create');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);

  const fetchInventario = async () => {
    try {
      const token = getAuthToken();
      const res = await fetch(`http://localhost:3005/api/v1/inventario/articulos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setElementos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategorias = async () => {
    try {
      const token = getAuthToken();
      const res = await fetch(`http://localhost:3005/api/v1/inventario/categorias`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setCategorias(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchInventario();
    fetchCategorias();
  }, []);

  const openCreate = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      codigo_interno: '',
      cantidad_stock: 0,
      cantidad_minima: 0,
      unidad_medida: 'und',
      precio_unitario: 0,
      ubicacion: 'Almacén Central',
      categoria_id: ''
    });
    setModalMode('create');
    setShowModal(true);
  };

  const openMove = (item: any) => {
    setSelectedItem(item);
    setFormData({
      tipo_movimiento: 'Entrada',
      cantidad: 0,
      observacion: ''
    });
    setModalMode('move');
    setShowModal(true);
  };

  const openHistory = (item: any) => {
    setSelectedItem(item);
    setModalMode('history');
    setShowModal(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let parsedValue: any = value;
    if (type === 'number') {
      parsedValue = value === '' ? null : parseFloat(value);
    }
    setFormData({ ...formData, [name]: parsedValue });
  };

  const handleSubmit = async () => {
    if (!formData.nombre?.trim()) {
      alert('El nombre del artículo es obligatorio');
      return;
    }

    setSaving(true);
    try {
      const token = getAuthToken();
      const res = await fetch('http://localhost:3005/api/v1/inventario/articulos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Error al crear artículo');
      }

      setShowModal(false);
      fetchInventario();
    } catch (err: any) {
      alert(err.message || 'Error al crear artículo');
    } finally {
      setSaving(false);
    }
  };

  const filteredElementos = elementos.filter(el =>
    el.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    el.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleSection}>
          <h1>Inventario Institucional</h1>
          <p>Control de recursos físicos, suministros y activos</p>
        </div>
        <div className={styles.actions}>
          <button className={styles.moveBtn} onClick={() => alert('Seleccione un elemento para registrar movimiento')}>Registrar Movimiento</button>
          <button className={styles.addBtn} onClick={openCreate}>+ Nuevo Elemento</button>
        </div>
      </header>

      <div className={styles.searchBar}>
        <input 
          type="text" 
          placeholder="Buscar elemento por nombre o código..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className={styles.grid}>
        {loading ? (
          <div className={styles.loading}>Sincronizando almacén...</div>
        ) : (
          filteredElementos.map((el) => (
            <div key={el.id} className={styles.itemCard}>
              <div className={styles.cardHeader}>
                <span className={styles.category}>{el.categoria?.nombre || 'General'}</span>
                <span className={`${styles.stock} ${el.cantidad_stock <= (el.cantidad_minima || 0) ? styles.low : ''}`}>
                  Stock: {el.cantidad_stock} {el.unidad_medida || 'und'}
                </span>
              </div>
              <h3>{el.nombre}</h3>
              <p className={styles.description}>{el.descripcion || 'Sin descripción'}</p>
              <div className={styles.cardFooter}>
                <span className={styles.location}>📍 {el.ubicacion || 'Almacén Central'}</span>
                <div className={styles.cardActions}>
                  <button className={styles.moveBtn} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={() => openMove(el)}>Mover</button>
                  <button className={styles.detailBtn} onClick={() => openHistory(el)}>Historial</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>
                {modalMode === 'create' && 'Nuevo Elemento'}
                {modalMode === 'move' && `Movimiento: ${selectedItem?.nombre}`}
                {modalMode === 'history' && `Historial: ${selectedItem?.nombre}`}
              </h2>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className={styles.modalBody}>
              {modalMode === 'create' && (
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Nombre *</label>
                    <input name="nombre" value={formData.nombre || ''} onChange={handleChange} required />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Categoría</label>
                    <select name="categoria_id" value={formData.categoria_id || ''} onChange={handleChange}>
                      <option value="">Seleccionar categoría</option>
                      {categorias.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Cantidad Inicial</label>
                    <input type="number" name="cantidad_stock" value={formData.cantidad_stock || 0} onChange={handleChange} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Cantidad Mínima</label>
                    <input type="number" name="cantidad_minima" value={formData.cantidad_minima || 0} onChange={handleChange} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Unidad</label>
                    <select name="unidad_medida" value={formData.unidad_medida || 'und'} onChange={handleChange}>
                      <option value="und">Unidad</option>
                      <option value="kg">Kilogramo</option>
                      <option value="lt">Litro</option>
                      <option value="pkg">Paquete</option>
                      <option value="caja">Caja</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Precio Unitario</label>
                    <input type="number" step="0.01" name="precio_unitario" value={formData.precio_unitario || 0} onChange={handleChange} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Ubicación</label>
                    <input name="ubicacion" value={formData.ubicacion || ''} onChange={handleChange} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Código Interno</label>
                    <input name="codigo_interno" value={formData.codigo_interno || ''} onChange={handleChange} />
                  </div>
                  <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                    <label>Descripción</label>
                    <textarea name="descripcion" value={formData.descripcion || ''} onChange={handleChange} rows={2} />
                  </div>
                </div>
              )}
              {modalMode === 'move' && selectedItem && (
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Tipo de Movimiento</label>
                    <select name="tipo_movimiento" value={formData.tipo_movimiento || 'Entrada'} onChange={handleChange}>
                      <option value="Entrada">Entrada</option>
                      <option value="Salida">Salida</option>
                      <option value="Ajuste">Ajuste</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Cantidad</label>
                    <input type="number" name="cantidad" value={formData.cantidad || 0} onChange={handleChange} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Observación</label>
                    <input name="observacion" value={formData.observacion || ''} onChange={handleChange} />
                  </div>
                </div>
              )}
              {modalMode === 'history' && (
                <div className={styles.historyList}>
                  <p style={{ color: '#64748b', textAlign: 'center' }}>Historial de movimientos - Funcionalidad en desarrollo</p>
                </div>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancelar</button>
              {modalMode !== 'history' && (
                <button className={styles.saveBtn} onClick={handleSubmit} disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
