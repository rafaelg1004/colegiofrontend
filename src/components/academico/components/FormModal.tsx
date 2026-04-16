"use client";

import styles from "../ConfiguracionAcademica.module.css";
import type { ModalType } from "../types";

interface FormModalProps {
  show: boolean;
  type: ModalType;
  mode: "create" | "edit";
  formData: Record<string, unknown>;
  saving: boolean;
  institucion: { nombre?: string; id?: string } | null;
  niveles: { id: string; nombre: string }[];
  onClose: () => void;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  onSubmit: () => void;
}

export const FormModal = ({
  show,
  type,
  mode,
  formData,
  saving,
  institucion,
  niveles,
  onClose,
  onChange,
  onSubmit,
}: FormModalProps) => {
  if (!show) return null;

  const getTitle = () => {
    const prefix = mode === "edit" ? "Editar " : "Nueva ";
    switch (type) {
      case "sede":
        return prefix + "Sede";
      case "anio":
        return prefix + "Año Lectivo";
      case "periodo":
        return prefix + "Periodo";
      case "area":
        return prefix + "Área";
      case "asignatura":
        return prefix + "Asignatura";
      case "nivel":
        return prefix + "Nivel";
      case "grado":
        return prefix + "Grado";
      case "tipo-actividad":
        return prefix + "Tipo de Actividad";
      default:
        return prefix + "Elemento";
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{getTitle()}</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          {type === "sede" && (
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Institución</label>
                <input
                  value={institucion?.nombre || "Cargando..."}
                  disabled
                  className={styles.readOnlyInput}
                />
                <input
                  type="hidden"
                  name="institucion_id"
                  value={
                    (formData.institucion_id as string) || institucion?.id || ""
                  }
                />
              </div>
              <div className={styles.formGroup}>
                <label>Nombre *</label>
                <input
                  name="nombre"
                  value={(formData.nombre as string) || ""}
                  onChange={onChange}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Dirección</label>
                <input
                  name="direccion"
                  value={(formData.direccion as string) || ""}
                  onChange={onChange}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Teléfono</label>
                <input
                  name="telefono"
                  value={(formData.telefono as string) || ""}
                  onChange={onChange}
                />
              </div>
            </div>
          )}

          {type === "anio" && (
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Año *</label>
                <input
                  type="number"
                  name="anio"
                  value={(formData.anio as number) || new Date().getFullYear()}
                  onChange={onChange}
                  min="2000"
                  max="2100"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Fecha Inicio *</label>
                <input
                  type="date"
                  name="fecha_inicio"
                  value={(formData.fecha_inicio as string) || ""}
                  onChange={onChange}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Fecha Fin *</label>
                <input
                  type="date"
                  name="fecha_fin"
                  value={(formData.fecha_fin as string) || ""}
                  onChange={onChange}
                  required
                />
              </div>
              <div className={styles.formGroupCheck}>
                <label>
                  <input
                    type="checkbox"
                    name="activo"
                    checked={(formData.activo as boolean) || false}
                    onChange={onChange}
                  />
                  Año lectivo activo
                </label>
              </div>
            </div>
          )}

          {type === "periodo" && (
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Nombre *</label>
                <input
                  name="nombre"
                  value={(formData.nombre as string) || ""}
                  onChange={onChange}
                  placeholder="Ej: Primer Periodo"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Número *</label>
                <input
                  type="number"
                  name="numero"
                  value={(formData.numero as number) || ""}
                  onChange={onChange}
                  min="1"
                  max="5"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Peso (%) *</label>
                <input
                  type="number"
                  name="porcentaje_peso"
                  value={(formData.porcentaje_peso as number) || ""}
                  onChange={onChange}
                  min="0"
                  max="100"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Fecha Inicio *</label>
                <input
                  type="date"
                  name="fecha_inicio"
                  value={(formData.fecha_inicio as string) || ""}
                  onChange={onChange}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Fecha Fin *</label>
                <input
                  type="date"
                  name="fecha_fin"
                  value={(formData.fecha_fin as string) || ""}
                  onChange={onChange}
                  required
                />
              </div>
            </div>
          )}

          {(type === "area" ||
            type === "asignatura" ||
            type === "nivel" ||
            type === "tipo-actividad") && (
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>
                  Nombre {type === "area" && "del Área"}
                  {type === "asignatura" && "de la Asignatura"}
                  {type === "nivel" && "del Nivel"}
                  {type === "tipo-actividad" && "del Tipo"} *
                </label>
                <input
                  name="nombre"
                  value={(formData.nombre as string) || ""}
                  onChange={onChange}
                  required
                />
              </div>
            </div>
          )}

          {type === "grado" && (
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Nombre del Grado *</label>
                <input
                  name="nombre"
                  value={(formData.nombre as string) || ""}
                  onChange={onChange}
                  placeholder="Ej: Primero"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Código</label>
                <input
                  name="codigo"
                  value={(formData.codigo as string) || ""}
                  onChange={onChange}
                  placeholder="Ej: 1°"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Orden *</label>
                <input
                  type="number"
                  name="orden"
                  value={(formData.orden as number) || 1}
                  onChange={onChange}
                  min="1"
                  max="11"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Nivel *</label>
                <select
                  name="nivel_id"
                  value={(formData.nivel_id as string) || ""}
                  onChange={onChange}
                  required
                >
                  <option value="">Seleccionar...</option>
                  {niveles.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancelar
          </button>
          <button
            className={styles.saveBtn}
            onClick={onSubmit}
            disabled={saving}
          >
            {saving
              ? "Guardando..."
              : mode === "edit"
                ? "Guardar Cambios"
                : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
};
