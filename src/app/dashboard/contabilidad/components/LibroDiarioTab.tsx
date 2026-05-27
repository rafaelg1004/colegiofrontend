"use client";

import React from "react";
import styles from "../Contabilidad.module.css";

interface CuentaContable {
  id: string;
  codigo: string;
  nombre: string;
  tipo: string;
  naturaleza: string;
}

interface MovimientoContable {
  id: string;
  fecha: string;
  descripcion: string;
  cuenta?: { codigo: string; nombre: string; tipo: string };
  debe: number;
  haber: number;
}

interface LibroDiarioTabProps {
  cuentas: CuentaContable[];
  formMovimiento: { cuenta_contable_id: string; descripcion: string; debe: number; haber: number };
  setFormMovimiento: (val: any) => void;
  movimientos: MovimientoContable[];
  fechaDesde: string;
  setFechaDesde: (val: string) => void;
  fechaHasta: string;
  setFechaHasta: (val: string) => void;
  loadMovimientos: () => void;
  loading: boolean;
  handleSaveMovimiento: () => void;
}

export default function LibroDiarioTab({
  cuentas,
  formMovimiento,
  setFormMovimiento,
  movimientos,
  fechaDesde,
  setFechaDesde,
  fechaHasta,
  setFechaHasta,
  loadMovimientos,
  loading,
  handleSaveMovimiento
}: LibroDiarioTabProps) {

  const formatReferencia = (mov: any) => {
    if (mov.factura) return `FAC-${mov.factura.numero_factura}`;
    if (mov.pago) return `PAG-${mov.pago.id.substring(0,8)}`;
    if (mov.nomina) return `NOM-${mov.nomina.periodo_mes}/${mov.nomina.periodo_anio}`;
    
    const facMatch = mov.descripcion?.match(/(FAC-\d+)/);
    if (facMatch && facMatch[1]) return facMatch[1];

    const recMatch = mov.descripcion?.match(/(REC-\d{4}-\d+)/);
    if (recMatch && recMatch[1]) return recMatch[1];

    const refMatch = mov.descripcion?.match(/\(Ref:\s*([a-zA-Z0-9-]+)\)/);
    if (refMatch && refMatch[1]) {
      return `CAJA-${refMatch[1].substring(0,8)}`;
    }
    
    return '-';
  };

  const cleanDescripcion = (desc: string) => {
    if (!desc) return "";
    return desc.replace(/\(Ref:\s*[a-zA-Z0-9-]+\)/, '').trim();
  };

  return (
    <div className={styles.card}>
      <h3 className={styles.cardTitle}>Registro de Movimientos</h3>
      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label>Cuenta *</label>
          <select
            value={formMovimiento.cuenta_contable_id}
            onChange={(e) =>
              setFormMovimiento({
                ...formMovimiento,
                cuenta_contable_id: e.target.value,
              })
            }
          >
            <option value="">Seleccionar cuenta</option>
            {cuentas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.codigo} - {c.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.formGroup}>
          <label>Descripción *</label>
          <input
            placeholder="Descripción del movimiento"
            value={formMovimiento.descripcion}
            onChange={(e) =>
              setFormMovimiento({
                ...formMovimiento,
                descripcion: e.target.value,
              })
            }
          />
        </div>
        <div className={styles.formGroup}>
          <label>Débito</label>
          <input
            type="number"
            placeholder="0"
            value={formMovimiento.debe || ""}
            onChange={(e) =>
              setFormMovimiento({
                ...formMovimiento,
                debe: parseFloat(e.target.value) || 0,
              })
            }
          />
        </div>
        <div className={styles.formGroup}>
          <label>Crédito</label>
          <input
            type="number"
            placeholder="0"
            value={formMovimiento.haber || ""}
            onChange={(e) =>
              setFormMovimiento({
                ...formMovimiento,
                haber: parseFloat(e.target.value) || 0,
              })
            }
          />
        </div>
        <div>
          <button
            onClick={handleSaveMovimiento}
            disabled={loading}
            className={styles.btnPrimary}
          >
            Registrar
          </button>
        </div>
      </div>

      <div
        style={{
          marginTop: "1.5rem",
          display: "flex",
          gap: "1rem",
          alignItems: "center",
          background: "#ffffff",
          padding: "1rem",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
        }}
      >
        <span style={{ fontWeight: 600, color: "#475569", fontSize: "0.9rem" }}>Filtros:</span>
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
        <button onClick={loadMovimientos} className={styles.btnFilter}>
          Filtrar
        </button>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Descripción</th>
              <th>Ref/Comp.</th>
              <th>Cuenta</th>
              <th style={{ textAlign: "right" }}>Débito</th>
              <th style={{ textAlign: "right" }}>Crédito</th>
            </tr>
          </thead>
          <tbody>
            {movimientos.map((mov) => (
              <tr key={mov.id}>
                <td>{new Date(mov.fecha).toLocaleDateString('es-CO')}</td>
                <td>{cleanDescripcion(mov.descripcion)}</td>
                <td className={styles.mono}>{formatReferencia(mov)}</td>
                <td>
                  {mov.cuenta?.codigo} - {mov.cuenta?.nombre}
                </td>
                <td className={`${styles.amount} ${styles.amountDebe}`}>
                  ${Number(mov.debe || 0).toLocaleString('es-CO')}
                </td>
                <td className={`${styles.amount} ${styles.amountHaber}`}>
                  ${Number(mov.haber || 0).toLocaleString('es-CO')}
                </td>
              </tr>
            ))}
            {movimientos.length === 0 && (
              <tr>
                <td colSpan={5} className={styles.empty}>
                  No hay movimientos
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
