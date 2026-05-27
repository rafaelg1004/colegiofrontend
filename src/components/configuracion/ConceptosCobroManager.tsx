"use client";

import { useState } from "react";

import styles from "./Configuracion.module.css";

interface ConceptoCobro {
  id: string;
  nombre: string;
  valor: number;
  periodicidad: string;
  aplica_iva: boolean;
  porcentaje_iva: number;
  activo: boolean;
  afecta_inventario: boolean;
  es_compuesto: boolean;
  categoria_inventario_id?: string;
  categoria_inventario?: { id: string; nombre: string };
  cuenta_debito_id?: string;
  cuenta_credito_id?: string;
  cuenta_debito?: { codigo: string; nombre: string };
  cuenta_credito?: { codigo: string; nombre: string };
}

interface FormConceptoCobro {
  nombre: string;
  valor: number;
  periodicidad: string;
  aplica_iva: boolean;
  porcentaje_iva: number;
  afecta_inventario: boolean;
  categoria_inventario_id: string;
  cuenta_debito_id: string;
  cuenta_credito_id: string;
}

interface ConceptosCobroManagerProps {
  conceptos: ConceptoCobro[];
  formData: FormConceptoCobro;
  setFormData: (data: FormConceptoCobro) => void;
  editingId: string | null;
  onCreate: () => void;
  onUpdate: () => void;
  onDelete: (id: string) => void;
  onEdit: (concepto: ConceptoCobro) => void;
  onCancel: () => void;
  loading: boolean;
  cuentasContables?: any[];
}

export function ConceptosCobroManager({
  conceptos,
  formData,
  setFormData,
  editingId,
  onCreate,
  onUpdate,
  onDelete,
  onEdit,
  onCancel,
  loading,
  cuentasContables = [],
}: ConceptosCobroManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenCreate = () => {
    onCancel();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (concepto: ConceptoCobro) => {
    onEdit(concepto);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    onCancel();
    setIsModalOpen(false);
  };

  const handleSubmit = () => {
    if (editingId) onUpdate();
    else onCreate();
    // En un flujo real, se debería esperar la respuesta. 
    // Por simplicidad, se cierra después de un pequeño retraso o se asume éxito si no hay error.
    setTimeout(() => setIsModalOpen(false), 500);
  };

  return (
    <div className={styles.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h3 className={styles.cardTitle} style={{ margin: 0 }}>
          Conceptos de Cobro Registrados
        </h3>
        <button className={styles.btnPrimary} onClick={handleOpenCreate}>
          + Nuevo Concepto
        </button>
      </div>

      <p
        style={{
          color: "#666",
          marginBottom: "1rem",
          fontSize: "0.9rem",
        }}
      >
        💡 Los conceptos con inventario (📦) se crean automáticamente desde el
        módulo de Inventario.
      </p>

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.cardTitle} style={{ margin: 0 }}>
                {editingId ? "Editar Concepto de Cobro" : "Crear Concepto de Cobro"}
              </h3>
              <button className={styles.closeBtn} onClick={handleClose}>
                &times;
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.formGridColumns}>
        <div className={styles.formGroup}>
          <label>Nombre *</label>
          <input
            type="text"
            value={formData.nombre}
            onChange={(e) =>
              setFormData({ ...formData, nombre: e.target.value })
            }
            placeholder="Ej: Matrícula, Pensión, Uniforme"
          />
        </div>
        <div className={styles.formGroup}>
          <label>Valor</label>
          <input
            type="number"
            value={formData.valor}
            onChange={(e) =>
              setFormData({
                ...formData,
                valor: parseFloat(e.target.value) || 0,
              })
            }
            placeholder="0"
          />
        </div>
        <div className={styles.formGroup}>
          <label>Periodicidad</label>
          <select
            value={formData.periodicidad}
            onChange={(e) =>
              setFormData({ ...formData, periodicidad: e.target.value })
            }
          >
            <option value="Única">Única</option>
            <option value="Mensual">Mensual</option>
            <option value="Anual">Anual</option>
          </select>
        </div>
      </div>

      <div className={styles.formGridColumns} style={{ marginTop: "1rem" }}>
        <div className={styles.formGroup}>
          <label>
            <input
              type="checkbox"
              checked={formData.aplica_iva}
              onChange={(e) =>
                setFormData({ ...formData, aplica_iva: e.target.checked })
              }
            />{" "}
            Aplica IVA
          </label>
        </div>
        {formData.aplica_iva && (
          <div className={styles.formGroup}>
            <label>% IVA</label>
            <input
              type="number"
              value={formData.porcentaje_iva}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  porcentaje_iva: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="19"
            />
          </div>
        )}
      </div>

      <div className={styles.formGridColumns} style={{ marginTop: "1rem" }}>
        <div className={styles.formGroup}>
          <label>Cuenta Débito</label>
          <select
            value={formData.cuenta_debito_id || ""}
            onChange={(e) =>
              setFormData({ ...formData, cuenta_debito_id: e.target.value })
            }
          >
            <option value="">-- No Enlazada --</option>
            {cuentasContables.map((c) => (
              <option key={c.id} value={c.id}>
                {c.codigo} - {c.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.formGroup}>
          <label>Cuenta Crédito</label>
          <select
            value={formData.cuenta_credito_id || ""}
            onChange={(e) =>
              setFormData({ ...formData, cuenta_credito_id: e.target.value })
            }
          >
            <option value="">-- No Enlazada --</option>
            {cuentasContables.map((c) => (
              <option key={c.id} value={c.id}>
                {c.codigo} - {c.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

              <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                <button onClick={handleClose} className={styles.btnSecondary} disabled={loading}>
                  Cancelar
                </button>
                <button onClick={handleSubmit} className={styles.btnPrimary} disabled={loading}>
                  {loading ? "Guardando..." : (editingId ? "Actualizar" : "Crear Concepto")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Valor</th>
              <th>Periodicidad</th>
              <th>IVA</th>
              <th>Enlace Contable</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {conceptos.map((concepto) => (
              <tr key={concepto.id}>
                <td>{concepto.nombre}</td>
                <td>${concepto.valor?.toLocaleString() || 0}</td>
                <td>{concepto.periodicidad}</td>
                <td>
                  {concepto.aplica_iva ? `${concepto.porcentaje_iva}%` : "No"}
                </td>
                <td>
                  <div style={{ fontSize: '0.85rem' }}>
                    <div><strong>Débito:</strong> {concepto.cuenta_debito?.codigo || "---"}</div>
                    <div><strong>Crédito:</strong> {concepto.cuenta_credito?.codigo || "---"}</div>
                  </div>
                </td>
                <td>
                  <button
                    onClick={() => handleOpenEdit(concepto)}
                    className={styles.btnSecondary}
                    style={{ marginRight: "0.5rem" }}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => onDelete(concepto.id)}
                    className={styles.btnDanger}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {conceptos.length === 0 && (
              <tr>
                <td colSpan={6} className={styles.empty}>
                  No hay conceptos de cobro registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
