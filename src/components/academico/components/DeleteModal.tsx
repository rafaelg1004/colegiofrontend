"use client";

import styles from "../ConfiguracionAcademica.module.css";

interface DeleteModalProps {
  show: boolean;
  itemName: string;
  error: string | null;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteModal = ({
  show,
  itemName,
  error,
  deleting,
  onClose,
  onConfirm,
}: DeleteModalProps) => {
  if (!show) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>⚠️ Confirmar Eliminación</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          <p>
            ¿Estás seguro de que deseas eliminar <strong>{itemName}</strong>?
          </p>
          <p className={styles.deleteWarning}>
            Esta acción no se puede deshacer.
          </p>

          {error && (
            <div className={styles.errorMessage}>{error}</div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={deleting}
          >
            Cancelar
          </button>
          <button
            className={styles.deleteBtn}
            onClick={onConfirm}
            disabled={deleting || !!error}
          >
            {deleting ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
};
