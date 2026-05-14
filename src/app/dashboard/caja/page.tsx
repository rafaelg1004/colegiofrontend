
"use client";

import { useEffect, useState } from "react";
import { getAuthToken } from "@/utils/auth";
import { API_URL } from "@/utils/api";
import styles from "./CajaModerna.module.css";

const API = `${API_URL}`;

// ===========================================
// INTERFACES - Sistema Contable
// ===========================================

interface ConceptoCobro {
  id: string;
  nombre: string;
  valor: number;
  aplica_iva: boolean;
  porcentaje_iva: number;
  afecta_inventario?: boolean;
  categoria_inventario_id?: string;
  tipo?: "INGRESO" | "EGRESO";
  cuenta_debito_id?: string;
  cuenta_credito_id?: string;
}

interface Movimiento {
  id: string;
  fecha: string;
  tipo: "INGRESO" | "EGRESO";
  concepto: string;
  monto: number;
  estudiante_nombre?: string;
  observacion?: string;
  numero_comprobante?: string;
  factura_id?: string;
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
  movimientos: Movimiento[];
}

export default function CajaPage() {
  const [activeTab, setActiveTab] = useState("registrar");
  const [loading, setLoading] = useState(false);
  const [resumen, setResumen] = useState<Resumen | null>(null);

  // Formulario
  const [tipo, setTipo] = useState<"INGRESO" | "EGRESO">("INGRESO");
  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState("");
  const [observacion, setObservacion] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);

  // Beneficiario (Estudiante o Empleado)
  const [busquedaBeneficiario, setBusquedaBeneficiario] = useState("");
  const [resultadosBusqueda, setResultadosBusqueda] = useState<any[]>([]);
  const [beneficiarioSeleccionado, setBeneficiarioSeleccionado] = useState<any>(null);
  const [notification, setNotification] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // Comprobante
  const [comprobanteReciente, setComprobanteReciente] = useState<any>(null);
  const [mostrarComprobante, setMostrarComprobante] = useState(false);

  // Inventario
  const [conceptosCobro, setConceptosCobro] = useState<ConceptoCobro[]>([]);
  const [conceptoSeleccionado, setConceptoSeleccionado] = useState<ConceptoCobro | null>(null);
  const [articulosVenta, setArticulosVenta] = useState<any[]>([]);
  const [articulosInventario, setArticulosInventario] = useState<any[]>([]);
  const [mostrarSelectorArticulos, setMostrarSelectorArticulos] = useState(false);

  // Filtros
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [institucion, setInstitucion] = useState<any>(null);
  const [sedes, setSedes] = useState<any[]>([]);

  // Eliminamos listas manuales para usar solo lo de la BD


  useEffect(() => {
    cargarResumen();
    cargarConceptosCobro();
    cargarConfiguracion();
  }, []);

  const cargarConfiguracion = async () => {
    const token = getAuthToken();
    try {
      const resInst = await fetch(`${API}/configuracion/institucion`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resInst.ok) setInstitucion(await resInst.json());

      const resSedes = await fetch(`${API}/configuracion/sedes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resSedes.ok) setSedes(await resSedes.json());
    } catch (err) { console.error(err); }
  };

  const cargarResumen = async () => {
    const token = getAuthToken();
    if (!token) return;
    try {
      const params = new URLSearchParams();
      if (fechaDesde) params.append("fecha_desde", fechaDesde);
      if (fechaHasta) params.append("fecha_hasta", fechaHasta);
      const res = await fetch(`${API}/caja/resumen?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setResumen(await res.json());
    } catch (err) { console.error(err); }
  };

  const cargarConceptosCobro = async () => {
    const token = getAuthToken();
    if (!token) return;
    try {
      const res = await fetch(`${API}/caja/conceptos-cobro`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setConceptosCobro(await res.json());
    } catch (err) { console.error(err); }
  };

  const cargarArticulosPorCategoria = async (categoriaId: string) => {
    const token = getAuthToken();
    try {
      const res = await fetch(`${API}/caja/articulos-por-categoria/${categoriaId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setArticulosInventario(await res.json());
    } catch (err) { console.error(err); }
  };

  const handleConceptoChange = (nombreConcepto: string) => {
    setConcepto(nombreConcepto);
    const found = conceptosCobro.find(c => c.nombre === nombreConcepto);
    console.log("Concepto seleccionado:", found);
    
    if (found?.afecta_inventario) {
      if (found.articulo_inventario_id) {
        // Es un concepto vinculado directamente a un artículo (ej: Matrícula)
        const art = {
          id: found.articulo_inventario_id,
          nombre: found.nombre,
          precio_unitario: found.valor || 0,
          es_servicio: true, // Asumimos servicio si viene de concepto directo por ahora
          ...found // Traer cuentas contables
        };
        handleAddArticulo(art);
        setConcepto(""); // Limpiar para permitir otro
      } else {
        setConceptoSeleccionado(found);
        setMostrarSelectorArticulos(true);
        const catId = (found as any).categoria_inventario_id;
        if (catId) {
          cargarArticulosPorCategoria(catId);
        }
      }
    } else {
      setConceptoSeleccionado(found || null);
      setMostrarSelectorArticulos(false);
      setArticulosInventario([]);
      if (found) {
        handleAddConceptoDirecto(found);
      }
    }
  };

  const handleAddConceptoDirecto = (found: any) => {
    const item = {
      id: found.id,
      nombre: found.nombre,
      cantidad: 1,
      precio_unitario: found.valor || 0,
      es_concepto: true,
      concepto_cobro_id: found.id,
      aplica_iva: found.aplica_iva,
      porcentaje_iva: found.porcentaje_iva,
      cuenta_debito_id: found.cuenta_debito_id,
      cuenta_credito_id: found.cuenta_credito_id
    };
    
    setArticulosVenta(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) {
        return prev.map(i => i.id === item.id ? { ...i, cantidad: i.cantidad + 1 } : i);
      }
      return [...prev, item];
    });
    // Limpiar selección para permitir otro concepto
    setConcepto("");
    setConceptoSeleccionado(null);
  };

  const handleAddArticulo = (art: any) => {
    const existing = articulosVenta.find(a => a.id === art.id);
    let newArticulos;
    if (existing) {
      newArticulos = articulosVenta.map(a => a.id === art.id ? { ...a, cantidad: a.cantidad + 1 } : a);
    } else {
      newArticulos = [...articulosVenta, { ...art, cantidad: 1, precio_unitario: art.precio_venta || art.precio_unitario }];
    }
    updateArticulosYTotal(newArticulos);
  };

  const updateArticulosYTotal = (newArticulos: any[]) => {
    setArticulosVenta(newArticulos);
    const total = newArticulos.reduce((sum, a) => sum + (a.precio_unitario * a.cantidad), 0);
    setMonto(total.toString());
  };

  const handleUpdateCantidad = (index: number, delta: number) => {
    const newArticulos = [...articulosVenta];
    newArticulos[index].cantidad = Math.max(1, newArticulos[index].cantidad + delta);
    updateArticulosYTotal(newArticulos);
  };

  const buscarBeneficiarios = async (q: string) => {
    setBusquedaBeneficiario(q);
    if (q.length < 2) return setResultadosBusqueda([]);
    const token = getAuthToken();
    const endpoint = tipo === "INGRESO" ? "buscar-estudiantes" : "buscar-empleados";
    const res = await fetch(`${API}/caja/${endpoint}?q=${encodeURIComponent(q)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setResultadosBusqueda(await res.json());
  };

  const registrarTransaccion = async () => {
    if (loading) return;
    
    if (articulosVenta.length === 0) {
      showToast("Por favor agregue al menos un concepto o artículo a la lista", "error");
      return;
    }

    // Validar precios de venta
    const itemInvalido = articulosVenta.find(a => !a.precio_unitario || parseFloat(a.precio_unitario) <= 0);
    if (itemInvalido) {
      showToast(`El ítem "${itemInvalido.nombre}" no tiene un precio configurado o es 0. Por favor verifique el inventario.`, "error");
      return;
    }

    if (tipo === "INGRESO" && !beneficiarioSeleccionado) {
      showToast("Debe seleccionar un estudiante para registrar un ingreso", "error");
      return;
    }

    setLoading(true);
    try {
      const token = getAuthToken();
      const nombreCompleto = beneficiarioSeleccionado 
        ? `${beneficiarioSeleccionado.primer_nombre} ${beneficiarioSeleccionado.primer_apellido}` 
        : "PÚBLICO GENERAL";

      const res = await fetch(`${API}/caja/transaccion`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo,
          estudiante_id: tipo === "INGRESO" ? beneficiarioSeleccionado?.id : null,
          empleado_id: tipo === "EGRESO" ? beneficiarioSeleccionado?.id : null,
          estudiante_nombre: nombreCompleto,
          conceptos: articulosVenta.map(av => ({
            articulo_inventario_id: av.es_concepto ? null : av.id,
            concepto_cobro_id: av.es_concepto ? av.id : null,
            descripcion: av.nombre,
            cantidad: av.cantidad,
            valor_unitario: av.precio_unitario,
            valor_iva: av.aplica_iva ? av.precio_unitario * (av.porcentaje_iva / 100) : 0,
            cuenta_debito_id: av.cuenta_debito_id,
            cuenta_credito_id: av.cuenta_credito_id
          })),
          observaciones: observacion,
          metodo_pago: "EFECTIVO"
        })
      });

      if (res.ok) {
        const result = await res.json();
        showToast("Transacción registrada exitosamente", "success");
        setComprobanteReciente({ 
          ...result.data.movimiento, 
          partida_doble: result.data.partida_doble, 
          estudiante_nombre: nombreCompleto,
          conceptos_detalle: articulosVenta // Usamos articulosVenta actual
        });
        setMostrarComprobante(true);
        // Reset form
        setMonto(""); setConcepto(""); setArticulosVenta([]); setBeneficiarioSeleccionado(null); setBusquedaBeneficiario("");
        cargarResumen();
      } else {
        const err = await res.json();
        showToast(err.message || "Error al registrar la transacción", "error");
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const formatMoney = (val: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(val);

  const imprimirRecibo = (datos: any) => {
    const ventana = window.open("", "_blank");
    if (!ventana) return;

    const fecha = new Date(datos.fecha).toLocaleDateString("es-CO", {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    const sedeActual = sedes[0] || {};
    // Parsear detalles si vienen como string JSON (necesario para reimpresiones)
    let detalles = datos.conceptos_detalle;
    if (typeof detalles === 'string') {
      try { detalles = JSON.parse(detalles); } catch (e) { detalles = null; }
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Recibo de Caja - ${datos.numero_comprobante}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&display=swap');
          body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; align-items: start; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 30px; }
          .school-info h1 { margin: 0; font-size: 24px; font-weight: 800; color: #4f46e5; text-transform: uppercase; }
          .school-info p { margin: 5px 0; color: #64748b; font-size: 14px; }
          .receipt-info { text-align: right; }
          .receipt-info h2 { margin: 0; font-size: 20px; color: #1e293b; }
          .receipt-number { font-size: 28px; font-weight: 800; color: #ef4444; margin: 10px 0; }
          
          .client-section { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; background: #f8fafc; padding: 20px; border-radius: 12px; }
          .label { font-size: 12px; text-transform: uppercase; color: #94a3b8; font-weight: 700; margin-bottom: 4px; }
          .value { font-size: 16px; font-weight: 600; color: #1e293b; }

          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { text-align: left; padding: 12px; border-bottom: 2px solid #e2e8f0; color: #64748b; font-size: 12px; text-transform: uppercase; }
          td { padding: 15px 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
          
          .totals { margin-left: auto; width: 300px; }
          .total-row { display: flex; justify-content: space-between; padding: 10px 0; }
          .total-row.grand-total { border-top: 2px solid #e2e8f0; margin-top: 10px; font-size: 20px; font-weight: 800; color: #4f46e5; }

          .footer { margin-top: 60px; display: grid; grid-template-columns: 1fr 1fr; gap: 60px; }
          .signature { border-top: 1px solid #cbd5e1; text-align: center; padding-top: 10px; font-size: 12px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="school-info">
            <h1>${institucion?.nombre || "INSTITUCIÓN EDUCATIVA"}</h1>
            <p><strong>NIT:</strong> ${institucion?.nit || "000.000.000-0"}</p>
            <p><strong>Sede:</strong> ${sedeActual.nombre || "Sede Principal"}</p>
            <p><strong>Dirección:</strong> ${sedeActual.direccion || institucion?.direccion || ""}</p>
            <p><strong>Tel:</strong> ${sedeActual.telefono || institucion?.telefono || ""}</p>
          </div>
          <div class="receipt-info">
            <h2>RECIBO DE CAJA</h2>
            <div class="receipt-number">${datos.numero_comprobante}</div>
            <p style="margin:0; font-weight:600;">FECHA: ${fecha}</p>
          </div>
        </div>

        <div class="client-section">
          <div>
            <div class="label">Beneficiario / Pagador</div>
            <div class="value">${datos.estudiante_nombre || "PÚBLICO GENERAL"}</div>
          </div>
          <div>
            <div class="label">Concepto General</div>
            <div class="value">${datos.concepto}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Descripción</th>
              <th style="text-align:center;">Cant.</th>
              <th style="text-align:right;">V. Unitario</th>
              <th style="text-align:right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${(detalles || [{descripcion: datos.concepto, cantidad: 1, valor_unitario: datos.monto}]).map((c: any) => `
              <tr>
                <td>${c.descripcion}</td>
                <td style="text-align: center;">${c.cantidad}</td>
                <td style="text-align: right;">${formatMoney(c.valor_unitario)}</td>
                <td style="text-align: right;">${formatMoney(c.cantidad * c.valor_unitario)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>${formatMoney(datos.monto)}</span>
          </div>
          <div class="total-row">
            <span>IVA:</span>
            <span>$ 0</span>
          </div>
          <div class="total-row grand-total">
            <span>TOTAL:</span>
            <span>${formatMoney(datos.monto)}</span>
          </div>
        </div>

        <div style="margin-top: 40px; font-size: 14px; color: #64748b;">
          <strong>Observaciones:</strong> ${datos.observacion || "Sin observaciones adicionales."}
        </div>

        <div class="footer">
          <div class="signature">
            Firma Autorizada
          </div>
          <div class="signature">
            Recibí Conforme
          </div>
        </div>

        <script>
          window.onload = () => { window.print(); };
        </script>
      </body>
      </html>
    `;

    ventana.document.write(html);
    ventana.document.close();
  };

  return (
    <div className={styles.container}>
      {notification && (
        <div className={`${styles.toast} ${styles['toast_' + notification.type]}`}>
          {notification.type === 'success' ? '✅' : notification.type === 'error' ? '❌' : 'ℹ️'} {notification.msg}
          <button onClick={() => setNotification(null)}>×</button>
        </div>
      )}
      <header className={styles.header}>
        <h1><span className={styles.headerIcon}>🏦</span> Gestión de Caja</h1>
        <p>Administración financiera y contabilidad en tiempo real</p>
      </header>

      {resumen && (
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
      )}

      <div className={styles.tabsContainer}>
        <button className={`${styles.tab} ${activeTab === 'registrar' ? styles.tabActivo : ''}`} onClick={() => setActiveTab('registrar')}>✨ Registrar Movimiento</button>
        <button className={`${styles.tab} ${activeTab === 'movimientos' ? styles.tabActivo : ''}`} onClick={() => setActiveTab('movimientos')}>📑 Historial</button>
      </div>

      {activeTab === "registrar" && (
        <div className={styles.formContainer}>
          <div className={styles.formGroup}>
            <label>Tipo de Transacción</label>
            <div className={styles.tipoButtons}>
              <button className={tipo === "INGRESO" ? styles.activeTipo : ""} onClick={() => { setTipo("INGRESO"); setBeneficiarioSeleccionado(null); setBusquedaBeneficiario(""); }}>📥 Ingreso</button>
              <button className={tipo === "EGRESO" ? styles.activeTipo : ""} onClick={() => { setTipo("EGRESO"); setBeneficiarioSeleccionado(null); setBusquedaBeneficiario(""); }}>📤 Egreso</button>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Fecha</label>
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
          </div>

          <div className={styles.formGroup}>
            <label>Concepto</label>
            <select value={concepto} onChange={e => handleConceptoChange(e.target.value)}>
              <option value="">Seleccione un concepto...</option>
              {conceptosCobro.filter(c => c.tipo === tipo || (!c.tipo && tipo === "INGRESO")).map(c => (
                <option key={c.id} value={c.nombre}>{c.nombre}</option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
            <label>{tipo === "INGRESO" ? "Estudiante" : "Beneficiario (Empleado/Proveedor)"}</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                value={busquedaBeneficiario} 
                onChange={e => buscarBeneficiarios(e.target.value)} 
                placeholder={`Buscar ${tipo === "INGRESO" ? "estudiante" : "empleado o escribir nombre"}...`} 
              />
              {resultadosBusqueda.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', zIndex: 10, boxShadow: '0 10px 20px rgba(0,0,0,0.1)', borderRadius: '12px', marginTop: '5px', maxHeight: '200px', overflowY: 'auto' }}>
                  {resultadosBusqueda.map(r => (
                    <div key={r.id} style={{ padding: '10px 15px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }} onClick={() => {
                      setBeneficiarioSeleccionado(r);
                      setBusquedaBeneficiario(`${r.primer_apellido} ${r.primer_nombre}`);
                      setResultadosBusqueda([]);
                    }}>
                      {r.primer_apellido} {r.primer_nombre} {r.cargo ? `- ${r.cargo}` : ""} - {r.numero_documento}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {mostrarSelectorArticulos && (
            <div className={styles.inventarioSelector}>
              <label>📦 Selección de Artículos del Inventario</label>
              <div className={styles.articulosGrid}>
                {articulosInventario.length > 0 ? (
                  articulosInventario.map(art => (
                    <div key={art.id} className={styles.articuloCard} onClick={() => handleAddArticulo(art)}>
                      <div className={styles.articuloHeader}>
                        <span className={styles.articuloNombre}>{art.nombre}</span>
                        {art.es_servicio ? (
                          <span className={styles.badgeServicio}>SERVICIO</span>
                        ) : (
                          <span className={styles.articuloStock}>Stock: {art.cantidad_stock}</span>
                        )}
                      </div>
                      <div className={styles.articuloFooter}>
                        <span className={styles.articuloPrecio}>{formatMoney(art.precio_venta || art.precio_unitario)}</span>
                        <button className={styles.btnAddArt}>+</button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ gridColumn: 'span 3', padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                    No se encontraron artículos en esta categoría con stock disponible.
                  </div>
                )}
              </div>
            </div>
          )}

          {articulosVenta.length > 0 && (
            <div className={styles.cartSection} style={{ gridColumn: 'span 2', marginTop: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '1rem', fontWeight: 700, fontSize: '1.1rem' }}>🛒 Detalle de la Transacción</label>
              <div className={styles.tableWrapper}>
                <table className={styles.table} style={{ borderSpacing: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ background: '#f8fafc' }}>Concepto / Artículo</th>
                      <th style={{ background: '#f8fafc' }}>Cant</th>
                      <th style={{ background: '#f8fafc' }}>Precio Unitario</th>
                      <th style={{ background: '#f8fafc' }}>Subtotal</th>
                      <th style={{ background: '#f8fafc' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {articulosVenta.map((a, i) => (
                      <tr key={i}>
                        <td style={{ background: 'white', borderBottom: '1px solid #f1f5f9' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 600 }}>{a.nombre}</span>
                            {a.es_servicio && <span style={{ fontSize: '0.7rem', color: '#4f46e5', fontWeight: 700 }}>SERVICIO</span>}
                          </div>
                        </td>
                        <td style={{ background: 'white', borderBottom: '1px solid #f1f5f9' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <button onClick={() => handleUpdateCantidad(i, -1)} style={{ padding: '2px 8px', borderRadius: '4px', border: '1px solid #ddd', background: '#f8fafc' }}>-</button>
                            <span style={{ minWidth: '20px', textAlign: 'center', fontWeight: 700 }}>{a.cantidad}</span>
                            <button onClick={() => handleUpdateCantidad(i, 1)} style={{ padding: '2px 8px', borderRadius: '4px', border: '1px solid #ddd', background: '#f8fafc' }}>+</button>
                          </div>
                        </td>
                        <td style={{ background: 'white', borderBottom: '1px solid #f1f5f9', fontWeight: 700 }}>{formatMoney(a.precio_unitario)}</td>
                        <td style={{ background: 'white', borderBottom: '1px solid #f1f5f9', fontWeight: 800, color: '#4f46e5' }}>{formatMoney(a.precio_unitario * a.cantidad)}</td>
                        <td style={{ background: 'white', borderBottom: '1px solid #f1f5f9' }}>
                          <button onClick={() => updateArticulosYTotal(articulosVenta.filter((_, idx) => idx !== i))} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
            <label>Observaciones</label>
            <textarea value={observacion} onChange={e => setObservacion(e.target.value)} placeholder="Detalles adicionales del movimiento..." rows={3} />
          </div>

          <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
            <label>Monto Total (Auto-calculado)</label>
            <input 
              type="text" 
              value={formatMoney(parseFloat(monto) || 0)} 
              readOnly 
              style={{ background: '#f1f5f9', fontWeight: 800, fontSize: '1.8rem', color: '#4f46e5', textAlign: 'right', border: '2px solid #e2e8f0' }} 
            />
          </div>

          <button className={styles.btnRegistrar} onClick={registrarTransaccion} disabled={loading}>
            {loading ? "Procesando..." : "✅ Confirmar y Registrar Transacción"}
          </button>
        </div>
      )}

      {activeTab === "movimientos" && (
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
            <button className={styles.tabActivo} style={{ padding: '0.75rem 1.5rem', borderRadius: '12px' }} onClick={cargarResumen}>🔍 Filtrar</button>
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
                {resumen?.movimientos.map(mov => (
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
      )}

      {mostrarComprobante && comprobanteReciente && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.comprobanteTitle}>
              <h2>¡Registro Exitoso!</h2>
              <p>Comprobante generado correctamente</p>
            </div>
            
            <div className={styles.comprobanteMonto}>
              <label>TOTAL</label>
              <span>{formatMoney(comprobanteReciente.monto)}</span>
            </div>

            <div className={styles.comprobanteDato}>
              <label>Referencia:</label>
              <span>{comprobanteReciente.numero_comprobante}</span>
            </div>
            <div className={styles.comprobanteDato}>
              <label>Beneficiario:</label>
              <span>{comprobanteReciente.estudiante_nombre}</span>
            </div>
            <div className={styles.comprobanteDato}>
              <label>Concepto:</label>
              <span>{comprobanteReciente.concepto}</span>
            </div>
            {comprobanteReciente.partida_doble && (
              <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '16px' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '0.5rem' }}>REGISTRO CONTABLE (Partida Doble)</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span>Débito: {comprobanteReciente.partida_doble.debe?.[0]?.cuenta}</span>
                  <span>{formatMoney(comprobanteReciente.partida_doble.debe?.[0]?.valor)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                  <span>Crédito: {comprobanteReciente.partida_doble.haber?.[0]?.cuenta}</span>
                  <span>{formatMoney(comprobanteReciente.partida_doble.haber?.[0]?.valor)}</span>
                </div>
              </div>
            )}

            <div className={styles.modalActions} style={{ marginTop: '2rem' }}>
              <button className={styles.btnModalPrimary} onClick={() => imprimirRecibo(comprobanteReciente)}>🖨️ Imprimir Recibo</button>
              <button className={styles.btnModalSecondary} onClick={() => setMostrarComprobante(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
