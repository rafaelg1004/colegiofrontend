"use client";

import styles from "../ConfiguracionAcademica.module.css";
import type { TipoActividad } from "../types";

interface TiposActividadTabProps {
  tiposActividad: TipoActividad[];
  onDelete: (id: string, name: string) => void;
}

export const TiposActividadTab = ({ tiposActividad, onDelete }: TiposActividadTabProps) => {
  if (tiposActividad.length === 0) {
    return <div className={styles.empty}>No hay tipos de actividad registrados</div>;
  }

  return (
    <div className={styles.dataGrid}>
      {tiposActividad.map((tipo) => (
        <div key={tipo.id} className={styles.card}>
          <div className={styles.cardIcon}>📝</div>
          <div className={styles.cardInfo}>
            <h3>{tipo.nombre}</h3>
            <div className={styles.cardActions}>
              <button
                className={styles.deleteCardBtn}
                onClick={() => onDelete(tipo.id, tipo.nombre)}
              >
                🗑️ Eliminar
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
