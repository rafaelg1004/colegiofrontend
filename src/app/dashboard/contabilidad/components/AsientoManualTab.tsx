"use client";

import React from "react";
import styles from "../Contabilidad.module.css";

interface AsientoManualTabProps {
  busquedaEstudiante: string;
  setBusquedaEstudiante: (val: string) => void;
  estudiantes: any[];
  buscarEstudiantes: (q: string) => void;
  estudianteSeleccionado: any;
  setEstudianteSeleccionado: (val: any) => void;
  conceptoFactura: string;
  setConceptoFactura: (val: string) => void;
  conceptosDefault: string[];
  montoFactura: number;
  setMontoFactura: (val: number) => void;
  showDropdown: boolean;
  setShowDropdown: (val: boolean) => void;
  loading: boolean;
  crearFactura: () => void;
  seleccionarEstudiante: (est: any) => void;
}

export default function AsientoManualTab({
  busquedaEstudiante,
  setBusquedaEstudiante,
  estudiantes,
  buscarEstudiantes,
  estudianteSeleccionado,
  setEstudianteSeleccionado,
  conceptoFactura,
  setConceptoFactura,
  conceptosDefault,
  montoFactura,
  setMontoFactura,
  showDropdown,
  setShowDropdown,
  loading,
  crearFactura,
  seleccionarEstudiante
}: AsientoManualTabProps) {
  return (
    <div className={styles.card}>
      <h3 className={styles.cardTitle}>Registrar Asiento Manual</h3>
      <div className={styles.formGrid}>
        <div className={styles.formGroup} style={{ gridColumn: "1 / -1" }}>
          <label>Buscar Estudiante *</label>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              placeholder="Nombre o Documento"
              value={
                estudianteSeleccionado
                  ? `${estudianteSeleccionado.primer_nombre} ${estudianteSeleccionado.primer_apellido}`
                  : busquedaEstudiante
              }
              onChange={(e) => {
                setBusquedaEstudiante(e.target.value);
                setEstudianteSeleccionado(null);
                buscarEstudiantes(e.target.value);
              }}
              onFocus={() => {
                if (estudiantes.length > 0 && !estudianteSeleccionado)
                  setShowDropdown(true);
              }}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            />
            {showDropdown && estudiantes.length > 0 && (
              <div
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  maxHeight: "200px",
                  overflow: "auto",
                  background: "white",
                  position: "absolute",
                  zIndex: 10,
                  width: "100%",
                }}
              >
                {estudiantes.map((est) => (
                  <div
                    key={est.id}
                    onClick={() => seleccionarEstudiante(est)}
                    style={{
                      padding: "10px",
                      cursor: "pointer",
                      borderBottom: "1px solid #f1f5f9",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.background = "#f8fafc")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.background = "white")
                    }
                  >
                    {est.primer_nombre} {est.primer_apellido} -{" "}
                    {est.numero_documento}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className={styles.formGroup}>
          <label>Concepto *</label>
          <select
            value={conceptoFactura}
            onChange={(e) => setConceptoFactura(e.target.value)}
          >
            <option value="">Seleccionar concepto</option>
            {conceptosDefault.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.formGroup}>
          <label>Monto *</label>
          <input
            type="number"
            placeholder="0"
            value={montoFactura || ""}
            onChange={(e) =>
              setMontoFactura(parseFloat(e.target.value) || 0)
            }
          />
        </div>
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <button
            onClick={crearFactura}
            disabled={loading}
            className={styles.btnPrimary}
          >
            {loading ? "Guardando..." : "Registrar Factura"}
          </button>
        </div>
      </div>
    </div>
  );
}
