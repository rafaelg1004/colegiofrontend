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

interface PlanCuentasTabProps {
  cuentas: CuentaContable[];
  formCuenta: { codigo: string; nombre: string; tipo: string; naturaleza: string };
  setFormCuenta: (val: any) => void;
  tipos: string[];
  naturalezas: string[];
  tipoFiltro: string;
  setTipoFiltro: (val: string) => void;
  loadCuentas: () => void;
  loading: boolean;
  handleSaveCuenta: () => void;
  handleDeleteCuenta: (id: string) => void;
  crearCuentasIniciales: () => void;
}

export default function PlanCuentasTab({
  cuentas,
  formCuenta,
  setFormCuenta,
  tipos,
  naturalezas,
  tipoFiltro,
  setTipoFiltro,
  loadCuentas,
  loading,
  handleSaveCuenta,
  handleDeleteCuenta,
  crearCuentasIniciales
}: PlanCuentasTabProps) {
  return (
    <div className={styles.card}>
      <h3 className={styles.cardTitle}>Plan de Cuentas (PUC)</h3>
      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label>Código *</label>
          <input
            placeholder="Código de cuenta"
            value={formCuenta.codigo}
            onChange={(e) =>
              setFormCuenta({ ...formCuenta, codigo: e.target.value })
            }
          />
        </div>
        <div className={styles.formGroup}>
          <label>Nombre *</label>
          <input
            placeholder="Nombre de cuenta"
            value={formCuenta.nombre}
            onChange={(e) =>
              setFormCuenta({ ...formCuenta, nombre: e.target.value })
            }
          />
        </div>
        <div className={styles.formGroup}>
          <label>Tipo *</label>
          <select
            value={formCuenta.tipo}
            onChange={(e) =>
              setFormCuenta({ ...formCuenta, tipo: e.target.value })
            }
          >
            <option value="">Seleccionar tipo</option>
            {tipos.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.formGroup}>
          <label>Naturaleza *</label>
          <select
            value={formCuenta.naturaleza}
            onChange={(e) =>
              setFormCuenta({ ...formCuenta, naturaleza: e.target.value })
            }
          >
            <option value="">Seleccionar naturaleza</option>
            {naturalezas.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div>
          <button
            onClick={handleSaveCuenta}
            disabled={loading}
            className={styles.btnPrimary}
          >
            Agregar
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
        <select
          className={styles.filterInput}
          value={tipoFiltro}
          onChange={(e) => {
            setTipoFiltro(e.target.value);
            loadCuentas();
          }}
        >
          <option value="">Todos los tipos</option>
          {tipos.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <button
          onClick={crearCuentasIniciales}
          disabled={loading}
          style={{
            padding: "0.5rem 1rem",
            background: "#6366f1",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Crear Plan de Cuentas
        </button>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Naturaleza</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cuentas.map((cuenta) => (
              <tr key={cuenta.id}>
                <td className={styles.mono}>{cuenta.codigo}</td>
                <td>{cuenta.nombre}</td>
                <td>{cuenta.tipo}</td>
                <td>{cuenta.naturaleza}</td>
                <td>
                  <button
                    onClick={() => handleDeleteCuenta(cuenta.id)}
                    className={styles.btnDanger}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {cuentas.length === 0 && (
              <tr>
                <td colSpan={5} className={styles.empty}>
                  No hay cuentas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
