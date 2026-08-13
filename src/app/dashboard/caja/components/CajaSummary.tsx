import React from 'react';
import styles from '../CajaModerna.module.css';

interface Props {
  resumen: any;
  formatMoney: (val: number) => string;
}

const CajaSummary: React.FC<Props> = ({ resumen, formatMoney }) => {
  if (!resumen || !resumen.totales) return null;

  const totales = resumen.totales || {};
  const ingresos = Number(totales.ingresos || 0);
  const egresos = Number(totales.egresos || 0);
  const balance = Number(totales.balance || 0);
  const cantidad_ingresos = Number(totales.cantidad_ingresos || 0);
  const cantidad_egresos = Number(totales.cantidad_egresos || 0);

  return (
    <div className={styles.resumenCards}>
      <div className={`${styles.card} ${styles.ingreso}`}>
        <span className={styles.cardLabel}>Total Ingresos</span>
        <span className={styles.cardValue}>{formatMoney(ingresos)}</span>
        <span className={styles.cardCount}>{cantidad_ingresos} transacciones</span>
      </div>
      <div className={`${styles.card} ${styles.egreso}`}>
        <span className={styles.cardLabel}>Total Egresos</span>
        <span className={styles.cardValue}>{formatMoney(egresos)}</span>
        <span className={styles.cardCount}>{cantidad_egresos} transacciones</span>
      </div>
      <div className={`${styles.card} ${balance >= 0 ? styles.positive : styles.negative}`}>
        <span className={styles.cardLabel}>Balance Actual</span>
        <span className={styles.cardValue}>{formatMoney(balance)}</span>
        <span className={styles.cardCount}>Saldo en caja</span>
      </div>
    </div>
  );
};

export default CajaSummary;
