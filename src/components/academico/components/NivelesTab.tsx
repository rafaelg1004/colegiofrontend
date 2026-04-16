"use client";

import styles from "../ConfiguracionAcademica.module.css";
import type { Nivel } from "../types";

interface NivelesTabProps {
  niveles: Nivel[];
  onEdit: (nivel: Nivel) => void;
  onDelete: (id: string, name: string) => void;
}

export const NivelesTab = ({ niveles, onEdit, onDelete }: NivelesTabProps) => {
  if (niveles.length === 0) {
    return <div className={styles.empty}>No hay niveles registrados</div>;
  }

  return (
    <div className={styles.dataGrid}>
      {niveles.map((nivel) => (
        <div key={nivel.id} className={styles.card}>
          <div className={styles.cardIcon}>🎚️</div>
          <div className={styles.cardInfo}>
            <h3>{nivel.nombre}</h3>
            <div className={styles.cardActions}>
              <button
                className={styles.deleteCardBtn}
                onClick={() => onDelete(nivel.id, nivel.nombre)}
              >
                🗑️ Eliminar
              </button>
              <button
                className={styles.editCardBtn}
                onClick={() => onEdit(nivel)}
              >
                ✏️ Editar
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
