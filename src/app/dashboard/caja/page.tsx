'use client';

import { useEffect, useState } from 'react';
import { getAuthToken } from '@/utils/auth';
import { API_URL } from '@/utils/api';
import styles from './Caja.module.css';

const API = `${API_URL}`;

interface Movimiento {
  id: string;
  fecha: string;
  tipo: 'INGRESO' | 'EGRESO';
  concepto: string;
  monto: number;
  estudiante_nombre?: string;
  observacion?: string;
}

interface Resumen {
  periodo: { desde: string; hasta: string };
  totales: {
    ingresos: number;
    egresos: number;
    balance: number;
    cantidad_ingresos: number;
    cantidad_egresos: number;
  };
  por_concepto: {
    ingresos: Array<{ concepto: string; monto: number; cantidad: number }>;
    egresos: Array<{ concepto: string; monto: number; cantidad: number }>;
  };
  movimientos: Movimiento[];
}

export default function CajaPage() {
  const [activeTab, setActiveTab] = useState('registrar');
  const [loading, setLoading] = useState(false);
  const [resumen, setResumen] = useState<Resumen | null>(null);

  // Formulario
  const [tipo, setTipo] = useState<'INGRESO' | 'EGRESO'>('INGRESO');
  const [concepto, setConcepto] = useState('');
  const [monto, setMonto] = useState('');
  const [observacion, setObservacion] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);

  // Filtros reporte
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  // Conceptos predefinidos
  const conceptosIngreso = [
    'Matrícula',
    'Pensión Mensual',
    'Meriendas',
    'Libros',
    'Uniformes',
    'Formularios',
    'Derecho a Grado',
    'Clausura/Graduación',
    'Otro Ingreso',
  ];

  const conceptosEgreso = [
    'Nómina Docentes',
    'Nómina Administrativos',
    'Servicios Públicos',
    'Arriendo',
    'Suministros Oficina',
    'Mantenimiento',
    'Otro Gasto',
  ];

  useEffect(() => {
    cargarResumen();
  }, []);

  const cargarResumen = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const params = new URLSearchParams();
      if (fechaDesde) params.append('fecha_desde', fechaDesde);
      if (fechaHasta) params.append('fecha_hasta', fechaHasta);

      const res = await fetch(`${API}/caja/resumen?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error al cargar resumen');
      const data = await res.json();
      setResumen(data);
    } catch (err) {
      console.error('Error cargando resumen:', err);
    }
  };

  const registrarMovimiento = async () => {
    if (!concepto || !monto || parseFloat(monto) <= 0) {
      alert('Complete concepto y monto válido');
      return;
    }

    setLoading(true);
    const token = getAuthToken();

    try {
      const res = await fetch(`${API}/caja/movimientos`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tipo,
          concepto,
          monto: parseFloat(monto),
          fecha,
          observacion: observacion || null,
        }),
      });

      if (!res.ok) throw new Error('Error al registrar');

      alert('Movimiento registrado correctamente');
      setMonto('');
      setObservacion('');
      setConcepto('');
      cargarResumen();
    } catch (err: any) {
      alert(err.message || 'Error al registrar movimiento');
    } finally {
      setLoading(false);
    }
  };

  const eliminarMovimiento = async (id: string) => {
    if (!confirm('¿Eliminar este movimiento?')) return;

    const token = getAuthToken();
    try {
      const res = await fetch(`${API}/caja/movimientos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error al eliminar');
      cargarResumen();
    } catch (err) {
      alert('Error al eliminar movimiento');
    }
  };

  const formatMoney = (val: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(val);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>📒 Libro de Caja</h1>
        <p>Control simple de ingresos y egresos</p>
      </header>

      {/* Resumen rápido */}
      {resumen && (
        <div className={styles.resumenCards}>
          <div className={`${styles.card} ${styles.ingreso}`}>
            <span className={styles.cardLabel}>Ingresos</span>
            <span className={styles.cardValue}>
              {formatMoney(resumen.totales.ingresos)}
            </span>
            <span className={styles.cardCount}>
              {resumen.totales.cantidad_ingresos} movimientos
            </span>
          </div>
          <div className={`${styles.card} ${styles.egreso}`}>
            <span className={styles.cardLabel}>Egresos</span>
            <span className={styles.cardValue}>
              {formatMoney(resumen.totales.egresos)}
            </span>
            <span className={styles.cardCount}>
              {resumen.totales.cantidad_egresos} movimientos
            </span>
          </div>
          <div
            className={`${styles.card} ${
              resumen.totales.balance >= 0 ? styles.positive : styles.negative
            }`}
          >
            <span className={styles.cardLabel}>Balance</span>
            <span className={styles.cardValue}>
              {formatMoney(resumen.totales.balance)}
            </span>
            <span className={styles.cardCount}>Diferencia</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={activeTab === 'registrar' ? styles.active : ''}
          onClick={() => setActiveTab('registrar')}
        >
          ➕ Registrar
        </button>
        <button
          className={activeTab === 'movimientos' ? styles.active : ''}
          onClick={() => setActiveTab('movimientos')}
        >
          📋 Movimientos
        </button>
        <button
          className={activeTab === 'reporte' ? styles.active : ''}
          onClick={() => setActiveTab('reporte')}
        >
          📊 Reporte
        </button>
      </div>

      {/* Tab: Registrar */}
      {activeTab === 'registrar' && (
        <div className={styles.formContainer}>
          <div className={styles.formGroup}>
            <label>Tipo</label>
            <div className={styles.tipoButtons}>
              <button
                className={tipo === 'INGRESO' ? styles.activeTipo : ''}
                onClick={() => setTipo('INGRESO')}
                type="button"
              >
                💰 Ingreso
              </button>
              <button
                className={tipo === 'EGRESO' ? styles.activeTipo : ''}
                onClick={() => setTipo('EGRESO')}
                type="button"
              >
                💸 Egreso
              </button>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Concepto</label>
            <select
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
            >
              <option value="">Seleccione...</option>
              {(tipo === 'INGRESO' ? conceptosIngreso : conceptosEgreso).map(
                (c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                )
              )}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Monto</label>
            <input
              type="number"
              placeholder="0"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              min="0"
              step="1000"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Observación (opcional)</label>
            <input
              type="text"
              placeholder="Detalles adicionales..."
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
            />
          </div>

          <button
            className={styles.saveBtn}
            onClick={registrarMovimiento}
            disabled={loading}
          >
            {loading ? 'Guardando...' : '💾 Guardar Movimiento'}
          </button>
        </div>
      )}

      {/* Tab: Movimientos */}
      {activeTab === 'movimientos' && (
        <div className={styles.movimientosContainer}>
          <div className={styles.filtros}>
            <input
              type="date"
              placeholder="Desde"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
            />
            <input
              type="date"
              placeholder="Hasta"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
            />
            <button onClick={cargarResumen}>🔍 Filtrar</button>
          </div>

          <table className={styles.table}>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Concepto</th>
                <th>Monto</th>
                <th>Observación</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {resumen?.movimientos?.map((m) => (
                <tr key={m.id}>
                  <td>{new Date(m.fecha).toLocaleDateString('es-CO')}</td>
                  <td>
                    <span
                      className={
                        m.tipo === 'INGRESO' ? styles.badgeIngreso : styles.badgeEgreso
                      }
                    >
                      {m.tipo === 'INGRESO' ? '💰' : '💸'} {m.tipo}
                    </span>
                  </td>
                  <td>{m.concepto}</td>
                  <td className={m.tipo === 'INGRESO' ? styles.positive : styles.negative}>
                    {formatMoney(m.monto)}
                  </td>
                  <td>{m.observacion || '-'}</td>
                  <td>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => eliminarMovimiento(m.id)}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Reporte */}
      {activeTab === 'reporte' && resumen && (
        <div className={styles.reporteContainer}>
          <h3>📊 Resumen por Concepto</h3>

          <div className={styles.reporteGrid}>
            <div className={styles.reporteSection}>
              <h4>💰 Ingresos</h4>
              <table className={styles.tableSmall}>
                <thead>
                  <tr>
                    <th>Concepto</th>
                    <th>Cant</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {resumen.por_concepto.ingresos.map((item) => (
                    <tr key={item.concepto}>
                      <td>{item.concepto}</td>
                      <td>{item.cantidad}</td>
                      <td className={styles.positive}>
                        {formatMoney(item.monto)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.reporteSection}>
              <h4>💸 Egresos</h4>
              <table className={styles.tableSmall}>
                <thead>
                  <tr>
                    <th>Concepto</th>
                    <th>Cant</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {resumen.por_concepto.egresos.map((item) => (
                    <tr key={item.concepto}>
                      <td>{item.concepto}</td>
                      <td>{item.cantidad}</td>
                      <td className={styles.negative}>
                        {formatMoney(item.monto)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
