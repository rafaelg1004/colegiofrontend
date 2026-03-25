'use client';

import { useEffect, useState } from 'react';
import { getAuthToken } from '@/utils/auth';

interface CuentaContable {
  id: string;
  codigo: string;
  nombre: string;
  tipo: string;
  naturaleza: string;
  padre?: { codigo: string; nombre: string };
}

interface MovimientoContable {
  id: string;
  fecha: string;
  descripcion: string;
  debe: number;
  haber: number;
  cuenta?: { codigo: string; nombre: string; tipo: string };
  factura?: { numero_factura: string };
  nomina?: { periodo_mes: number; periodo_anio: number };
}

const API = 'http://localhost:3005/api/v1';

export default function ContabilidadPage() {
  const [activeTab, setActiveTab] = useState('cuentas');
  const [loading, setLoading] = useState(false);

  // Datos
  const [cuentas, setCuentas] = useState<CuentaContable[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoContable[]>([]);
  const [balance, setBalance] = useState<any>(null);

  // Forms
  const [formCuenta, setFormCuenta] = useState({
    codigo: '', nombre: '', tipo: '', naturaleza: '', padre_id: ''
  });
  const [formMovimiento, setFormMovimiento] = useState({
    descripcion: '', debe: 0, haber: 0, cuenta_contable_id: ''
  });

  // Filtros
  const [tipoFiltro, setTipoFiltro] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  useEffect(() => {
    loadCuentas();
    loadMovimientos();
  }, []);

  const loadCuentas = async () => {
    const token = getAuthToken();
    const params = new URLSearchParams();
    if (tipoFiltro) params.append('tipo', tipoFiltro);

    const res = await fetch(`${API}/contabilidad/cuentas?${params}`, { headers: { Authorization: `Bearer ${token}` } });
    setCuentas(await res.json());
  };

  const loadMovimientos = async () => {
    const token = getAuthToken();
    const params = new URLSearchParams();
    if (fechaDesde) params.append('fecha_desde', fechaDesde);
    if (fechaHasta) params.append('fecha_hasta', fechaHasta);

    const res = await fetch(`${API}/contabilidad/movimientos?${params}`, { headers: { Authorization: `Bearer ${token}` } });
    setMovimientos(await res.json());
  };

  const loadBalance = async () => {
    const token = getAuthToken();
    const params = new URLSearchParams();
    if (fechaDesde) params.append('fecha_desde', fechaDesde);
    if (fechaHasta) params.append('fecha_hasta', fechaHasta);

    const res = await fetch(`${API}/contabilidad/balance-comprobacion?${params}`, { headers: { Authorization: `Bearer ${token}` } });
    setBalance(await res.json());
  };

  const handleSaveCuenta = async () => {
    if (!formCuenta.codigo || !formCuenta.nombre || !formCuenta.tipo || !formCuenta.naturaleza) {
      alert('Complete todos los campos');
      return;
    }
    setLoading(true);
    const token = getAuthToken();
    try {
      await fetch(`${API}/contabilidad/cuentas`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(formCuenta)
      });
      setFormCuenta({ codigo: '', nombre: '', tipo: '', naturaleza: '', padre_id: '' });
      loadCuentas();
    } catch (err) { alert('Error guardando'); }
    setLoading(false);
  };

  const handleDeleteCuenta = async (id: string) => {
    if (!confirm('¿Eliminar cuenta?')) return;
    const token = getAuthToken();
    await fetch(`${API}/contabilidad/cuentas/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    loadCuentas();
  };

  const handleSaveMovimiento = async () => {
    if (!formMovimiento.descripcion || !formMovimiento.cuenta_contable_id) {
      alert('Complete los campos');
      return;
    }
    setLoading(true);
    const token = getAuthToken();
    try {
      await fetch(`${API}/contabilidad/movimientos`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(formMovimiento)
      });
      setFormMovimiento({ descripcion: '', debe: 0, haber: 0, cuenta_contable_id: '' });
      loadMovimientos();
    } catch (err) { alert('Error guardando'); }
    setLoading(false);
  };

  const tipos = ['Activo', 'Pasivo', 'Patrimonio', 'Ingreso', 'Gasto', 'Costo'];
  const naturalezas = ['Débito', 'Crédito'];
  const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

  const tabs = [
    { id: 'cuentas', label: 'Plan de Cuentas (PUC)' },
    { id: 'movimientos', label: 'Movimientos' },
    { id: 'balance', label: 'Balance de Comprobación' }
  ];

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ marginBottom: '20px' }}>Contabilidad</h1>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #ccc' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); if (tab.id === 'balance') loadBalance(); }}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: activeTab === tab.id ? '#3b82f6' : '#e5e7eb',
              color: activeTab === tab.id ? 'white' : 'black',
              cursor: 'pointer',
              borderRadius: '4px 4px 0 0'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'cuentas' && (
        <div>
          <h3>Plan de Cuentas (PUC)</h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', padding: '15px', background: '#f9fafb', borderRadius: '8px' }}>
            <input placeholder="Código*" value={formCuenta.codigo} onChange={e => setFormCuenta({...formCuenta, codigo: e.target.value})} style={{ padding: '8px' }} />
            <input placeholder="Nombre*" value={formCuenta.nombre} onChange={e => setFormCuenta({...formCuenta, nombre: e.target.value})} style={{ padding: '8px', flex: 1 }} />
            <select value={formCuenta.tipo} onChange={e => setFormCuenta({...formCuenta, tipo: e.target.value})} style={{ padding: '8px' }}>
              <option value="">Tipo*</option>
              {tipos.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={formCuenta.naturaleza} onChange={e => setFormCuenta({...formCuenta, naturaleza: e.target.value})} style={{ padding: '8px' }}>
              <option value="">Naturaleza*</option>
              {naturalezas.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <button onClick={handleSaveCuenta} disabled={loading} style={{ padding: '8px 20px', background: '#22c55e', color: 'white', border: 'none' }}>Agregar</button>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <select value={tipoFiltro} onChange={e => { setTipoFiltro(e.target.value); loadCuentas(); }} style={{ padding: '8px' }}>
              <option value="">Todos los tipos</option>
              {tipos.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                <th style={{ padding: '10px', textAlign: 'left' }}>Código</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Nombre</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Tipo</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Naturaleza</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Padre</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cuentas.map(cuenta => (
                <tr key={cuenta.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '10px', fontFamily: 'monospace' }}>{cuenta.codigo}</td>
                  <td style={{ padding: '10px' }}>{cuenta.nombre}</td>
                  <td style={{ padding: '10px' }}>{cuenta.tipo}</td>
                  <td style={{ padding: '10px' }}>{cuenta.naturaleza}</td>
                  <td style={{ padding: '10px' }}>{cuenta.padre ? `${cuenta.padre.codigo} - ${cuenta.padre.nombre}` : '-'}</td>
                  <td style={{ padding: '10px' }}>
                    <button onClick={() => handleDeleteCuenta(cuenta.id)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer' }}>Eliminar</button>
                  </td>
                </tr>
              ))}
              {cuentas.length === 0 && (
                <tr><td colSpan={6} style={{ padding: '20px', textAlign: 'center' }}>No hay cuentas</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'movimientos' && (
        <div>
          <h3>Registro de Movimientos</h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', padding: '15px', background: '#f9fafb', borderRadius: '8px' }}>
            <select value={formMovimiento.cuenta_contable_id} onChange={e => setFormMovimiento({...formMovimiento, cuenta_contable_id: e.target.value})} style={{ padding: '8px', minWidth: '200px' }}>
              <option value="">Cuenta*</option>
              {cuentas.map(c => <option key={c.id} value={c.id}>{c.codigo} - {c.nombre}</option>)}
            </select>
            <input placeholder="Descripción*" value={formMovimiento.descripcion} onChange={e => setFormMovimiento({...formMovimiento, descripcion: e.target.value})} style={{ padding: '8px', flex: 1 }} />
            <input type="number" placeholder="Débito" value={formMovimiento.debe || ''} onChange={e => setFormMovimiento({...formMovimiento, debe: parseFloat(e.target.value) || 0})} style={{ padding: '8px', width: '100px' }} />
            <input type="number" placeholder="Crédito" value={formMovimiento.haber || ''} onChange={e => setFormMovimiento({...formMovimiento, haber: parseFloat(e.target.value) || 0})} style={{ padding: '8px', width: '100px' }} />
            <button onClick={handleSaveMovimiento} disabled={loading} style={{ padding: '8px 20px', background: '#22c55e', color: 'white', border: 'none' }}>Registrar</button>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} style={{ padding: '8px' }} />
            <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} style={{ padding: '8px' }} />
            <button onClick={loadMovimientos} style={{ padding: '8px 20px', background: '#3b82f6', color: 'white', border: 'none' }}>Filtrar</button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                <th style={{ padding: '10px', textAlign: 'left' }}>Fecha</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Descripción</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Cuenta</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Débito</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Crédito</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.map(mov => (
                <tr key={mov.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '10px' }}>{mov.fecha?.split('T')[0]}</td>
                  <td style={{ padding: '10px' }}>{mov.descripcion}</td>
                  <td style={{ padding: '10px' }}>{mov.cuenta?.codigo} - {mov.cuenta?.nombre}</td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>${mov.debe?.toLocaleString()}</td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>${mov.haber?.toLocaleString()}</td>
                </tr>
              ))}
              {movimientos.length === 0 && (
                <tr><td colSpan={5} style={{ padding: '20px', textAlign: 'center' }}>No hay movimientos</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'balance' && (
        <div>
          <h3>Balance de Comprobación</h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} style={{ padding: '8px' }} />
            <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} style={{ padding: '8px' }} />
            <button onClick={loadBalance} style={{ padding: '8px 20px', background: '#3b82f6', color: 'white', border: 'none' }}>Generar</button>
          </div>
          {balance && (
            <>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f3f4f6' }}>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Código</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Cuenta</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Débito</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Crédito</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {balance.cuentas?.map((c: any) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '10px', fontFamily: 'monospace' }}>{c.codigo}</td>
                      <td style={{ padding: '10px' }}>{c.nombre}</td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>${c.debe?.toLocaleString()}</td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>${c.haber?.toLocaleString()}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>${c.saldo?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#e5e7eb', fontWeight: 'bold' }}>
                    <td colSpan={2} style={{ padding: '10px' }}>TOTALES</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>${balance.totales?.debe?.toLocaleString()}</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>${balance.totales?.haber?.toLocaleString()}</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>${(balance.totales?.debe - balance.totales?.haber)?.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </>
          )}
        </div>
      )}
    </div>
  );
}