"use client";

import styles from "../ConfiguracionAcademica.module.css";
import type { Sede } from "../types";

interface SedesTabProps {
  sedes: Sede[];
  onEdit: (sede: Sede) => void;
  onDelete: (id: string, name: string) => void;
}

export const SedesTab = ({ sedes, onEdit, onDelete }: SedesTabProps) => {
  if (sedes.length === 0) {
    return <div className={styles.empty}>No hay sedes registradas</div>;
  }

  return (
    <div className={styles.dataGrid}>
      {sedes.map((sede) => (
        <div key={sede.id} className={styles.card}>
          <div className={styles.cardIcon}>🏫</div>
          <div className={styles.cardInfo}>
            <h3>{sede.nombre}</h3>
            <p>{sede.direccion || "Sin dirección"}</p>
            {sede.telefono && (
              <span className={styles.meta}>Tel: {sede.telefono}</span>
            )}
            <div className={styles.cardActions}>
              <button
                className={styles.deleteCardBtn}
                onClick={() => onDelete(sede.id, sede.nombre)}
              >
                🗑️ Eliminar
              </button>
              <button
                className={styles.editCardBtn}
                onClick={() => onEdit(sede)}
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
