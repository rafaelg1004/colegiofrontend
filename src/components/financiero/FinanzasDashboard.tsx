"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { FinancieroService } from "@/services/financiero.service";
import { useCajaContext } from "@/context/CajaContext";
import styles from "./FinanzasDashboard.module.css";

import { FinanzasStatsCards } from "./subcomponents/FinanzasStatsCards";
import { FinanzasFiltersBar } from "./subcomponents/FinanzasFiltersBar";
import { FinanzasPensionesTable } from "./subcomponents/FinanzasPensionesTable";
import { ReciboCajaModal } from "./subcomponents/ReciboCajaModal";
import { FacturacionMasivaModal } from "./subcomponents/FacturacionMasivaModal";

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

  // Filtros
  const [mesFiltro, setMesFiltro] = useState<number>(new Date().getMonth() + 1);
  const [anioFiltro, setAnioFiltro] = useState<number>(new Date().getFullYear());
  const [aniosLectivos, setAniosLectivos] = useState<number[]>([]);
  const [estadoFiltro, setEstadoFiltro] = useState<string>('Todos');
  const [grupoFiltro, setGrupoFiltro] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loadingDeudores, setLoadingDeudores] = useState<boolean>(false);
  const [exportingAnual, setExportingAnual] = useState<boolean>(false);
  
  // Recibo de caja modal state
  const [previewDataReceipt, setPreviewDataReceipt] = useState<any>(null);
  const [showPreviewReceipt, setShowPreviewReceipt] = useState<boolean>(false);
  
  const activeRequestRef = useRef(0);
  const [dataAnualMeses, setDataAnualMeses] = useState<{ [mes: number]: any[] }>({});

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

  const fetchDeudoresAnualCompleto = async (
    anio = anioFiltro,
    grupo = grupoFiltro
  ) => {
    const requestId = ++activeRequestRef.current;
    setLoadingDeudores(true);
    try {
      const resultados = await Promise.all(
        MESES.map(m => FinancieroService.getDeudores({
          mes: m.id,
          anio,
          estado: 'Todos',
          grupo_id: grupo || undefined,
        }))
      );

      if (requestId === activeRequestRef.current) {
        const mapa: { [mes: number]: any[] } = {};
        resultados.forEach((res: any, idx: number) => {
          mapa[idx + 1] = res?.deudores || [];
        });
        setDataAnualMeses(mapa);
      }
    } catch (err) {
      console.error("Error cargando pensiones del año:", err);
    } finally {
      if (requestId === activeRequestRef.current) {
        setLoadingDeudores(false);
      }
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
          fetchDeudoresAnualCompleto(anioFiltro, grupoFiltro), 
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
    fetchDeudoresAnualCompleto(anioFiltro, grupoFiltro);
  }, [anioFiltro, grupoFiltro]);

  useEffect(() => {
    const listadoMes = dataAnualMeses[mesFiltro] || [];
    setDeudores(listadoMes);
  }, [mesFiltro, dataAnualMeses]);

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
      fetchDeudoresAnualCompleto(anioFiltro, grupoFiltro);
    } catch (err: any) {
      setAlertMessage(err.message || 'Error al generar facturas');
    } finally {
      setSaving(false);
    }
  };

  // Filtrado instantáneo en memoria
  const filteredDeudores = (deudores || []).filter((d) => {
    if (!d) return false;
    if (estadoFiltro && estadoFiltro !== 'Todos') {
      const efNorm = estadoFiltro.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
      const stNorm = (d.estado || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
      if (efNorm === 'debe' && !(stNorm === 'debe' || stNorm === 'en mora' || stNorm === 'sin factura' || Number(d.deuda || 0) > 0)) {
        return false;
      }
      if (efNorm === 'al dia' && stNorm !== 'al dia') {
        return false;
      }
      if (efNorm === 'sin factura' && stNorm !== 'sin factura') {
        return false;
      }
    }

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (d.estudiante_nombre || '').toLowerCase().includes(q) ||
      (d.estudiante_documento || '').toLowerCase().includes(q) ||
      (d.acudiente_nombre || '').toLowerCase().includes(q) ||
      (d.acudiente_documento || '').toLowerCase().includes(q) ||
      (d.acudiente_celular || '').toLowerCase().includes(q) ||
      (d.numero_factura || '').toLowerCase().includes(q)
    );
  });

  const cantAldia = filteredDeudores.filter(d => {
    const st = (d.estado || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    return st === 'al dia';
  }).length;

  const cantDebe = filteredDeudores.filter(d => {
    const st = (d.estado || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    return st === 'debe' || st === 'en mora' || st === 'sin factura';
  }).length;

  const totalDeudaFiltrada = filteredDeudores.reduce((sum, d) => sum + Number(d.deuda || 0), 0);

  const handleExportExcel = () => {
    if (!filteredDeudores || filteredDeudores.length === 0) {
      setAlertMessage("No hay registros en la lista para exportar.");
      return;
    }

    const headers = [
      "Estudiante", "Documento Estudiante", "Grado", "Acudiente (Padre)", 
      "Documento Acudiente", "Celular Acudiente", "Correo Acudiente", 
      "N° Factura", "Concepto", "Monto Total (COP)", "Monto Pagado (COP)", 
      "Deuda Pendiente (COP)", "Estado Pago", "Fecha Emisión", "Fecha Último Pago"
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

  const handleVerRecibo = (item: any) => {
    const mesNombre = MESES.find(m => m.id === Number(mesFiltro))?.nombre || mesFiltro;
    setPreviewDataReceipt({
      ...item,
      mesNombre,
      anio: anioFiltro,
    });
    setShowPreviewReceipt(true);
  };

  const handleRegistrarPago = (item: any) => {
    const mesNombre = MESES.find(m => m.id === mesFiltro)?.nombre || '';
    setNavState({
      estudianteId: item.estudiante_id,
      facturaId: item.factura_id || null,
      grado: item.grado || null,
      mes: mesNombre || null,
      anio: String(anioFiltro),
    });
    router.push('/dashboard/caja');
  };

  const handleExportExcelAnual = async () => {
    try {
      setExportingAnual(true);
      const reporteAnualMap = new Map<string, any>();

      MESES.forEach((m) => {
        const deudoresMes = dataAnualMeses[m.id] || [];
        deudoresMes.forEach((d: any) => {
          if (!reporteAnualMap.has(d.estudiante_id)) {
            reporteAnualMap.set(d.estudiante_id, {
              estudiante_id: d.estudiante_id,
              estudiante_nombre: d.estudiante_nombre,
              estudiante_documento: d.estudiante_documento,
              grado: d.grado,
              acudiente_id: d.acudiente_id,
              acudiente_nombre: d.acudiente_nombre,
              acudiente_documento: d.acudiente_documento,
              acudiente_celular: d.acudiente_celular,
              acudiente_correo: d.acudiente_correo,
              meses: {},
              deuda_total_anual: 0
            });
          }

          const est = reporteAnualMap.get(d.estudiante_id);
          est.meses[m.id] = {
            factura_id: d.factura_id,
            numero_factura: d.numero_factura,
            monto_total: d.monto_total,
            monto_pagado: d.monto_pagado,
            deuda: d.deuda,
            estado: d.estado,
            fecha_pago: d.fecha_pago
          };

          est.deuda_total_anual += Number(d.deuda || 0);
        });
      });

      const lista = Array.from(reporteAnualMap.values());
      if (lista.length === 0) {
        setAlertMessage("No se encontraron registros para exportar el reporte anual.");
        return;
      }

      const headers = [
        "Estudiante", "Documento Estudiante", "Grado", "Acudiente (Padre)", 
        "Documento Acudiente", "Celular Acudiente", "Correo Acudiente", 
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre", 
        `Total Deuda ${anioFiltro} (COP)`
      ];

      const rows = lista.map((est: any) => {
        const rowMeses = MESES.map((m) => {
          const infoMes = est.meses?.[m.id];
          if (!infoMes) return `"Sin Factura"`;
          if (infoMes.estado === 'Al día') return `"✅ Pagado (${formatMoney(infoMes.monto_pagado || infoMes.monto_total)})"`;
          if (infoMes.estado === 'Debe') return `"⏳ Debe (${formatMoney(infoMes.deuda)})"`;
          if (infoMes.estado === 'En mora') return `"🔴 En mora (${formatMoney(infoMes.deuda)})"`;
          return `"⚪ Sin Factura"`;
        });

        return [
          `"${(est.estudiante_nombre || '').replace(/"/g, '""')}"`,
          `"${(est.estudiante_documento || '').replace(/"/g, '""')}"`,
          `"${(est.grado || '').replace(/"/g, '""')}"`,
          `"${(est.acudiente_nombre || '').replace(/"/g, '""')}"`,
          `"${(est.acudiente_documento || '').replace(/"/g, '""')}"`,
          `"${(est.acudiente_celular || '').replace(/"/g, '""')}"`,
          `"${(est.acudiente_correo || '').replace(/"/g, '""')}"`,
          ...rowMeses,
          est.deuda_total_anual || 0
        ];
      });

      const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r: any) => r.join(';'))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Reporte_Anual_Pensiones_${anioFiltro}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      setAlertMessage("Error al exportar reporte anual: " + (err.message || 'Error desconocido'));
    } finally {
      setExportingAnual(false);
    }
  };

  if (loading)
    return <div className={styles.loading}>Cargando datos financieros...</div>;

  const mesNombre = MESES.find(m => m.id === mesFiltro)?.nombre || '';

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
              />
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Cartera Pendiente</span>
            <span className={styles.statValue + " " + styles.pending}>
              {formatMoney(stats.total_cartera)}
            </span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Porcentaje de Recaudo</span>
            <span className={styles.statValue}>
              {stats.porcentaje_recaudo}%
            </span>
          </div>
        </div>
      )}

      {/* TAB 2: CONTROL DE PENSIONES Y ACUDIENTES */}
      {activeTab === 'pensiones' && (
        <>
          <FinanzasStatsCards 
            totalEstudiantes={filteredDeudores.length}
            cantAldia={cantAldia}
            cantDebe={cantDebe}
            totalDeudaFiltrada={totalDeudaFiltrada}
            formatMoney={formatMoney}
          />

          <FinanzasFiltersBar 
            mesFiltro={mesFiltro}
            setMesFiltro={setMesFiltro}
            anioFiltro={anioFiltro}
            setAnioFiltro={setAnioFiltro}
            aniosLectivos={aniosLectivos}
            estadoFiltro={estadoFiltro}
            setEstadoFiltro={setEstadoFiltro}
            grupoFiltro={grupoFiltro}
            setGrupoFiltro={setGrupoFiltro}
            grupos={grupos}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            meses={MESES}
            handleExportExcel={handleExportExcel}
            handleExportExcelAnual={handleExportExcelAnual}
            exportingAnual={exportingAnual}
          />
        </>
      )}

      {/* Tabla Principal */}
      <FinanzasPensionesTable 
        filteredDeudores={filteredDeudores}
        loadingDeudores={loadingDeudores}
        mesFiltro={mesFiltro}
        anioFiltro={anioFiltro}
        meses={MESES}
        formatMoney={formatMoney}
        handleVerRecibo={handleVerRecibo}
        onRegistrarPago={handleRegistrarPago}
      />

      {/* Visor del Recibo de Caja Oficial */}
      {showPreviewReceipt && (
        <ReciboCajaModal 
          datos={previewDataReceipt}
          formatMoney={formatMoney}
          onClose={() => setShowPreviewReceipt(false)}
        />
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
