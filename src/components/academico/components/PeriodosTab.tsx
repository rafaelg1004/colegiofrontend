"use client";

import styles from "../ConfiguracionAcademica.module.css";
import type { Periodo, AnioLectivo } from "../types";

interface PeriodosTabProps {
  periodos: Periodo[];
  anios: AnioLectivo[];
  anioSeleccionado: string;
  onAnioChange: (anioId: string) => void;
  onEdit: (periodo: Periodo) => void;
  onDelete: (id: string, name: string) => void;
}

export const PeriodosTab = ({
  periodos,
  anios,
  anioSeleccionado,
  onAnioChange,
  onEdit,
  onDelete,
}: PeriodosTabProps) => {
  return (
    <>
      <div className={styles.filterBar}>
        <select
          value={anioSeleccionado}
          onChange={(e) => onAnioChange(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">Seleccionar año...</option>
          {anios.map((a) => (
            <option key={a.id} value={a.id}>
              {a.anio} {a.activo ? "(Activo)" : ""}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.dataGrid}>
        {periodos.length > 0 ? (
          periodos.map((periodo) => (
            <div
              key={periodo.id}
              className={`${styles.card} ${periodo.activo ? styles.cardActive : ""}`}
            >
              <div className={styles.cardIcon}>📊</div>
              <div className={styles.cardInfo}>
                <h3>{periodo.nombre}</h3>
                <p>Periodo #{periodo.numero}</p>
                <p className={styles.meta}>
                  {periodo.fecha_inicio && periodo.fecha_fin
                    ? `${new Date(periodo.fecha_inicio).toLocaleDateString("es-CO")} - ${new Date(periodo.fecha_fin).toLocaleDateString("es-CO")}`
                    : "Sin fechas definidas"}
                </p>
                <div className={styles.metaRow}>
                  <span className={styles.meta}>
                    Peso: {periodo.porcentaje_peso}%
                  </span>
                  <span
                    className={`${styles.badge} ${periodo.activo ? styles.badgeActive : styles.badgeInactive}`}
                  >
                    {periodo.activo ? "Activo" : "Cerrado"}
                  </span>
                </div>
                <div className={styles.cardActions}>
                  <button
                    className={styles.deleteCardBtn}
                    onClick={() => onDelete(periodo.id, periodo.nombre)}
                  >
                    🗑️ Eliminar
                  </button>
                  <button
                    className={styles.editCardBtn}
                    onClick={() => onEdit(periodo)}
                  >
                    ✏️ Editar
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.empty}>
            {anioSeleccionado
              ? "No hay periodos para este año"
              : "Seleccione un año lectivo"}
          </div>
        )}
      </div>
    </>
  );
};
