"use client";

import React from "react";
import styles from "../Contabilidad.module.css";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface MetricasFinancierasTabProps {
  metricas: any;
}

export default function MetricasFinancierasTab({ metricas }: MetricasFinancierasTabProps) {
  if (!metricas) return null;

  return (
    <div className={styles.metricsContainer}>
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <h4 style={{ color: "#666", fontSize: "0.9rem", margin: "0 0 0.5rem 0" }}>🏦 Flujo de Efectivo Real</h4>
          <h2 style={{ color: "#0066cc", margin: 0 }}>
            {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" }).format(metricas.flujoEfectivo)}
          </h2>
        </div>
        
        <div className={styles.metricCard}>
          <h4 style={{ color: "#666", fontSize: "0.9rem", margin: "0 0 0.5rem 0" }}>⚠️ Cartera / Morosidad</h4>
          <h2 style={{ color: "#e11d48", margin: 0 }}>
            {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" }).format(metricas.carteraPendiente)}
          </h2>
        </div>
        
        <div className={styles.metricCard}>
          <h4 style={{ color: "#666", fontSize: "0.9rem", margin: "0 0 0.5rem 0" }}>🎯 Proyección de Recaudo</h4>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem' }}>
            <h2 style={{ color: "#16a34a", margin: 0 }}>{metricas.proyeccion.porcentaje.toFixed(1)}%</h2>
            <div style={{ paddingBottom: '4px' }}>
              de {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" }).format(metricas.proyeccion.total)}
            </div>
          </div>
          <div style={{ width: '100%', backgroundColor: '#eee', height: '8px', borderRadius: '4px', marginTop: '0.5rem' }}>
            <div style={{ width: `${Math.min(metricas.proyeccion.porcentaje, 100)}%`, backgroundColor: '#16a34a', height: '100%', borderRadius: '4px' }}></div>
          </div>
        </div>
      </div>
      
      <div className={styles.metricsGrid} style={{ gridTemplateColumns: '2fr 1fr' }}>
        <div className={styles.chartCard}>
          <h3 style={{ marginTop: 0 }}>Ingresos vs Gastos Mensuales</h3>
          <div style={{ height: '300px' }}>
            <Bar 
              data={{
                labels: metricas.ingresosVsGastos.map((d: any) => d.mes),
                datasets: [
                  { label: 'Ingresos', data: metricas.ingresosVsGastos.map((d: any) => d.ingresos), backgroundColor: '#16a34a' },
                  { label: 'Gastos', data: metricas.ingresosVsGastos.map((d: any) => d.gastos), backgroundColor: '#e11d48' }
                ]
              }}
              options={{ responsive: true, maintainAspectRatio: false }}
            />
          </div>
        </div>
        
        <div className={styles.chartCard}>
          <h3 style={{ marginTop: 0 }}>Distribución de Gastos</h3>
          <div style={{ height: '300px' }}>
            <Doughnut 
              data={{
                labels: metricas.distribucionGastos.map((d: any) => d.name),
                datasets: [{
                  data: metricas.distribucionGastos.map((d: any) => d.value),
                  backgroundColor: ['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#f43f5e', '#64748b']
                }]
              }}
              options={{ responsive: true, maintainAspectRatio: false }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
