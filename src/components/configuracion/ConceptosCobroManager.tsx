"use client";

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
}

interface FormConceptoCobro {
  nombre: string;
  valor: number;
  periodicidad: string;
  aplica_iva: boolean;
  porcentaje_iva: number;
  afecta_inventario: boolean;
  categoria_inventario_id: string;
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
}: ConceptosCobroManagerProps) {
  return (
    <div className={styles.card}>
      <h3 className={styles.cardTitle}>
        {editingId ? "Editar Concepto de Cobro" : "Crear Concepto de Cobro"}
      </h3>
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

      <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
        {editingId ? (
          <>
            <button
              onClick={onUpdate}
              className={styles.btnPrimary}
              disabled={loading}
            >
              {loading ? "Guardando..." : "Actualizar Concepto"}
            </button>
            <button onClick={onCancel} className={styles.btnSecondary}>
              Cancelar
            </button>
          </>
        ) : (
          <button
            onClick={onCreate}
            className={styles.btnPrimary}
            disabled={loading}
          >
            {loading ? "Creando..." : "Crear Concepto"}
          </button>
        )}
      </div>

      <h3 className={styles.cardTitle} style={{ marginTop: "2rem" }}>
        Conceptos de Cobro Registrados
      </h3>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Valor</th>
              <th>Periodicidad</th>
              <th>IVA</th>
              <th>Inventario</th>
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
                  {concepto.afecta_inventario
                    ? "📦 " + (concepto.categoria_inventario?.nombre || "Sí")
                    : "No"}
                </td>
                <td>
                  <button
                    onClick={() => onEdit(concepto)}
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
