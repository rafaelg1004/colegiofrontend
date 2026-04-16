"use client";

import styles from "../ConfiguracionAcademica.module.css";
import type { AnioLectivo } from "../types";

interface AniosTabProps {
  anios: AnioLectivo[];
  onEdit: (anio: AnioLectivo) => void;
  onDelete: (id: string, name: string) => void;
}

export const AniosTab = ({ anios, onEdit, onDelete }: AniosTabProps) => {
  if (anios.length === 0) {
    return <div className={styles.empty}>No hay años lectivos</div>;
  }

  return (
    <div className={styles.dataGrid}>
      {anios.map((anio) => (
        <div
          key={anio.id}
          className={`${styles.card} ${anio.activo ? styles.cardActive : ""}`}
        >
          <div className={styles.cardIcon}>📅</div>
          <div className={styles.cardInfo}>
            <h3>{anio.anio}</h3>
            <p className={styles.meta}>
              {anio.fecha_inicio && anio.fecha_fin
                ? `${new Date(anio.fecha_inicio).toLocaleDateString("es-CO")} - ${new Date(anio.fecha_fin).toLocaleDateString("es-CO")}`
                : "Sin fechas definidas"}
            </p>
            <span
              className={`${styles.badge} ${anio.activo ? styles.badgeActive : styles.badgeInactive}`}
            >
              {anio.activo ? "Vigente" : "Inactivo"}
            </span>
            <div className={styles.cardActions}>
              <button
                className={styles.deleteCardBtn}
                onClick={() => onDelete(anio.id, `Año ${anio.anio}`)}
              >
                🗑️ Eliminar
              </button>
              <button
                className={styles.editCardBtn}
                onClick={() => onEdit(anio)}
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
