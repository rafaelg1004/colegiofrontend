import React from 'react';
import styles from '../CajaModerna.module.css';

interface Props {
  resumen: any;
  formatMoney: (val: number) => string;
}

const CajaSummary: React.FC<Props> = ({ resumen, formatMoney }) => {
  if (!resumen) return null;

  return (
    <div className={styles.resumenCards}>
      <div className={`${styles.card} ${styles.ingreso}`}>
        <span className={styles.cardLabel}>Total Ingresos</span>
        <span className={styles.cardValue}>{formatMoney(resumen.totales.ingresos)}</span>
        <span className={styles.cardCount}>{resumen.totales.cantidad_ingresos} transacciones</span>
      </div>
      <div className={`${styles.card} ${styles.egreso}`}>
        <span className={styles.cardLabel}>Total Egresos</span>
        <span className={styles.cardValue}>{formatMoney(resumen.totales.egresos)}</span>
        <span className={styles.cardCount}>{resumen.totales.cantidad_egresos} transacciones</span>
      </div>
      <div className={`${styles.card} ${resumen.totales.balance >= 0 ? styles.positive : styles.negative}`}>
        <span className={styles.cardLabel}>Balance Actual</span>
        <span className={styles.cardValue}>{formatMoney(resumen.totales.balance)}</span>
        <span className={styles.cardCount}>Saldo en caja</span>
      </div>
    </div>
  );
};

export default CajaSummary;
