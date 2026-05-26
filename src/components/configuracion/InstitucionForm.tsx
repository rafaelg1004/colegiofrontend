"use client";

import { useState } from "react";
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
  const [isEditing, setIsEditing] = useState(false);

  const handleSaveClick = async () => {
    await onSave();
    setIsEditing(false); // volver a vista read-only tras guardar
  };

  return (
    <div className={styles.card}>
      <div className={styles.headerActions}>
        <h3 className={styles.cardTitle} style={{ marginBottom: 0 }}>Datos de la Institución</h3>
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className={styles.btnFilter}>
            ✏️ Editar
          </button>
        )}
      </div>

      {!isEditing ? (
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Nombre</span>
            <span className={styles.infoValue}>{formData.nombre || "No especificado"}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>NIT</span>
            <span className={styles.infoValue}>{formData.nit || "No especificado"}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Dirección</span>
            <span className={styles.infoValue}>{formData.direccion || "No especificada"}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Teléfono</span>
            <span className={styles.infoValue}>{formData.telefono || "No especificado"}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Correo Electrónico</span>
            <span className={styles.infoValue}>{formData.correo_electronico || "No especificado"}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Rector</span>
            <span className={styles.infoValue}>{formData.rector || "No especificado"}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Código DANE</span>
            <span className={styles.infoValue}>{formData.dane || "No especificado"}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Resolución de Aprobación</span>
            <span className={styles.infoValue}>{formData.resolucion_aprobacion || "No especificada"}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Jornadas</span>
            <span className={styles.infoValue}>
              {formData.jornadas?.length ? formData.jornadas.join(", ") : "No especificadas"}
            </span>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Nombre *</label>
              <input
                placeholder="Nombre de la institución"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Teléfono</label>
              <input
                placeholder="Teléfono"
                value={formData.telefono || ""}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Correo Electrónico</label>
              <input
                type="email"
                placeholder="correo@institucion.edu"
                value={formData.correo_electronico || ""}
                onChange={(e) => setFormData({ ...formData, correo_electronico: e.target.value })}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Rector</label>
              <input
                placeholder="Nombre del rector"
                value={formData.rector || ""}
                onChange={(e) => setFormData({ ...formData, rector: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, resolucion_aprobacion: e.target.value })}
              />
            </div>
          </div>
          <div className={styles.formGroup} style={{ marginTop: "1rem" }}>
            <label>Jornadas</label>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              {["Mañana", "Tarde", "Noche", "Única"].map((jornada) => (
                <label key={jornada} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <input
                    type="checkbox"
                    checked={formData.jornadas?.includes(jornada) || false}
                    onChange={(e) => {
                      const current = formData.jornadas || [];
                      if (e.target.checked) {
                        setFormData({ ...formData, jornadas: [...current, jornada] });
                      } else {
                        setFormData({ ...formData, jornadas: current.filter((j) => j !== jornada) });
                      }
                    }}
                  />
                  {jornada}
                </label>
              ))}
            </div>
          </div>
          <div className={styles.actions} style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button onClick={handleSaveClick} disabled={loading} className={styles.btnPrimary}>
              {loading ? "Guardando..." : "💾 Guardar Cambios"}
            </button>
            <button onClick={() => setIsEditing(false)} disabled={loading} className={styles.btnSecondary}>
              ❌ Cancelar
            </button>
          </div>
        </>
      )}
    </div>
  );
}
