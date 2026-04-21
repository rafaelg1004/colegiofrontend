'use client';

import React from 'react';
import Link from 'next/link';
import styles from './DashboardView.module.css';

interface DashboardViewProps {
  user: {
    id: string;
    nombre_usuario?: string;
    rol?: string;
  };
}

export const DashboardView = ({ user }: DashboardViewProps) => {
  return (
    <div className={styles.container}>
      <header className={styles.welcomeHeader}>
        <h1>Bienvenido, {user.nombre_usuario || 'Usuario'}</h1>
        <p>Sistema de Gestión Educativa - Panel de Control</p>
      </header>

      <div className={styles.welcomeCard}>
        <h2>¡Hola de nuevo!</h2>
        <p>Has iniciado sesión como <strong>{user.rol || 'Usuario'}</strong>. Selecciona un módulo para comenzar a trabajar.</p>
      </div>
      
      <div className={styles.grid}>
        <Link href="/dashboard/estudiantes" prefetch={false} className={styles.card}>
          <div className={styles.cardIcon}>🎓</div>
          <div className={styles.cardInfo}>
            <h3>Estudiantes</h3>
            <p>Listado general, búsqueda y perfiles.</p>
          </div>
        </Link>
        <Link href="/dashboard/matriculas" prefetch={false} className={styles.card}>
          <div className={styles.cardIcon}>📝</div>
          <div className={styles.cardInfo}>
            <h3>Matrículas</h3>
            <p>Inscripciones y asignación de grupos.</p>
          </div>
        </Link>
        <Link href="/dashboard/calificaciones" prefetch={false} className={styles.card}>
          <div className={styles.cardIcon}>📊</div>
          <div className={styles.cardInfo}>
            <h3>Calificaciones</h3>
            <p>Planillas de notas y boletines.</p>
          </div>
        </Link>
        <Link href="/dashboard/asistencia" prefetch={false} className={styles.card}>
          <div className={styles.cardIcon}>⏱️</div>
          <div className={styles.cardInfo}>
            <h3>Asistencia</h3>
            <p>Control diario y reporte de faltas.</p>
          </div>
        </Link>
        <Link href="/dashboard/nomina" prefetch={false} className={styles.card}>
          <div className={styles.cardIcon}>💸</div>
          <div className={styles.cardInfo}>
            <h3>Nómina</h3>
            <p>Pagos a docentes y personal.</p>
          </div>
        </Link>
        <Link href="/dashboard/financiero" prefetch={false} className={styles.card}>
          <div className={styles.cardIcon}>🏦</div>
          <div className={styles.cardInfo}>
            <h3>Finanzas</h3>
            <p>Pensiones, pagos y tesorería.</p>
          </div>
        </Link>
      </div>
    </div>
  );
};
