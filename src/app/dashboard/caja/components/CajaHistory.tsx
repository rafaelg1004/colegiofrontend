import React from 'react';
import styles from '../CajaModerna.module.css';

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
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                    title="Reimprimir Comprobante"
                  >
                    🖨️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CajaHistory;
