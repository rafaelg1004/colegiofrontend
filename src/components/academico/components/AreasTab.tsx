"use client";

import styles from "../ConfiguracionAcademica.module.css";
import type { Area, Asignatura } from "../types";

interface AreasTabProps {
  areas: Area[];
  onEditArea: (area: Area) => void;
  onDeleteArea: (id: string, name: string) => void;
  onAddAsignatura: (areaId: string) => void;
  onEditAsignatura: (asig: Asignatura, areaId: string) => void;
}

export const AreasTab = ({
  areas,
  onEditArea,
  onDeleteArea,
  onAddAsignatura,
  onEditAsignatura,
}: AreasTabProps) => {
  if (areas.length === 0) {
    return <div className={styles.empty}>No hay áreas registradas</div>;
  }

  return (
    <div className={styles.areasContainer}>
      {areas.map((area) => (
        <div key={area.id} className={styles.areaCard}>
          <div className={styles.areaHeader}>
            <h3>📚 {area.nombre}</h3>
            <div className={styles.areaActions}>
              <button
                className={styles.deleteAreaBtn}
                onClick={() => onDeleteArea(area.id, area.nombre)}
              >
                🗑️
              </button>
              <button
                className={styles.editSmallBtn}
                onClick={() => onEditArea(area)}
              >
                ✏️
              </button>
              <button
                className={styles.addSmallBtn}
                onClick={() => onAddAsignatura(area.id)}
              >
                + Asignatura
              </button>
            </div>
          </div>
          <div className={styles.asignaturasList}>
            {area.asignatura?.length ? (
              area.asignatura.map((asig) => (
                <div key={asig.id} className={styles.asignaturaItem}>
                  <span>{asig.nombre}</span>
                  <button
                    className={styles.editAsigBtn}
                    onClick={() => onEditAsignatura(asig, area.id)}
                  >
                    ✏️
                  </button>
                </div>
              ))
            ) : (
              <span className={styles.noAsignaturas}>Sin asignaturas</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
