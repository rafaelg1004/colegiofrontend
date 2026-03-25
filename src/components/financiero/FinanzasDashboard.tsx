'use client';

import React, { useEffect, useState } from 'react';
import { getAuthToken } from '@/utils/auth';
import styles from './FinanzasDashboard.module.css';

export const FinanzasDashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [facturas, setFacturas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = getAuthToken();
        const [resStats, resFact] = await Promise.all([
          fetch('http://localhost:3005/api/v1/financiero/resumen', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('http://localhost:3005/api/v1/financiero/facturas', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        
        setStats(await resStats.json());
        const dataFact = await resFact.json();
        setFacturas(dataFact.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className={styles.loading}>Cargando datos financieros...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Gstión Financiera</h1>
        <p>Resumen de facturación, recaudos y cartera</p>
      </header>

      {stats && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Total Facturado</span>
            <span className={styles.statValue}>${stats.total_facturado?.toLocaleString()}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Total Recaudado</span>
            <span className={styles.statValue + ' ' + styles.collected}>${stats.total_recaudado?.toLocaleString()}</span>
            <div className={styles.progress}>
              <div className={styles.bar} style={{ width: `${stats.porcentaje_recaudo}%` }}></div>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Pendiente por Cobrar</span>
            <span className={styles.statValue + ' ' + styles.pending}>${stats.total_pendiente?.toLocaleString()}</span>
          </div>
        </div>
      )}

      <div className={styles.mainGrid}>
        <div className={styles.tableSection}>
          <div className={styles.sectionHeader}>
            <h3>Últimas Facturas</h3>
            <button className={styles.actionBtn}>Facturación Masiva</button>
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>N° Factura</th>
                  <th>Estudiante</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {facturas.map((fac) => (
                  <tr key={fac.id}>
                    <td>{fac.numero_factura}</td>
                    <td>{fac.estudiante?.primer_nombre} {fac.estudiante?.primer_apellido}</td>
                    <td className={styles.amount}>${fac.total?.toLocaleString()}</td>
                    <td>
                      <span className={`${styles.badge} ${styles[fac.estado?.toLowerCase()]}`}>
                        {fac.estado}
                      </span>
                    </td>
                    <td>
                      <button className={styles.payBtn}>Pagar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
