'use client';

import React, { useEffect, useState } from 'react';
import { getAuthToken } from '@/utils/auth';
import styles from './NominaDashboard.module.css';

export const NominaDashboard = () => {
  const [nominas, setNominas] = useState<any[]>([]);
  const [resumen, setResumen] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filtros por defecto periodo actual
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = getAuthToken();
        const [resNom, resRes] = await Promise.all([
          fetch(`http://localhost:3005/api/v1/nomina/listado?mes=${currentMonth}&anio=${currentYear}`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`http://localhost:3005/api/v1/nomina/resumen/${currentMonth}/${currentYear}`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        const nominasData = await resNom.json();
        const resumenData = await resRes.json();

        setNominas(Array.isArray(nominasData) ? nominasData : []);
        setResumen(resumenData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Gestión de Nómina</h1>
          <p>Periodo actual: {currentMonth}/{currentYear}</p>
        </div>
        <div className={styles.actions}>
          <button className={styles.secondaryBtn}>Ver Empleados</button>
          <button className={styles.primaryBtn}>Liquidar Nómina Masiva</button>
        </div>
      </header>

      {resumen && (
        <div className={styles.summaryGrid}>
          <div className={styles.summaryCard}>
            <span className={styles.label}>Total Neto a Pagar</span>
            <span className={styles.value}>${resumen.resumen?.total_neto_pagar?.toLocaleString()}</span>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.label}>Empleados Liquidados</span>
            <span className={styles.value}>{resumen.total_empleados}</span>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.label}>Costo Total Empresa</span>
            <span className={styles.value}>${resumen.costo_total_empresa?.toLocaleString()}</span>
          </div>
        </div>
      )}

      <div className={styles.tableSection}>
        <div className={styles.tableHeader}>
          <h3>Listado de Pagos</h3>
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Empleado</th>
                <th>Cargo</th>
                <th>Salario Base</th>
                <th>Neto a Pagar</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {nominas.length > 0 ? (
                nominas.map((nom) => (
                  <tr key={nom.id}>
                    <td className={styles.empName}>
                      {nom.empleado?.primer_nombre} {nom.empleado?.primer_apellido}
                    </td>
                    <td>{nom.empleado?.cargo}</td>
                    <td>${nom.salario_base?.toLocaleString()}</td>
                    <td className={styles.neto}>${nom.neto_a_pagar?.toLocaleString()}</td>
                    <td>
                      <span className={`${styles.badge} ${styles[nom.estado?.toLowerCase()]}`}>
                        {nom.estado}
                      </span>
                    </td>
                    <td>
                      <button className={styles.viewBtn}>Detalle</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className={styles.empty}>No hay nóminas liquidadas para este periodo</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
