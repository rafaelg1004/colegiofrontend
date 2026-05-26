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
  const [newFecha, setNewFecha] = useState("");
  const [savingObs, setSavingObs] = useState(false);

  const handleEditClick = (mov: any) => {
    setEditingMov(mov);
    setNewObs(mov.observacion || "");
    const dateStr = mov.fecha ? mov.fecha.split('T')[0] : "";
    setNewFecha(dateStr);
  };

  const formatFechaLocal = (fechaStr: string) => {
    if (!fechaStr) return "-";
    const cleanDateStr = fechaStr.split('T')[0];
    const parts = cleanDateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return cleanDateStr;
  };

  const saveObservation = async () => {
    if (!editingMov) return;
    setSavingObs(true);
    try {
      const token = getAuthToken();
      const API = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${API}/caja/movimientos/${editingMov.id}`, {
        method: "PATCH",
        headers: { 
          Authorization: `Bearer ${token}`, 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({ 
          observacion: newObs,
          fecha: newFecha
        })
      });
      
      if (res.ok) {
        setEditingMov(null);
        cargarResumen();
      } else {
        alert("Error al actualizar el movimiento");
      }
    } catch (err) {
      console.error(err);
      alert("Error al actualizar el movimiento");
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

      {/* Vista de escritorio (Tabla) */}
      <div className={styles.desktopHistoryTable}>
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
                  <td>{formatFechaLocal(mov.fecha)}</td>
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
      </div>

      {/* Vista de móvil (Cards) */}
      <div className={styles.mobileHistoryList}>
        {resumen?.movimientos.map((mov: any) => (
          <div key={mov.id} className={styles.movCard}>
            <div className={styles.movCardHeader}>
              <span className={styles.movCardDate}>{formatFechaLocal(mov.fecha)}</span>
              <span className={`${styles.badge} ${mov.tipo === 'INGRESO' ? styles.badgeIngreso : styles.badgeEgreso}`}>{mov.tipo}</span>
            </div>
            <div className={styles.movCardBody}>
              <p><strong>Concepto:</strong> {mov.concepto}</p>
              <p><strong>Beneficiario:</strong> {mov.estudiante_nombre || "-"}</p>
              <p><strong>Comprobante:</strong> {mov.numero_comprobante}</p>
            </div>
            <div className={styles.movCardFooter}>
              <span className={styles.movCardAmount} style={{ color: mov.tipo === 'INGRESO' ? '#059669' : '#dc2626' }}>
                {formatMoney(mov.monto)}
              </span>
              <div className={styles.movCardActions}>
                <button onClick={() => imprimirRecibo(mov)} className={styles.btnMovAction} title="Reimprimir">🖨️ Recibo</button>
                <button onClick={() => handleEditClick(mov)} className={styles.btnMovAction} title="Editar">✏️ Editar</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editingMov && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal} style={{ maxWidth: '450px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>✏️ Editar Transacción</h2>
            </div>
            <div>
              <p style={{ marginBottom: '15px', fontSize: '0.9rem', color: '#64748b' }}>
                Comprobante: <strong>{editingMov.numero_comprobante}</strong>
              </p>
              
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.9rem', color: '#475569' }}>Fecha de Registro</label>
                <input 
                  type="date" 
                  value={newFecha}
                  onChange={(e) => setNewFecha(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '2px solid #e2e8f0', outline: 'none', fontFamily: 'inherit', fontSize: '0.95rem' }}
                  onFocus={(e) => e.target.style.borderColor = '#4f46e5'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.9rem', color: '#475569' }}>Observaciones</label>
                <textarea 
                  value={newObs}
                  onChange={(e) => setNewObs(e.target.value)}
                  rows={3}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '2px solid #e2e8f0', resize: 'none', outline: 'none', fontFamily: 'inherit', fontSize: '0.95rem' }}
                  placeholder="Escriba la nueva observación..."
                  onFocus={(e) => e.target.style.borderColor = '#4f46e5'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
            </div>
            <div className={styles.modalActions}>
              <button 
                className={styles.btnModalSecondary} 
                onClick={() => setEditingMov(null)}
                disabled={savingObs}
              >
                Cancelar
              </button>
              <button 
                className={styles.btnModalPrimary} 
                onClick={saveObservation}
                disabled={savingObs}
              >
                {savingObs ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CajaHistory;
