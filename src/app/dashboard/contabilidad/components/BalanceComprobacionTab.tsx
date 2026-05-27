"use client";

import React, { useState } from "react";
import styles from "../Contabilidad.module.css";
import { ContabilidadService } from "@/services/contabilidad.service";

interface BalanceComprobacionTabProps {
  balance: any;
  fechaDesde: string;
  setFechaDesde: (val: string) => void;
  fechaHasta: string;
  setFechaHasta: (val: string) => void;
  loadBalance: () => void;
}

export default function BalanceComprobacionTab({
  balance,
  fechaDesde,
  setFechaDesde,
  fechaHasta,
  setFechaHasta,
  loadBalance
}: BalanceComprobacionTabProps) {
  const [selectedCuenta, setSelectedCuenta] = useState<any>(null);
  const [movimientosCuenta, setMovimientosCuenta] = useState<any[]>([]);
  const [loadingDetalles, setLoadingDetalles] = useState(false);

  const handleRowClick = async (cuenta: any) => {
    setSelectedCuenta(cuenta);
    setLoadingDetalles(true);
    try {
      const data = await ContabilidadService.getMovimientos(fechaDesde, fechaHasta, cuenta.id);
      setMovimientosCuenta(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error cargando detalles de cuenta:", err);
      alert("Error al cargar movimientos de la cuenta");
    }
    setLoadingDetalles(false);
  };

  const closeModal = () => {
    setSelectedCuenta(null);
    setMovimientosCuenta([]);
  };

  const formatReferencia = (mov: any) => {
    if (mov.factura) return `FAC-${mov.factura.numero_factura}`;
    if (mov.pago) return `PAG-${mov.pago.id.substring(0,8)}`;
    if (mov.nomina) return `NOM-${mov.nomina.periodo_mes}/${mov.nomina.periodo_anio}`;
    
    const refMatch = mov.descripcion?.match(/\(Ref:\s*([a-zA-Z0-9-]+)\)/);
    if (refMatch && refMatch[1]) {
      return `CAJA-${refMatch[1].substring(0,8)}`;
    }
    
    return 'MANUAL';
  };

  const cleanDescripcion = (desc: string) => {
    if (!desc) return "";
    return desc.replace(/\(Ref:\s*[a-zA-Z0-9-]+\)/, '').trim();
  };

  return (
    <div className={styles.card}>
      <h3 className={styles.cardTitle}>Balance de Comprobación</h3>
      <div
        style={{
          marginBottom: "1.5rem",
          display: "flex",
          gap: "1rem",
          alignItems: "center",
          background: "#ffffff",
          padding: "1rem",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
        }}
      >
        <span style={{ fontWeight: 600, color: "#475569", fontSize: "0.9rem" }}>Periodo:</span>
        <input
          type="date"
          className={styles.filterInput}
          value={fechaDesde}
          onChange={(e) => setFechaDesde(e.target.value)}
        />
        <input
          type="date"
          className={styles.filterInput}
          value={fechaHasta}
          onChange={(e) => setFechaHasta(e.target.value)}
        />
        <button onClick={loadBalance} className={styles.btnFilter}>
          Generar
        </button>
      </div>
      {balance && (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Código</th>
                <th>Cuenta</th>
                <th style={{ textAlign: "right" }}>Débito</th>
                <th style={{ textAlign: "right" }}>Crédito</th>
                <th style={{ textAlign: "right" }}>Saldo</th>
              </tr>
            </thead>
            <tbody>
              {balance.cuentas?.map((c: any) => (
                <tr 
                  key={c.id} 
                  onClick={() => c.codigo.length >= 4 ? handleRowClick(c) : null}
                  className={c.codigo.length >= 4 ? styles.rowClickable : styles.rowGroup}
                  title={c.codigo.length >= 4 ? "Haga clic para ver el Libro Mayor completo de esta cuenta" : "Las cuentas principales solo agrupan los saldos"}
                >
                  <td className={styles.mono} style={{ fontWeight: c.codigo.length < 4 ? "bold" : "normal" }}>{c.codigo}</td>
                  <td style={{ 
                    fontWeight: c.codigo.length < 4 ? "bold" : "normal",
                    paddingLeft: c.codigo.length >= 4 ? "1.5rem" : "0.5rem",
                    color: c.codigo.length < 4 ? "#1e293b" : "#475569"
                  }}>
                    <span className={c.codigo.length >= 4 ? styles.clickableText : ''}>
                      {c.nombre}
                    </span>
                  </td>
                  <td className={`${styles.amount} ${styles.amountDebe}`}>
                    ${Number(c.debe || 0).toLocaleString('es-CO')}
                  </td>
                  <td className={`${styles.amount} ${styles.amountHaber}`}>
                    ${Number(c.haber || 0).toLocaleString('es-CO')}
                  </td>
                  <td className={styles.amount} style={{ fontWeight: "bold", color: Number(c.saldo) >= 0 ? "#10b981" : "#ef4444" }}>
                    ${Math.abs(Number(c.saldo || 0)).toLocaleString('es-CO')}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2}>TOTALES SUMAS IGUALES</td>
                <td className={`${styles.amount} ${styles.amountDebe}`}>
                  ${Number(balance.totales?.debe || 0).toLocaleString('es-CO')}
                </td>
                <td className={`${styles.amount} ${styles.amountHaber}`}>
                  ${Number(balance.totales?.haber || 0).toLocaleString('es-CO')}
                </td>
                <td className={styles.amount}>
                  ${(Math.abs(Number(balance.totales?.debe || 0) - Number(balance.totales?.haber || 0))).toLocaleString('es-CO')}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Modal Libro Mayor */}
      {selectedCuenta && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <h3 className={styles.modalTitle}>
              Libro Mayor: {selectedCuenta.codigo} - {selectedCuenta.nombre}
            </h3>
            {loadingDetalles ? (
              <p>Cargando movimientos...</p>
            ) : (
              <div className={styles.tableContainer} style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Concepto</th>
                      <th>Ref/Comprobante</th>
                      <th style={{ textAlign: "right" }}>Débito</th>
                      <th style={{ textAlign: "right" }}>Crédito</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movimientosCuenta.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center' }}>No hay movimientos en este periodo</td>
                      </tr>
                    ) : (
                      movimientosCuenta.map((mov: any) => (
                        <tr key={mov.id}>
                          <td>{new Date(mov.fecha).toLocaleDateString('es-CO')}</td>
                          <td>{cleanDescripcion(mov.descripcion)}</td>
                          <td className={styles.mono}>
                            {formatReferencia(mov)}
                          </td>
                          <td className={`${styles.amount} ${styles.amountDebe}`}>
                            {Number(mov.debe) > 0 ? `$${Number(mov.debe).toLocaleString('es-CO')}` : '-'}
                          </td>
                          <td className={`${styles.amount} ${styles.amountHaber}`}>
                            {Number(mov.haber) > 0 ? `$${Number(mov.haber).toLocaleString('es-CO')}` : '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3} style={{ fontWeight: 'bold', textAlign: 'right' }}>Total Movimientos:</td>
                      <td className={`${styles.amount} ${styles.amountDebe}`}>
                        ${movimientosCuenta.reduce((s, m) => s + Number(m.debe || 0), 0).toLocaleString('es-CO')}
                      </td>
                      <td className={`${styles.amount} ${styles.amountHaber}`}>
                        ${movimientosCuenta.reduce((s, m) => s + Number(m.haber || 0), 0).toLocaleString('es-CO')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
            <div className={styles.modalActions}>
              <button onClick={closeModal} className={styles.btnCancel}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
