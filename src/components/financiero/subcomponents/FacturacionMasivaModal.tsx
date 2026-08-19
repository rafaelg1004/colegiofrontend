import React from 'react';
import styles from '../FinanzasDashboard.module.css';

interface FacturacionMasivaModalProps {
  showFacturacion: boolean;
  setShowFacturacion: (show: boolean) => void;
  opcionesFacturacion: any[];
  idSeleccionado: string;
  setIdSeleccionado: (id: string) => void;
  tipoSeleccionado: 'articulo' | 'concepto';
  setTipoSeleccionado: (tipo: 'articulo' | 'concepto') => void;
  handleConfirmarFacturacion: () => void;
  saving: boolean;
  mesNombre: string;
  anioFiltro: number;
  showConfirmacionExtra: boolean;
  setShowConfirmacionExtra: (show: boolean) => void;
  ejecutarFacturacionMasiva: () => void;
}

export const FacturacionMasivaModal: React.FC<FacturacionMasivaModalProps> = ({
  showFacturacion,
  setShowFacturacion,
  opcionesFacturacion,
  idSeleccionado,
  setIdSeleccionado,
  tipoSeleccionado,
  setTipoSeleccionado,
  handleConfirmarFacturacion,
  saving,
  mesNombre,
  anioFiltro,
  showConfirmacionExtra,
  setShowConfirmacionExtra,
  ejecutarFacturacionMasiva,
}) => {
  return (
    <>
      {showFacturacion && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Facturación Masiva</h2>
            </div>
            <div className={styles.modalBody}>
              <div style={{ 
                background: '#fff1f2', 
                border: '1px solid #fecdd3', 
                padding: '1rem', 
                borderRadius: '12px', 
                marginBottom: '1.5rem',
                fontSize: '0.9rem',
                color: '#9f1239'
              }}>
                <strong>⚠️ Información Importante:</strong>
                <br/>
                Esta acción creará un registro de cobro/deuda para <strong>TODOS los estudiantes activos</strong> registrados en el sistema para el mes de <strong>{mesNombre} {anioFiltro}</strong>.
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#1e293b' }}>
                  Selecciona el Concepto o Servicio a Facturar:
                </label>

                {opcionesFacturacion.length === 0 ? (
                  <p style={{ color: '#ef4444', fontSize: '0.9rem' }}>
                    No se encontraron servicios de pensión o inventario activos para facturación.
                  </p>
                ) : (
                  <select 
                    value={idSeleccionado} 
                    onChange={(e) => {
                      const sel = opcionesFacturacion.find(o => o.id === e.target.value);
                      if (sel) {
                        setIdSeleccionado(sel.id);
                        setTipoSeleccionado(sel.tipo);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '1rem',
                      outline: 'none',
                      background: '#fff'
                    }}
                  >
                    {opcionesFacturacion.map(op => (
                      <option key={op.id} value={op.id}>
                        {op.nombre} ({op.tipo === 'articulo' ? 'Servicio de Inventario' : 'Concepto de Cobro'})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button 
                className={styles.btnSecondary} 
                onClick={() => setShowFacturacion(false)}
                disabled={saving}
              >
                Cancelar
              </button>
              <button 
                className={styles.btnPrimary} 
                onClick={handleConfirmarFacturacion}
                disabled={saving}
              >
                {saving ? "Generando..." : "Confirmar y Generar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmacionExtra && (
        <div className={styles.modalOverlay} style={{ zIndex: 1100 }}>
          <div className={styles.modalContent} style={{ maxWidth: '400px' }}>
            <div className={styles.modalHeader} style={{ background: '#fee2e2' }}>
              <h2 style={{ color: '#991b1b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>❓</span> Confirmación Final
              </h2>
            </div>
            <div className={styles.modalBody}>
              <p style={{ fontSize: '1.1rem', color: '#1e293b', fontWeight: 500, textAlign: 'center' }}>
                ¿Estás absolutamente seguro de que deseas generar las facturas masivas?
              </p>
              <p style={{ color: '#64748b', fontSize: '0.9rem', textAlign: 'center', marginTop: '1rem' }}>
                Esta acción creará un registro de deuda para cada estudiante activo para el mes de {mesNombre} {anioFiltro}.
              </p>
            </div>
            <div className={styles.modalFooter} style={{ justifyContent: 'center' }}>
              <button 
                className={styles.btnSecondary} 
                onClick={() => setShowConfirmacionExtra(false)}
                disabled={saving}
              >
                No, cancelar
              </button>
              <button 
                className={styles.btnPrimary} 
                style={{ background: '#dc2626' }}
                onClick={ejecutarFacturacionMasiva}
                disabled={saving}
              >
                {saving ? "Generando..." : "Sí, generar ahora"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
