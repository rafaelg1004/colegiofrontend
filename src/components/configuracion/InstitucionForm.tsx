"use client";

import styles from "./Configuracion.module.css";

interface Institucion {
  id?: string;
  nombre: string;
  nit: string;
  direccion?: string;
  telefono?: string;
  correo_electronico?: string;
  logo_url?: string;
  rector?: string;
  resolucion_aprobacion?: string;
  dane?: string;
  jornadas?: string[];
}

interface InstitucionFormProps {
  formData: Institucion;
  setFormData: (data: Institucion) => void;
  onSave: () => void;
  loading: boolean;
}

export function InstitucionForm({
  formData,
  setFormData,
  onSave,
  loading,
}: InstitucionFormProps) {
  return (
    <div className={styles.card}>
      <h3 className={styles.cardTitle}>Datos de la Institución</h3>
      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label>Nombre *</label>
          <input
            placeholder="Nombre de la institución"
            value={formData.nombre}
            onChange={(e) =>
              setFormData({ ...formData, nombre: e.target.value })
            }
          />
        </div>
        <div className={styles.formGroup}>
          <label>NIT *</label>
          <input
            placeholder="NIT"
            value={formData.nit}
            onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
          />
        </div>
        <div className={styles.formGroup}>
          <label>Dirección</label>
          <input
            placeholder="Dirección"
            value={formData.direccion || ""}
            onChange={(e) =>
              setFormData({ ...formData, direccion: e.target.value })
            }
          />
        </div>
        <div className={styles.formGroup}>
          <label>Teléfono</label>
          <input
            placeholder="Teléfono"
            value={formData.telefono || ""}
            onChange={(e) =>
              setFormData({ ...formData, telefono: e.target.value })
            }
          />
        </div>
        <div className={styles.formGroup}>
          <label>Correo Electrónico</label>
          <input
            type="email"
            placeholder="correo@institucion.edu"
            value={formData.correo_electronico || ""}
            onChange={(e) =>
              setFormData({ ...formData, correo_electronico: e.target.value })
            }
          />
        </div>
        <div className={styles.formGroup}>
          <label>Rector</label>
          <input
            placeholder="Nombre del rector"
            value={formData.rector || ""}
            onChange={(e) =>
              setFormData({ ...formData, rector: e.target.value })
            }
          />
        </div>
        <div className={styles.formGroup}>
          <label>Código DANE</label>
          <input
            placeholder="Código DANE"
            value={formData.dane || ""}
            onChange={(e) => setFormData({ ...formData, dane: e.target.value })}
          />
        </div>
        <div className={styles.formGroup}>
          <label>Resolución de Aprobación</label>
          <input
            placeholder="Número de resolución"
            value={formData.resolucion_aprobacion || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                resolucion_aprobacion: e.target.value,
              })
            }
          />
        </div>
      </div>
      <div className={styles.formGroup} style={{ marginTop: "1rem" }}>
        <label>Jornadas</label>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          {["Mañana", "Tarde", "Noche", "Única"].map((jornada) => (
            <label
              key={jornada}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <input
                type="checkbox"
                checked={formData.jornadas?.includes(jornada) || false}
                onChange={(e) => {
                  const current = formData.jornadas || [];
                  if (e.target.checked) {
                    setFormData({
                      ...formData,
                      jornadas: [...current, jornada],
                    });
                  } else {
                    setFormData({
                      ...formData,
                      jornadas: current.filter((j) => j !== jornada),
                    });
                  }
                }}
              />
              {jornada}
            </label>
          ))}
        </div>
      </div>
      <div className={styles.actions}>
        <button
          onClick={onSave}
          disabled={loading}
          className={styles.btnPrimary}
        >
          {loading ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </div>
  );
}
