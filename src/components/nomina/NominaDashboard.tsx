'use client';

import React, { useEffect, useState } from 'react';
import { getAuthToken } from '@/utils/auth';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/utils/api';
import styles from './NominaDashboard.module.css';

export const NominaDashboard = () => {
  const router = useRouter();
  const [nominas, setNominas] = useState<any[]>([]);
  const [resumen, setResumen] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedNomina, setSelectedNomina] = useState<any>(null);
  const [showDetalle, setShowDetalle] = useState(false);

  // Filtros por defecto periodo actual
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = getAuthToken();
        const [resNom, resRes] = await Promise.all([
          fetch(`${API_URL}/nomina/listado?mes=${currentMonth}&anio=${currentYear}`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_URL}/nomina/resumen/${currentMonth}/${currentYear}`, { headers: { 'Authorization': `Bearer ${token}` } })
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

  const goToEmpleados = () => {
    router.push('/dashboard/empleados');
  };

  const liquidarMasiva = async () => {
    if (!confirm('¿Está seguro de liquidar la nómina masiva para el período actual?')) return;

    setSaving(true);
    try {
      const token = getAuthToken();
      const res = await fetch('${API_URL}/nomina/liquidar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ mes: currentMonth, anio: currentYear })
      });

      if (!res.ok) throw new Error('Error al liquidar nómina');

      alert('Nómina liquidada correctamente');
      // Recargar datos
      window.location.reload();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const viewDetalle = (nomina: any) => {
    setSelectedNomina(nomina);
    setShowDetalle(true);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Gestión de Nómina</h1>
          <p>Periodo actual: {currentMonth}/{currentYear}</p>
        </div>
        <div className={styles.actions}>
          <button className={styles.secondaryBtn} onClick={goToEmpleados}>Ver Empleados</button>
          <button className={styles.primaryBtn} onClick={liquidarMasiva} disabled={saving}>
            {saving ? 'Liquidando...' : 'Liquidar Nómina Masiva'}
          </button>
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
                      <button className={styles.viewBtn} onClick={() => viewDetalle(nom)}>Detalle</button>
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
