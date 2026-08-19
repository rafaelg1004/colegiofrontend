import React from 'react';
import styles from '../FinanzasDashboard.module.css';

interface FinanzasStatsCardsProps {
  totalEstudiantes: number;
  cantAldia: number;
  cantDebe: number;
  totalDeudaFiltrada: number;
  formatMoney: (val: number) => string;
}

export const FinanzasStatsCards: React.FC<FinanzasStatsCardsProps> = ({
  totalEstudiantes,
  cantAldia,
  cantDebe,
  totalDeudaFiltrada,
  formatMoney,
}) => {
  return (
    <div className={styles.statsGrid}>
      <div className={styles.statCard}>
        <span className={styles.statLabel}>Total Estudiantes</span>
        <span className={styles.statValue}>{totalEstudiantes}</span>
      </div>
      <div className={styles.statCard}>
        <span className={styles.statLabel}>Al Día (Pagados)</span>
        <span className={styles.statValue + " " + styles.collected}>{cantAldia}</span>
      </div>
      <div className={styles.statCard}>
        <span className={styles.statLabel}>Deudores / Pendientes</span>
        <span className={styles.statValue + " " + styles.pending}>{cantDebe}</span>
      </div>
      <div className={styles.statCard}>
        <span className={styles.statLabel}>Total Deuda Pendiente</span>
        <span className={styles.statValue + " " + styles.pending}>
          {formatMoney(totalDeudaFiltrada)}
        </span>
      </div>
    </div>
  );
};
