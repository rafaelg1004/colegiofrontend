"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FinancieroService } from "@/services/financiero.service";
import { useCajaContext } from "@/context/CajaContext";
import styles from "./FinanzasDashboard.module.css";

const formatMoney = (val: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(val || 0);

const MESES = [
  { id: 1, nombre: "Enero" },
  { id: 2, nombre: "Febrero" },
  { id: 3, nombre: "Marzo" },
  { id: 4, nombre: "Abril" },
  { id: 5, nombre: "Mayo" },
  { id: 6, nombre: "Junio" },
  { id: 7, nombre: "Julio" },
  { id: 8, nombre: "Agosto" },
  { id: 9, nombre: "Septiembre" },
  { id: 10, nombre: "Octubre" },
  { id: 11, nombre: "Noviembre" },
  { id: 12, nombre: "Diciembre" },
];

export const FinanzasDashboard = () => {
  const router = useRouter();
  const { setNavState } = useCajaContext();
  const [activeTab, setActiveTab] = useState<'resumen' | 'pensiones'>('pensiones');
  const [stats, setStats] = useState<any>(null);
  const [deudores, setDeudores] = useState<any[]>([]);
  const [grupos, setGrupos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showFacturacion, setShowFacturacion] = useState(false);
  const [showConfirmacionExtra, setShowConfirmacionExtra] = useState(false);
  const [opcionesFacturacion, setOpcionesFacturacion] = useState<any[]>([]);
  const [idSeleccionado, setIdSeleccionado] = useState<string>("");
  const [tipoSeleccionado, setTipoSeleccionado] = useState<'articulo' | 'concepto'>('articulo');
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // Filtros para la vista de pensiones
  const [mesFiltro, setMesFiltro] = useState<number>(new Date().getMonth() + 1);
  const [anioFiltro, setAnioFiltro] = useState<number>(new Date().getFullYear());
  const [aniosLectivos, setAniosLectivos] = useState<number[]>([]);
  const [estadoFiltro, setEstadoFiltro] = useState<string>('Todos');
  const [grupoFiltro, setGrupoFiltro] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchAniosLectivos = async () => {
    try {
      const data = await FinancieroService.getAniosLectivos();
      const listaAnios = (data || [])
        .map((a: any) => Number(a.anio))
        .filter((n: number) => !isNaN(n) && n > 0);
      if (listaAnios.length > 0) {
        const aniosUnicos = Array.from(new Set<number>(listaAnios)).sort((a, b) => b - a);
        setAniosLectivos(aniosUnicos);
        if (!aniosUnicos.includes(anioFiltro)) {
          setAnioFiltro(aniosUnicos[0]);
        }
      }
    } catch (err) {
      console.error("Error cargando años lectivos:", err);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await FinancieroService.getResumen();
      setStats(data);
    } catch (err) {
      console.error("Error cargando resumen:", err);
    }
  };

  const fetchGrupos = async () => {
    try {
      const data = await FinancieroService.getGrupos();
      setGrupos(data || []);
    } catch (err) {
      console.error("Error cargando grupos:", err);
    }
  };

  const fetchDeudores = async () => {
    try {
      const data = await FinancieroService.getDeudores({
        mes: mesFiltro,
        anio: anioFiltro,
        estado: estadoFiltro,
        grupo_id: grupoFiltro,
      });
      setDeudores(data.deudores || []);
    } catch (err) {
      console.error("Error cargando deudores:", err);
    }
  };

  const fetchOpcionesFacturacion = async () => {
    try {
      const opciones = await FinancieroService.getArticulosServicios();
      setOpcionesFacturacion(opciones);

      const pension = opciones.find((o: any) => o.nombre.toLowerCase().includes('pension') || o.nombre.toLowerCase().includes('pensión'));
      if (pension) {
        setIdSeleccionado(pension.id);
        setTipoSeleccionado('articulo');
      } else if (opciones.length > 0) {
        setIdSeleccionado(opciones[0].id);
        setTipoSeleccionado('articulo');
      }
    } catch (err) {
      console.error("Error cargando opciones de facturación:", err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const initData = async () => {
      setLoading(true);
      try {
        await Promise.allSettled([
          fetchStats(), 
          fetchGrupos(), 
          fetchDeudores(), 
          fetchOpcionesFacturacion(),
          fetchAniosLectivos()
        ]);
      } catch (err) {
        console.error("Error al inicializar Finanzas:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    initData();

    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    fetchDeudores();
  }, [mesFiltro, anioFiltro, estadoFiltro, grupoFiltro]);

  const handleFacturacionMasiva = () => {
    setShowFacturacion(true);
  };

  const handleConfirmarFacturacion = () => {
    if (!idSeleccionado) {
      setAlertMessage('Por favor selecciona un concepto');
      return;
    }
    setShowConfirmacionExtra(true);
  };

  const ejecutarFacturacionMasiva = async () => {
    setSaving(true);
    try {
      const data = await FinancieroService.generarPensionesMasivas({
        mes: mesFiltro,
        anio: anioFiltro,
        articulo_id: tipoSeleccionado === 'articulo' ? idSeleccionado : undefined,
        concepto_cobro_id: tipoSeleccionado === 'concepto' ? idSeleccionado : undefined,
      });

      setAlertMessage(`Proceso completado. ${data.generadas} facturas nuevas generadas.`);
      setShowConfirmacionExtra(false);
      setShowFacturacion(false);
      fetchStats();
      fetchDeudores();
    } catch (err: any) {
      setAlertMessage(err.message || 'Error al generar facturas');
    } finally {
      setSaving(false);
    }
  };

  // Filtrado local por término de búsqueda
  const filteredDeudores = deudores.filter((d) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.estudiante_nombre?.toLowerCase().includes(q) ||
      d.estudiante_documento?.toLowerCase().includes(q) ||
      d.acudiente_nombre?.toLowerCase().includes(q) ||
      d.acudiente_documento?.toLowerCase().includes(q) ||
      d.acudiente_celular?.toLowerCase().includes(q) ||
      d.numero_factura?.toLowerCase().includes(q)
    );
  });

  // Estadísticas del listado filtrado
  const cantAldia = filteredDeudores.filter(d => {
    const st = (d.estado || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    return st === 'al dia';
  }).length;

  const cantDebe = filteredDeudores.filter(d => {
    const st = (d.estado || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    return st === 'debe' || st === 'en mora' || st === 'sin factura';
  }).length;

  const totalDeudaFiltrada = filteredDeudores.reduce((sum, d) => sum + Number(d.deuda || 0), 0);

  // Exportar a Excel (CSV con formato BOM UTF-8)
  const handleExportExcel = () => {
    if (!filteredDeudores || filteredDeudores.length === 0) {
      setAlertMessage("No hay registros en la lista para exportar.");
      return;
    }

    const headers = [
      "Estudiante",
      "Documento Estudiante",
      "Grado",
      "Acudiente (Padre)",
      "Documento Acudiente",
      "Celular Acudiente",
      "Correo Acudiente",
      "N° Factura",
      "Concepto",
      "Monto Total (COP)",
      "Monto Pagado (COP)",
      "Deuda Pendiente (COP)",
      "Estado Pago",
      "Fecha Emisión",
      "Fecha Último Pago"
    ];

    const rows = filteredDeudores.map((item) => [
      `"${(item.estudiante_nombre || '').replace(/"/g, '""')}"`,
      `"${(item.estudiante_documento || '').replace(/"/g, '""')}"`,
      `"${(item.grado || '').replace(/"/g, '""')}"`,
      `"${(item.acudiente_nombre || '').replace(/"/g, '""')}"`,
      `"${(item.acudiente_documento || '').replace(/"/g, '""')}"`,
      `"${(item.acudiente_celular || '').replace(/"/g, '""')}"`,
      `"${(item.acudiente_correo || '').replace(/"/g, '""')}"`,
      `"${(item.numero_factura || '').replace(/"/g, '""')}"`,
      `"${(item.concepto || '').replace(/"/g, '""')}"`,
      item.monto_total || 0,
      item.monto_pagado || 0,
      item.deuda || 0,
      `"${(item.estado || '').replace(/"/g, '""')}"`,
      `"${item.fecha_emision ? new Date(item.fecha_emision).toLocaleDateString('es-CO') : 'N/A'}"`,
      `"${item.fecha_pago ? new Date(item.fecha_pago).toLocaleDateString('es-CO') : 'N/A'}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const mesNombre = MESES.find(m => m.id === Number(mesFiltro))?.nombre || mesFiltro;
    link.href = url;
    link.setAttribute('download', `Estado_Pensiones_${mesNombre}_${anioFiltro}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading)
    return <div className={styles.loading}>Cargando datos financieros...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Gestión Financiera & Pensiones</h1>
        <p>Control de recaudo, facturación masiva y seguimiento de estado por acudiente</p>
      </header>

      {/* Pestañas de Navegación */}
      <nav className={styles.tabsNav}>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'pensiones' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('pensiones')}
        >
          <span>👨‍👩‍👧</span> Control de Pensiones & Acudientes
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'resumen' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('resumen')}
        >
          <span>📊</span> Resumen Financiero Global
        </button>
      </nav>

      {/* TAB 1: RESUMEN FINANCIERO GLOBAL */}
      {activeTab === 'resumen' && stats && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Total Facturado</span>
            <span className={styles.statValue}>
              {formatMoney(stats.total_facturado)}
            </span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Total Recaudado</span>
            <span className={styles.statValue + " " + styles.collected}>
              {formatMoney(stats.total_recaudado)}
            </span>
            <div className={styles.progress}>
              <div
                className={styles.bar}
                style={{ width: `${stats.porcentaje_recaudo}%` }}
              ></div>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Pendiente por Cobrar</span>
            <span className={styles.statValue + " " + styles.pending}>
              {formatMoney(stats.total_pendiente)}
            </span>
          </div>
        </div>
      )}

      {/* TAB 2: CONTROL DE PENSIONES Y ACUDIENTES */}
      {activeTab === 'pensiones' && (
        <>
          {/* Tarjetas resumen del filtro */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Total Estudiantes</span>
              <span className={styles.statValue}>{filteredDeudores.length}</span>
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

          {/* Barra de Filtros */}
          <div className={styles.filtersBar}>
            <div className={styles.filterGroup}>
              <select 
                value={mesFiltro} 
                onChange={(e) => setMesFiltro(Number(e.target.value))}
                className={styles.selectInput}
              >
                {MESES.map(m => (
                  <option key={m.id} value={m.id}>{m.nombre}</option>
                ))}
              </select>

              <select 
                value={anioFiltro} 
                onChange={(e) => setAnioFiltro(Number(e.target.value))}
                className={styles.selectInput}
              >
                {(aniosLectivos.length > 0 ? aniosLectivos : [new Date().getFullYear()]).map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>

              <select 
                value={estadoFiltro} 
                onChange={(e) => setEstadoFiltro(e.target.value)}
                className={styles.selectInput}
              >
                <option value="Todos">Todos los Estados</option>
                <option value="Debe">Quiénes Deben (Pendientes)</option>
                <option value="Al dia">Quiénes Están al Día</option>
                <option value="Sin Factura">Sin Factura Generada</option>
              </select>

              <select 
                value={grupoFiltro} 
                onChange={(e) => setGrupoFiltro(e.target.value)}
                className={styles.selectInput}
              >
                <option value="">Todos los Grados</option>
                {grupos.map(g => (
                  <option key={g.id} value={g.id}>{g.nombre}</option>
                ))}
              </select>

              <input 
                type="text"
                placeholder="🔍 Buscar estudiante o acudiente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            <button 
              className={styles.exportBtn}
              onClick={handleExportExcel}
              title="Exportar listado a Excel"
            >
              <span>📥</span> Exportar a Excel
            </button>
          </div>
        </>
      )}

      {/* Tabla Principal */}
      <div className={styles.mainGrid}>
        <div className={styles.tableSection}>
          <div className={styles.sectionHeader}>
            <h3>
              {activeTab === 'pensiones' 
                ? `Listado de Pensiones (${MESES.find(m => m.id === mesFiltro)?.nombre} ${anioFiltro})`
                : 'Estudiantes en Mora / Deudores (Mes Actual)'}
            </h3>
            <button
              className={styles.actionBtn}
              onClick={handleFacturacionMasiva}
              disabled={saving}
            >
              {saving ? 'Generando...' : 'Facturación Masiva Pensión'}
            </button>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>N° Factura</th>
                  <th>Estudiante</th>
                  <th>Grado</th>
                  <th>Padre / Acudiente</th>
                  <th>Mes Evaluado</th>
                  <th>Monto Total</th>
                  <th>Pagado</th>
                  <th>Deuda</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeudores.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '2rem' }}>
                      No se encontraron registros para los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredDeudores.map((item) => (
                    <tr key={item.estudiante_id + (item.factura_id || '')}>
                      <td>
                        <strong style={{ fontSize: '0.85rem' }}>{item.numero_factura}</strong>
                      </td>
                      <td>
                        <div>
                          <strong>{item.estudiante_nombre}</strong>
                          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Doc: {item.estudiante_documento || 'N/A'}</div>
                        </div>
                      </td>
                      <td>{item.grado}</td>
                      <td>
                        <div className={styles.acudienteBox}>
                          <span className={styles.acudienteName}>{item.acudiente_nombre}</span>
                          <div className={styles.acudienteSub}>
                            <span>Doc: {item.acudiente_documento}</span>
                            {item.acudiente_celular && item.acudiente_celular !== 'N/A' && (
                              <a 
                                href={`https://wa.me/57${item.acudiente_celular.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className={styles.whatsappLink}
                                title="Enviar mensaje por WhatsApp"
                              >
                                📱 {item.acudiente_celular}
                              </a>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ 
                          fontSize: '0.82rem', 
                          fontWeight: 600, 
                          color: '#1e293b', 
                          backgroundColor: '#f1f5f9', 
                          padding: '4px 8px', 
                          borderRadius: '6px', 
                          display: 'inline-block' 
                        }}>
                          📅 {MESES.find(m => m.id === mesFiltro)?.nombre} {anioFiltro}
                        </span>
                      </td>
                      <td>{formatMoney(item.monto_total)}</td>
                      <td style={{ color: '#16a34a', fontWeight: 600 }}>{formatMoney(item.monto_pagado)}</td>
                      <td className={styles.amount} style={{ color: item.deuda > 0 ? '#dc2626' : '#16a34a' }}>
                        {formatMoney(item.deuda)}
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${
                          item.estado === 'Al día' 
                            ? styles.statusAldia 
                            : item.estado === 'Debe' 
                            ? styles.statusDebe 
                            : item.estado === 'En mora'
                            ? styles.statusEnmora
                            : styles.statusSinfactura
                        }`}>
                          {item.estado === 'Al día' ? '✅ Al día' : item.estado === 'Debe' ? '⏳ Debe' : item.estado === 'En mora' ? '🔴 En mora' : '⚪ Sin Factura'}
                        </span>
                      </td>
                      <td>
                        <button 
                          className={styles.payBtn}
                          style={{
                            backgroundColor: item.estado === 'Al día' ? '#64748b' : '#16a34a',
                            color: '#ffffff',
                            fontWeight: 600,
                            fontSize: '0.82rem',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }}
                          onClick={() => {
                            const mesNombre = MESES.find(m => m.id === mesFiltro)?.nombre || '';
                            setNavState({
                              estudianteId: item.estudiante_id,
                              facturaId: item.factura_id || null,
                              grado: item.grado || null,
                              mes: mesNombre || null,
                              anio: String(anioFiltro),
                            });
                            router.push('/dashboard/caja');
                          }}
                          title={`Ir a Caja a cobrar pensión de ${item.estudiante_nombre}`}
                        >
                          💳 {item.estado === 'Al día' ? 'Ver en Caja' : 'Ir a Caja 💵'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Facturación Masiva */}
      {showFacturacion && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Facturación Masiva</h2>
            </div>
            <div className={styles.modalBody}>
              <div style={{ 
                background: '#fff1f2', 
                border: '2px solid #ef4444', 
                padding: '1.5rem', 
                borderRadius: '16px',
                marginBottom: '1.5rem',
                display: 'flex',
                gap: '1rem',
                alignItems: 'center',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}>
                <span style={{ fontSize: '2.5rem' }}>⚠️</span>
                <div>
                  <strong style={{ color: '#991b1b', display: 'block', marginBottom: '0.25rem', fontSize: '1.1rem' }}>¡ATENCIÓN! OPERACIÓN MASIVA</strong>
                  <p style={{ color: '#b91c1c', fontSize: '0.95rem', margin: 0, fontWeight: 500 }}>
                    Se generarán facturas para <strong>TODOS</strong> los estudiantes activos para el período <strong>{MESES.find(m => m.id === mesFiltro)?.nombre} / {anioFiltro}</strong>. 
                  </p>
                </div>
              </div>

              <p style={{ marginBottom: '1rem', fontWeight: 600, color: '#0f172a' }}>
                Selecciona el concepto de cobro:
              </p>
              
              <div className={styles.formGroup}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Servicio / Concepto</label>
                <select 
                  value={`${tipoSeleccionado}:${idSeleccionado}`}
                  onChange={(e) => {
                    const [tipo, id] = e.target.value.split(':');
                    setTipoSeleccionado(tipo as any);
                    setIdSeleccionado(id);
                  }}
                  className={styles.modalSelect}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    borderRadius: '10px', 
                    border: '1px solid #e2e8f0',
                    fontSize: '1rem'
                  }}
                >
                  <option value="">Seleccionar...</option>
                  {opcionesFacturacion.map(opt => (
                    <option key={`${opt.tipo}:${opt.id}`} value={`${opt.tipo}:${opt.id}`}>
                      {opt.nombre} ({opt.tipo === 'articulo' ? 'Servicio' : 'Concepto'})
                    </option>
                  ))}
                </select>
              </div>

              <p style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: '#94a3b8' }}>
                * El sistema generará una factura pendiente para cada estudiante activo.
                Se omitirán estudiantes que ya tengan este cobro registrado en el mes.
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.btnSecondary} 
                onClick={() => setShowFacturacion(false)}
                disabled={saving}
              >
                Cancelar
              </button>
              <button 
                className={styles.btnPrimary} 
                onClick={handleConfirmarFacturacion}
                disabled={saving}
              >
                {saving ? "Generando..." : "Confirmar y Generar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Extra de Confirmación */}
      {showConfirmacionExtra && (
        <div className={styles.modalOverlay} style={{ zIndex: 1100 }}>
          <div className={styles.modalContent} style={{ maxWidth: '400px' }}>
            <div className={styles.modalHeader} style={{ background: '#fee2e2' }}>
              <h2 style={{ color: '#991b1b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>❓</span> Confirmación Final
              </h2>
            </div>
            <div className={styles.modalBody}>
              <p style={{ fontSize: '1.1rem', color: '#1e293b', fontWeight: 500, textAlign: 'center' }}>
                ¿Estás absolutamente seguro de que deseas generar las facturas masivas?
              </p>
              <p style={{ color: '#64748b', fontSize: '0.9rem', textAlign: 'center', marginTop: '1rem' }}>
                Esta acción creará un registro de deuda para cada estudiante activo para el mes de {MESES.find(m => m.id === mesFiltro)?.nombre} {anioFiltro}.
              </p>
            </div>
            <div className={styles.modalFooter} style={{ justifyContent: 'center' }}>
              <button 
                className={styles.btnSecondary} 
                onClick={() => setShowConfirmacionExtra(false)}
                disabled={saving}
              >
                No, cancelar
              </button>
              <button 
                className={styles.btnPrimary} 
                style={{ background: '#dc2626' }}
                onClick={ejecutarFacturacionMasiva}
                disabled={saving}
              >
                {saving ? "Generando..." : "Sí, generar ahora"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {alertMessage && (
        <div className={styles.modalOverlay} style={{ zIndex: 1200 }}>
          <div className={styles.modalContent} style={{ maxWidth: '400px' }}>
            <div className={styles.modalHeader}>
              <h2>Notificación</h2>
            </div>
            <div className={styles.modalBody}>
              <p style={{ fontSize: '1.1rem', color: '#1e293b', textAlign: 'center' }}>
                {alertMessage}
              </p>
            </div>
            <div className={styles.modalFooter} style={{ justifyContent: 'center' }}>
              <button 
                className={styles.btnPrimary} 
                onClick={() => setAlertMessage(null)}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
