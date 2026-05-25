import React, { useState } from 'react';
import styles from '../CajaModerna.module.css';
import { getAuthToken } from "@/utils/auth";

interface Props {
  resumen: any;
  fechaDesde: string;
  setFechaDesde: (val: string) => void;
  fechaHasta: string;
  setFechaHasta: (val: string) => void;
  cargarResumen: () => void;
  formatMoney: (val: number) => string;
  imprimirRecibo: (datos: any) => void;
}

const CajaHistory: React.FC<Props> = ({
  resumen,
  fechaDesde,
  setFechaDesde,
  fechaHasta,
  setFechaHasta,
  cargarResumen,
  formatMoney,
  imprimirRecibo
}) => {
  const [editingMov, setEditingMov] = useState<any>(null);
  const [newObs, setNewObs] = useState("");
  const [savingObs, setSavingObs] = useState(false);

  const handleEditClick = (mov: any) => {
    setEditingMov(mov);
    setNewObs(mov.observacion || "");
  };

  const saveObservation = async () => {
    if (!editingMov) return;
    setSavingObs(true);
    try {
      const token = getAuthToken();
      const API = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${API}/caja/movimientos/${editingMov.id}/observacion`, {
        method: "PATCH",
        headers: { 
          Authorization: `Bearer ${token}`, 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({ observacion: newObs })
      });
      
      if (res.ok) {
        setEditingMov(null);
        cargarResumen();
      } else {
        alert("Error al actualizar la observación");
      }
    } catch (err) {
      console.error(err);
      alert("Error al actualizar la observación");
    } finally {
      setSavingObs(false);
    }
  };

  return (
    <div className={styles.tableSection}>
      <div className={styles.filtersRow}>
        <div className={styles.filterGroup}>
          <label>Desde</label>
          <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} />
        </div>
        <div className={styles.filterGroup}>
          <label>Hasta</label>
          <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} />
        </div>
        <button className={styles.btnFiltrar} onClick={cargarResumen}>🔍 Filtrar</button>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Concepto</th>
              <th>Beneficiario</th>
              <th>Monto</th>
              <th>Comprobante</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {resumen?.movimientos.map((mov: any) => (
              <tr key={mov.id}>
                <td>{new Date(mov.fecha).toLocaleDateString()}</td>
                <td><span className={`${styles.badge} ${mov.tipo === 'INGRESO' ? styles.badgeIngreso : styles.badgeEgreso}`}>{mov.tipo}</span></td>
                <td>{mov.concepto}</td>
                <td>{mov.estudiante_nombre || "-"}</td>
                <td style={{ fontWeight: 700, color: mov.tipo === 'INGRESO' ? '#059669' : '#dc2626' }}>{formatMoney(mov.monto)}</td>
                <td>{mov.numero_comprobante}</td>
                <td>
                  <button 
                    onClick={() => imprimirRecibo(mov)} 
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', marginRight: '10px' }}
                    title="Reimprimir Comprobante"
                  >
                    🖨️
                  </button>
                  <button 
                    onClick={() => handleEditClick(mov)} 
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                    title="Editar Observación"
                  >
                    ✏️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingMov && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '400px' }}>
            <div className={styles.modalHeader}>
              <h2>Editar Observación</h2>
              <button className={styles.closeBtn} onClick={() => setEditingMov(null)}>×</button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ marginBottom: '10px', fontSize: '0.9rem', color: '#64748b' }}>
                Comprobante: {editingMov.numero_comprobante}
              </p>
              <textarea 
                value={newObs}
                onChange={(e) => setNewObs(e.target.value)}
                rows={4}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', resize: 'none' }}
                placeholder="Escriba la nueva observación..."
              />
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.btnSecondary} 
                onClick={() => setEditingMov(null)}
                disabled={savingObs}
              >
                Cancelar
              </button>
              <button 
                className={styles.btnPrimary} 
                onClick={saveObservation}
                disabled={savingObs}
              >
                {savingObs ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CajaHistory;
