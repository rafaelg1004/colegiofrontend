'use client';

import React, { useEffect, useState } from 'react';
import { getAuthToken } from '@/utils/auth';
import { API_URL } from '@/utils/api';
import styles from './FinanzasDashboard.module.css';

export const FinanzasDashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [facturas, setFacturas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedFactura, setSelectedFactura] = useState<any>(null);
  const [showPagar, setShowPagar] = useState(false);
  const [showFacturacion, setShowFacturacion] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = getAuthToken();
        const [resStats, resFact] = await Promise.all([
          fetch('${API_URL}/financiero/resumen', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('${API_URL}/financiero/facturas', { headers: { 'Authorization': `Bearer ${token}` } })
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

  const handleFacturacionMasiva = () => {
    setShowFacturacion(true);
  };

  const handlePagar = (factura: any) => {
    setSelectedFactura(factura);
    setFormData({
      monto: factura.total - (factura.monto_pagado || 0),
      metodo_pago: 'Efectivo',
      observacion: ''
    });
    setShowPagar(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const submitPago = async () => {
    setSaving(true);
    try {
      const token = getAuthToken();
      const res = await fetch('${API_URL}/financiero/pagos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          factura_id: selectedFactura.id,
          monto: formData.monto,
          metodo_pago: formData.metodo_pago,
          observacion: formData.observacion
        })
      });

      if (!res.ok) throw new Error('Error al registrar pago');

      alert('Pago registrado correctamente');
      setShowPagar(false);
      window.location.reload();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

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
            <button className={styles.actionBtn} onClick={handleFacturacionMasiva}>Facturación Masiva</button>
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
                      <button className={styles.payBtn} onClick={() => handlePagar(fac)}>Pagar</button>
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
