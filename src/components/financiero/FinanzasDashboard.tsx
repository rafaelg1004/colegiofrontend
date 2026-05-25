"use client";

import React, { useEffect, useState } from "react";
import { getAuthToken } from "@/utils/auth";
import { API_URL } from "@/utils/api";
import styles from "./FinanzasDashboard.module.css";

const formatMoney = (val: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(val || 0);

export const FinanzasDashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [deudores, setDeudores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedFactura, setSelectedFactura] = useState<any>(null);
  const [showPagar, setShowPagar] = useState(false);
  const [showFacturacion, setShowFacturacion] = useState(false);
  const [showConfirmacionExtra, setShowConfirmacionExtra] = useState(false);
  const [opcionesFacturacion, setOpcionesFacturacion] = useState<any[]>([]);
  const [idSeleccionado, setIdSeleccionado] = useState<string>("");
  const [tipoSeleccionado, setTipoSeleccionado] = useState<'articulo' | 'concepto'>('articulo');
  const [formData, setFormData] = useState<any>({});
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const [resStats, resDeudores] = await Promise.all([
        fetch(`${API_URL}/financiero/resumen`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/financiero/deudores`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setStats(await resStats.json());
      const dataDeudores = await resDeudores.json();
      setDeudores(dataDeudores.deudores || []);

      // Cargar solo servicios para facturación masiva
      const resArticulos = await fetch(`${API_URL}/inventario/articulos`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      const dataArt = await resArticulos.json();
      
      // Filtrar solo los que son servicios (es_servicio: true)
      const opciones = (dataArt || [])
        .filter((a: any) => a.es_servicio === true)
        .map((a: any) => ({ id: a.id, nombre: String(a.nombre || ''), tipo: 'articulo' }));

      setOpcionesFacturacion(opciones);

      // Pre-seleccionar pensión si existe
      const pension = opciones.find((o: any) => o.nombre.toLowerCase().includes('pension') || o.nombre.toLowerCase().includes('pensión'));
      if (pension) {
        setIdSeleccionado(pension.id);
        setTipoSeleccionado('articulo');
      } else if (opciones.length > 0) {
        setIdSeleccionado(opciones[0].id);
        setTipoSeleccionado('articulo');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFacturacionMasiva = () => {
    setShowFacturacion(true);
  };

  const handleConfirmarFacturacion = () => {
    if (!idSeleccionado) {
      setAlertMessage('Por favor selecciona un concepto');
      return;
    }
    // Abrir el modal secundario de confirmación
    setShowConfirmacionExtra(true);
  };

  const ejecutarFacturacionMasiva = async () => {

    const mes = new Date().getMonth() + 1;
    const anio = new Date().getFullYear();

    setSaving(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/financiero/generar-pensiones`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mes,
          anio,
          articulo_id: tipoSeleccionado === 'articulo' ? idSeleccionado : undefined,
          concepto_cobro_id: tipoSeleccionado === 'concepto' ? idSeleccionado : undefined,
        }),
      });

      if (!res.ok) throw new Error("Error al generar facturas");

      const data = await res.json();
      setAlertMessage(`Proceso completado. ${data.generadas} facturas nuevas generadas.`);
      setShowConfirmacionExtra(false);
      setShowFacturacion(false);
      fetchData(); // Recargar datos
    } catch (err: any) {
      setAlertMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePagar = (factura: any) => {
    setSelectedFactura(factura);
    setFormData({
      monto: factura.total - (factura.monto_pagado || 0),
      metodo_pago: "Efectivo",
      observacion: "",
    });
    setShowPagar(true);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const value =
      e.target.type === "number" ? parseFloat(e.target.value) : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const submitPago = async () => {
    setSaving(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/financiero/pagos`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          factura_id: selectedFactura.id,
          monto: formData.monto,
          metodo_pago: formData.metodo_pago,
          observacion: formData.observacion,
        }),
      });

      if (!res.ok) throw new Error("Error al registrar pago");

      setAlertMessage("Pago registrado correctamente");
      setShowPagar(false);
      window.location.reload();
    } catch (err: any) {
      setAlertMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return <div className={styles.loading}>Cargando datos financieros...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Gestión Financiera</h1>
        <p>Resumen de facturación, recaudos y deudores</p>
      </header>

      {stats && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Total Facturado</span>
            <span className={styles.statValue}>
              {formatMoney(stats.total_facturado)}
            </span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Total Recaudado</span>
            <span className={styles.statValue + " " + styles.collected}>
              {formatMoney(stats.total_recaudado)}
            </span>
            <div className={styles.progress}>
              <div
                className={styles.bar}
                style={{ width: `${stats.porcentaje_recaudo}%` }}
              ></div>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Pendiente por Cobrar</span>
            <span className={styles.statValue + " " + styles.pending}>
              {formatMoney(stats.total_pendiente)}
            </span>
          </div>
        </div>
      )}

      <div className={styles.mainGrid}>
        <div className={styles.tableSection}>
          <div className={styles.sectionHeader}>
            <h3>Estudiantes en Mora / Deudores (Mes Actual)</h3>
            <button
              className={styles.actionBtn}
              onClick={handleFacturacionMasiva}
              disabled={saving}
            >
              {saving ? 'Generando...' : 'Facturación Masiva Pensión'}
            </button>
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>N° Factura</th>
                  <th>Estudiante</th>
                  <th>Grado</th>
                  <th>Concepto</th>
                  <th>Deuda</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {deudores.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                      No hay deudores pendientes para este mes.
                    </td>
                  </tr>
                ) : (
                  deudores.map((deudor) => (
                    <tr key={deudor.factura_id}>
                      <td>{deudor.numero_factura}</td>
                      <td>{deudor.estudiante_nombre}</td>
                      <td>{deudor.grado}</td>
                      <td style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>{deudor.concepto}</td>
                      <td className={styles.amount}>
                        {formatMoney(deudor.deuda)}
                      </td>
                      <td>
                        <span className={`${styles.badge} ${deudor.estado === 'Emitida' ? styles.pendiente : styles.pagada}`}>
                          {deudor.estado === 'Emitida' ? 'Pendiente' : deudor.estado}
                        </span>
                      </td>
                      <td>
                        {deudor.estado === 'Emitida' && (
                          <button 
                            className={styles.payBtn}
                            onClick={() => window.location.href = `/dashboard/caja?estudianteId=${deudor.estudiante_id}&facturaId=${deudor.factura_id}`}
                          >
                            Pagar 💸
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showFacturacion && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Facturación Masiva</h2>
            </div>
            <div className={styles.modalBody}>
              <div style={{ 
                background: '#fff1f2', 
                border: '2px solid #ef4444', 
                padding: '1.5rem', 
                borderRadius: '16px',
                marginBottom: '1.5rem',
                display: 'flex',
                gap: '1rem',
                alignItems: 'center',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}>
                <span style={{ fontSize: '2.5rem' }}>⚠️</span>
                <div>
                  <strong style={{ color: '#991b1b', display: 'block', marginBottom: '0.25rem', fontSize: '1.1rem' }}>¡ATENCIÓN! OPERACIÓN MASIVA</strong>
                  <p style={{ color: '#b91c1c', fontSize: '0.95rem', margin: 0, fontWeight: 500 }}>
                    Se generarán facturas para <strong>TODOS</strong> los estudiantes activos. 
                    Verifica bien el servicio y el mes antes de continuar.
                  </p>
                </div>
              </div>

              <p style={{ marginBottom: '1rem', fontWeight: 600, color: '#0f172a' }}>
                Selecciona el concepto de cobro:
              </p>
              
              <div className={styles.formGroup}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Servicio / Concepto</label>
                <select 
                  value={`${tipoSeleccionado}:${idSeleccionado}`}
                  onChange={(e) => {
                    const [tipo, id] = e.target.value.split(':');
                    setTipoSeleccionado(tipo as any);
                    setIdSeleccionado(id);
                  }}
                  className={styles.modalSelect}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    borderRadius: '10px', 
                    border: '1px solid #e2e8f0',
                    fontSize: '1rem'
                  }}
                >
                  <option value="">Seleccionar...</option>
                  {opcionesFacturacion.map(opt => (
                    <option key={`${opt.tipo}:${opt.id}`} value={`${opt.tipo}:${opt.id}`}>
                      {opt.nombre} ({opt.tipo === 'articulo' ? 'Servicio' : 'Concepto'})
                    </option>
                  ))}
                </select>
              </div>

              <p style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: '#94a3b8' }}>
                * El sistema generará una factura pendiente para cada estudiante activo.
                Se omitirán estudiantes que ya tengan este cobro registrado en el mes.
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.btnSecondary} 
                onClick={() => setShowFacturacion(false)}
                disabled={saving}
              >
                Cancelar
              </button>
              <button 
                className={styles.btnPrimary} 
                onClick={handleConfirmarFacturacion}
                disabled={saving}
              >
                {saving ? "Generando..." : "Confirmar y Generar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Extra de Confirmación */}
      {showConfirmacionExtra && (
        <div className={styles.modalOverlay} style={{ zIndex: 1100 }}>
          <div className={styles.modalContent} style={{ maxWidth: '400px' }}>
            <div className={styles.modalHeader} style={{ background: '#fee2e2' }}>
              <h2 style={{ color: '#991b1b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>❓</span> Confirmación Final
              </h2>
            </div>
            <div className={styles.modalBody}>
              <p style={{ fontSize: '1.1rem', color: '#1e293b', fontWeight: 500, textAlign: 'center' }}>
                ¿Estás absolutamente seguro de que deseas generar las facturas masivas?
              </p>
              <p style={{ color: '#64748b', fontSize: '0.9rem', textAlign: 'center', marginTop: '1rem' }}>
                Esta acción creará un registro de deuda para cada estudiante activo y no se puede deshacer de forma automática.
              </p>
            </div>
            <div className={styles.modalFooter} style={{ justifyContent: 'center' }}>
              <button 
                className={styles.btnSecondary} 
                onClick={() => setShowConfirmacionExtra(false)}
                disabled={saving}
              >
                No, cancelar
              </button>
              <button 
                className={styles.btnPrimary} 
                style={{ background: '#dc2626' }}
                onClick={ejecutarFacturacionMasiva}
                disabled={saving}
              >
                {saving ? "Generando..." : "Sí, generar ahora"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {alertMessage && (
        <div className={styles.modalOverlay} style={{ zIndex: 1200 }}>
          <div className={styles.modalContent} style={{ maxWidth: '400px' }}>
            <div className={styles.modalHeader}>
              <h2>Notificación</h2>
            </div>
            <div className={styles.modalBody}>
              <p style={{ fontSize: '1.1rem', color: '#1e293b', textAlign: 'center' }}>
                {alertMessage}
              </p>
            </div>
            <div className={styles.modalFooter} style={{ justifyContent: 'center' }}>
              <button 
                className={styles.btnPrimary} 
                onClick={() => setAlertMessage(null)}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
