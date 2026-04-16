"use client";

import styles from "../ConfiguracionAcademica.module.css";
import type { Grado, Nivel } from "../types";

interface GradosTabProps {
  grados: Grado[];
  niveles: Nivel[];
  nivelFiltro: string;
  onNivelChange: (nivelId: string) => void;
  onEdit: (grado: Grado) => void;
  onDelete: (id: string, name: string) => void;
}

export const GradosTab = ({
  grados,
  niveles,
  nivelFiltro,
  onNivelChange,
  onEdit,
  onDelete,
}: GradosTabProps) => {
  return (
    <>
      <div className={styles.filterBar}>
        <select
          value={nivelFiltro}
          onChange={(e) => onNivelChange(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">Todos los niveles</option>
          {niveles.map((n) => (
            <option key={n.id} value={n.id}>
              {n.nombre}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.dataGrid}>
        {grados.length > 0 ? (
          grados.map((grado) => (
            <div key={grado.id} className={styles.card}>
              <div className={styles.cardIcon}>🎓</div>
              <div className={styles.cardInfo}>
                <h3>{grado.nombre}</h3>
                <p>Orden: {grado.orden}</p>
                {grado.nivel && (
                  <span className={styles.meta}>
                    Nivel: {grado.nivel.nombre}
                  </span>
                )}
                <div className={styles.cardActions}>
                  <button
                    className={styles.deleteCardBtn}
                    onClick={() => onDelete(grado.id, grado.nombre)}
                  >
                    🗑️ Eliminar
                  </button>
                  <button
                    className={styles.editCardBtn}
                    onClick={() => onEdit(grado)}
                  >
                    ✏️ Editar
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.empty}>No hay grados registrados</div>
        )}
      </div>
    </>
  );
};
