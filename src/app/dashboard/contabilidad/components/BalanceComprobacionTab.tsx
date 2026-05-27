"use client";

import React from "react";
import styles from "../Contabilidad.module.css";

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
                <tr key={c.id}>
                  <td className={styles.mono}>{c.codigo}</td>
                  <td>{c.nombre}</td>
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
    </div>
  );
}
