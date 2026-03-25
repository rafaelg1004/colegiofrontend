'use client';

import React, { useEffect, useState } from 'react';
import { getAuthToken } from '@/utils/auth';
import styles from './InventarioList.module.css';

export const InventarioList = () => {
  const [elementos, setElementos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
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
    fetchInventario();
  }, []);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleSection}>
          <h1>Inventario Institucional</h1>
          <p>Control de recursos físicos, suministros y activos</p>
        </div>
        <div className={styles.actions}>
          <button className={styles.moveBtn}>Registrar Movimiento</button>
          <button className={styles.addBtn}>+ Nuevo Elemento</button>
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
          elementos.map((el) => (
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
                <button className={styles.detailBtn}>Ver historial</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
