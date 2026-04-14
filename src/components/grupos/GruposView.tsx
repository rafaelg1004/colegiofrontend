"use client";

import { useEffect, useState, useCallback } from "react";
import { getAuthToken } from "@/utils/auth";
import { API_URL } from "@/utils/api";
import styles from "./GruposView.module.css";

interface Grupo {
  id: string;
  nombre: string;
  jornada: string;
  cupo_maximo: number;
  estudiantes_count?: number;
  grado: {
    nombre: string;
    nivel: { nombre: string };
  };
}

export const GruposView = () => {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGrupos = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/grupos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        // Para efectos visuales, simulamos el conteo si no viene del API
        setGrupos(Array.isArray(data) ? data : []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrupos();
  }, []);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleSection}>
          <h1>Grupos Académicos</h1>
          <p>Organización de estudiantes por grado y jornada</p>
        </div>
      </header>

      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem" }}>
          Cargando grupos...
        </div>
      ) : (
        <div className={styles.grid}>
          {grupos.map((grupo) => (
            <div key={grupo.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.nivelTag}>
                  {grupo.grado?.nivel?.nombre}
                </span>
                <h3>
                  {grupo.grado?.nombre} - {grupo.nombre}
                </h3>
              </div>
              <div className={styles.info}>
                <span className={styles.cupo}>
                  Jornada: <strong>{grupo.jornada || "N/A"}</strong>
                </span>
                <span className={styles.cupo}>
                  Cualificado: <strong>Activo</strong>
                </span>
              </div>
              <div className={styles.info}>
                <span className={styles.cupo}>
                  Cupo: {grupo.cupo_maximo || 30}
                </span>
              </div>
              <div className={styles.progress}>
                <div
                  className={styles.progressBar}
                  style={{ width: "40%" }} // Simulado
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
