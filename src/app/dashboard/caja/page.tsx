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
}

interface Estudiante {
  id: string;
  primer_nombre: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  numero_documento?: string;
  acudiente?: { id: string; nombre: string };
}

interface ArticuloInventario {
  id: string;
  nombre: string;
  precio_venta: number;
  precio_unitario: number;
  cantidad_stock: number;
}

interface DetalleFactura {
  concepto_cobro_id: string;
  articulo_inventario_id?: string;
  descripcion: string;
  cantidad: number;
  valor_unitario: number;
  valor_iva: number;
  subtotal: number;
}

interface Factura {
  id: string;
  numero_factura: string;
  prefijo: string;
  fecha_emision: string;
  fecha_vencimiento?: string;
  subtotal: number;
  iva_total: number;
  total: number;
  estado: "PENDIENTE" | "PAGADA" | "ANULADA" | "PARCIAL";
  estudiante_id?: string;
  estudiante?: Estudiante;
  observaciones?: string;
  detalles?: DetalleFactura[];
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
  por_concepto: {
    ingresos: Array<{ concepto: string; monto: number; cantidad: number }>;
    egresos: Array<{ concepto: string; monto: number; cantidad: number }>;
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

  // Estudiante seleccionado para matrícula/pensión
  const [estudianteBusqueda, setEstudianteBusqueda] = useState("");
  const [estudiantesEncontrados, setEstudiantesEncontrados] = useState<any[]>(
    [],
  );
  const [estudianteSeleccionado, setEstudianteSeleccionado] =
    useState<any>(null);
  const [mostrarSelectorEstudiante, setMostrarSelectorEstudiante] =
    useState(false);

  // Comprobante generado
  const [comprobanteReciente, setComprobanteReciente] = useState<any>(null);
  const [mostrarComprobante, setMostrarComprobante] = useState(false);

  // Ver movimiento histórico
  const [movimientoSeleccionado, setMovimientoSeleccionado] =
    useState<any>(null);
  const [mostrarDetalleMovimiento, setMostrarDetalleMovimiento] =
    useState(false);

  // Inventario - Conceptos de cobro
  const [conceptosCobro, setConceptosCobro] = useState<any[]>([]);
  const [conceptoSeleccionado, setConceptoSeleccionado] = useState<any>(null);
  const [articulosVenta, setArticulosVenta] = useState<any[]>([]);
  const [conceptosVenta, setConceptosVenta] = useState<any[]>([]);
  const [mostrarSelectorArticulos, setMostrarSelectorArticulos] =
    useState(false);

  // Artículos del inventario disponibles para el concepto seleccionado
  const [articulosInventario, setArticulosInventario] = useState<any[]>([]);
  const [articuloSeleccionado, setArticuloSeleccionado] = useState<any>(null);
  const [cantidadArticulo, setCantidadArticulo] = useState(1);

  // Filtros reporte
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  // Facturas
  const [facturas, setFacturas] = useState<any[]>([]);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<any>(null);

  // Conceptos predefinidos
  const conceptosIngreso = [
    "Matrícula",
    "Pensión Mensual",
    "Meriendas",
    "Libros",
    "Uniformes",
    "Formularios",
    "Derecho a Grado",
    "Clausura/Graduación",
    "Otro Ingreso",
  ];

  const conceptosEgreso = [
    "Nómina Docentes",
    "Nómina Administrativos",
    "Servicios Públicos",
    "Arriendo",
    "Suministros Oficina",
    "Mantenimiento",
    "Otro Gasto",
  ];

  useEffect(() => {
    cargarResumen();
    cargarConceptosCobro();
  }, []);

  // Cargar conceptos de cobro que afectan inventario
  const cargarConceptosCobro = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const res = await fetch(`${API}/caja/conceptos-cobro`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error al cargar conceptos");
      const data = await res.json();
      setConceptosCobro(data);
    } catch (err) {
      console.error("Error cargando conceptos de cobro:", err);
    }
  };

  // Cargar artículos del inventario por categoría
  const cargarArticulosPorCategoria = async (categoriaId: string) => {
    const token = getAuthToken();
    if (!token || !categoriaId) return;

    try {
      const res = await fetch(
        `${API}/caja/articulos-por-categoria/${categoriaId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) throw new Error("Error al cargar artículos");
      const data = await res.json();
      setArticulosInventario(data);
    } catch (err) {
      console.error("Error cargando artículos del inventario:", err);
    }
  };

  // Manejar selección de artículo del inventario - agrega al array
  const handleArticuloSeleccionado = (articulo: any) => {
    // Usar precio_venta si existe, sino precio_unitario
    const precio = articulo.precio_venta || articulo.precio_unitario || 0;

    // Verificar si el artículo ya existe en la lista
    const existe = articulosVenta.find(
      (a) => a.articulo_inventario_id === articulo.id,
    );
    if (existe) {
      alert("Este artículo ya está en la lista. Puede modificar la cantidad.");
      return;
    }

    // Agregar artículo al array
    const nuevoArticulo = {
      articulo_inventario_id: articulo.id,
      nombre: articulo.nombre,
      cantidad: 1,
      precio_unitario: precio,
      stock: articulo.cantidad_stock,
    };

    const nuevosArticulos = [...articulosVenta, nuevoArticulo];
    setArticulosVenta(nuevosArticulos);

    // Actualizar monto automáticamente
    const nuevoMonto = nuevosArticulos.reduce(
      (total, a) => total + a.precio_unitario * a.cantidad,
      0,
    );
    setMonto(nuevoMonto.toString());

    // Resetear selección
    setArticuloSeleccionado(null);
    setCantidadArticulo(1);
  };

  // Eliminar artículo de la lista
  const eliminarArticulo = (index: number) => {
    const nuevosArticulos = articulosVenta.filter((_, i) => i !== index);
    setArticulosVenta(nuevosArticulos);

    // Recalcular monto
    const nuevoMonto = nuevosArticulos.reduce(
      (total, a) => total + a.precio_unitario * a.cantidad,
      0,
    );
    setMonto(nuevoMonto.toString());
  };

  // Actualizar cantidad de un artículo específico
  const actualizarCantidadArticulo = (index: number, cantidad: number) => {
    const nuevosArticulos = articulosVenta.map((art, i) =>
      i === index ? { ...art, cantidad } : art,
    );
    setArticulosVenta(nuevosArticulos);

    // Recalcular monto total
    const nuevoMonto = nuevosArticulos.reduce(
      (total, a) => total + a.precio_unitario * a.cantidad,
      0,
    );
    setMonto(nuevoMonto.toString());
  };

  // Actualizar cantidad del artículo seleccionado
  const actualizarCantidad = (cantidad: number) => {
    setCantidadArticulo(cantidad);
    const precio =
      articuloSeleccionado?.precio_venta ||
      articuloSeleccionado?.precio_unitario ||
      0;
    if (precio > 0) {
      const nuevoMonto = cantidad * precio;
      setMonto(nuevoMonto.toString());
    }

    setArticulosVenta((prev) => prev.map((a) => ({ ...a, cantidad })));
  };

  // Manejar selección de concepto para detectar si afecta inventario
  const handleConceptoChange = (nombreConcepto: string) => {
    setConcepto(nombreConcepto);

    // Limpiar selección anterior
    setArticuloSeleccionado(null);
    setCantidadArticulo(1);
    setArticulosVenta([]);

    // Buscar si el concepto está en conceptosCobro y afecta inventario
    const conceptoEncontrado = conceptosCobro.find(
      (c) => c.nombre === nombreConcepto && c.afecta_inventario,
    );

    if (conceptoEncontrado) {
      setConceptoSeleccionado(conceptoEncontrado);
      setMostrarSelectorArticulos(true);
      // Cargar artículos de la categoría del concepto
      if (conceptoEncontrado.categoria_inventario_id) {
        cargarArticulosPorCategoria(conceptoEncontrado.categoria_inventario_id);
      } else {
        // Si no tiene categoría, mostrar todos los artículos
        setArticulosInventario([]);
      }
    } else {
      setConceptoSeleccionado(null);
      setMostrarSelectorArticulos(false);
      setArticulosInventario([]);
    }
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
      if (!res.ok) throw new Error("Error al cargar resumen");
      const data = await res.json();
      setResumen(data);
    } catch (err) {
      console.error("Error cargando resumen:", err);
    }
  };

  // Cargar facturas
  const cargarFacturas = async () => {
    const token = getAuthToken();
    if (!token) return;
    try {
      const res = await fetch(`${API}/caja/facturas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFacturas(Array.isArray(data) ? data : data.data || []);
      }
    } catch (err) {
      console.error("Error cargando facturas:", err);
    }
  };

  // Determinar si se requiere seleccionar estudiante
  const requiereEstudiante =
    concepto === "Matrícula" || concepto === "Pensión Mensual";

  // Buscar estudiantes
  const buscarEstudiantes = async (query: string) => {
    if (query.length < 2) {
      setEstudiantesEncontrados([]);
      return;
    }
    const token = getAuthToken();
    try {
      const res = await fetch(
        `${API}/caja/buscar-estudiantes?q=${encodeURIComponent(query)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        const data = await res.json();
        setEstudiantesEncontrados(data);
      }
    } catch (err) {
      console.error("Error buscando estudiantes:", err);
    }
  };

  // Seleccionar estudiante
  const seleccionarEstudiante = (est: any) => {
    setEstudianteSeleccionado(est);
    setEstudianteBusqueda(`${est.primer_apellido} ${est.primer_nombre}`);
    setEstudiantesEncontrados([]);
    setMostrarSelectorEstudiante(false);
  };

  // Limpiar estudiante seleccionado
  const limpiarEstudiante = () => {
    setEstudianteSeleccionado(null);
    setEstudianteBusqueda("");
    setEstudiantesEncontrados([]);
  };

  // Ver detalle de movimiento histórico
  const verDetalleMovimiento = (movimiento: any) => {
    setMovimientoSeleccionado(movimiento);
    setMostrarDetalleMovimiento(true);
  };

  // Imprimir comprobante desde historial
  const imprimirComprobanteHistorial = () => {
    if (!movimientoSeleccionado) return;
    const ventana = window.open("", "_blank");
    if (!ventana) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Comprobante ${movimientoSeleccionado.numero_comprobante || ""}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 500px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { margin: 0; font-size: 18px; }
          .header h2 { margin: 10px 0 0; font-size: 14px; color: #666; }
          .comprobante { font-size: 24px; font-weight: bold; text-align: center; margin: 20px 0; }
          .dato { margin: 15px 0; font-size: 14px; }
          .dato strong { display: inline-block; width: 120px; }
          .monto { font-size: 20px; font-weight: bold; text-align: center; margin: 30px 0; padding: 20px; border: 2px solid #333; }
          .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #666; border-top: 1px solid #ccc; padding-top: 20px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📚 INSTITUCIÓN EDUCATIVA</h1>
          <h2>Comprobante de ${movimientoSeleccionado.tipo === "INGRESO" ? "Pago" : "Egreso"}</h2>
        </div>
        <div class="comprobante">${movimientoSeleccionado.numero_comprobante || "S/N"}</div>
        <div class="dato"><strong>Fecha:</strong> ${new Date(movimientoSeleccionado.fecha).toLocaleDateString("es-CO")}</div>
        ${movimientoSeleccionado.estudiante_nombre ? `<div class="dato"><strong>Recibido de:</strong> ${movimientoSeleccionado.estudiante_nombre}</div>` : ""}
        <div class="dato"><strong>Concepto:</strong> ${movimientoSeleccionado.concepto}</div>
        <div class="dato"><strong>Observación:</strong> ${movimientoSeleccionado.observacion || "-"}</div>
        <div class="monto">${new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(movimientoSeleccionado.monto)}</div>
        <div class="footer">
          <p>Gracias por su pago</p>
          <p>Registrado por: ${movimientoSeleccionado.registrado_por_email || movimientoSeleccionado.registrado_por || "Sistema"}</p>
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `;
    ventana.document.write(html);
    ventana.document.close();
  };

  // Imprimir comprobante reciente
  const imprimirComprobante = () => {
    if (!comprobanteReciente) return;
    const ventana = window.open("", "_blank");
    if (!ventana) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Comprobante ${comprobanteReciente.numero_comprobante || ""}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 500px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { margin: 0; font-size: 18px; }
          .header h2 { margin: 10px 0 0; font-size: 14px; color: #666; }
          .comprobante { font-size: 24px; font-weight: bold; text-align: center; margin: 20px 0; }
          .dato { margin: 15px 0; font-size: 14px; }
          .dato strong { display: inline-block; width: 120px; }
          .monto { font-size: 20px; font-weight: bold; text-align: center; margin: 30px 0; padding: 20px; border: 2px solid #333; }
          .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #666; border-top: 1px solid #ccc; padding-top: 20px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📚 INSTITUCIÓN EDUCATIVA</h1>
          <h2>Comprobante de Pago</h2>
        </div>
        <div class="comprobante">${comprobanteReciente.numero_comprobante || "S/N"}</div>
        <div class="dato"><strong>Fecha:</strong> ${new Date(comprobanteReciente.fecha).toLocaleDateString("es-CO")}</div>
        <div class="dato"><strong>Recibido de:</strong> ${comprobanteReciente.estudiante_nombre || "N/A"}</div>
        <div class="dato"><strong>Concepto:</strong> ${comprobanteReciente.concepto}</div>
        <div class="dato"><strong>Observación:</strong> ${comprobanteReciente.observacion || "-"}</div>
        <div class="monto">${new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(comprobanteReciente.monto)}</div>
        <div class="footer">
          <p>Gracias por su pago</p>
          <p>Registrado por: ${comprobanteReciente.registrado_por_email || comprobanteReciente.registrado_por || "Sistema"}</p>
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `;
    ventana.document.write(html);
    ventana.document.close();
  };

  const registrarTransaccion = async () => {
    // Validar que haya conceptos o monto
    const montoNum = parseFloat(monto) || 0;
    if (conceptosVenta.length === 0 && montoNum <= 0) {
      alert("Agregue al menos un concepto o ingrese un monto válido");
      return;
    }

    // Validar estudiante si es matrícula o pensión
    if (requiereEstudiante && !estudianteSeleccionado) {
      alert("Debe seleccionar un estudiante para concepto de " + concepto);
      setMostrarSelectorEstudiante(true);
      return;
    }

    setLoading(true);
    const token = getAuthToken();

    try {
      // Construir array de conceptos
      let conceptosTransaccion: any[] = [];

      // Si hay artículos de inventario, agregarlos como conceptos
      if (articulosVenta.length > 0) {
        conceptosTransaccion = articulosVenta.map((art) => {
          const valorIva = art.precio_unitario * 0.19; // 19% IVA
          return {
            articulo_inventario_id: art.articulo_inventario_id,
            descripcion: art.nombre,
            cantidad: art.cantidad,
            valor_unitario: art.precio_unitario,
            valor_iva: valorIva,
          };
        });
      }

      // Si hay un concepto seleccionado con monto, agregarlo
      if (concepto && montoNum > 0) {
        const valorIva = conceptoSeleccionado?.aplica_iva
          ? montoNum * (conceptoSeleccionado.porcentaje_iva / 100)
          : 0;
        conceptosTransaccion.push({
          concepto_cobro_id: conceptoSeleccionado?.id,
          descripcion: concepto,
          cantidad: 1,
          valor_unitario: montoNum,
          valor_iva: valorIva,
        });
      }

      const transaccionData = {
        tipo,
        estudiante_id: estudianteSeleccionado?.id,
        estudiante_nombre: estudianteSeleccionado
          ? `${estudianteSeleccionado.primer_apellido} ${estudianteSeleccionado.primer_nombre}`
          : null,
        conceptos: conceptosTransaccion,
        observaciones: observacion || null,
        metodo_pago: "EFECTIVO",
      };

      const res = await fetch(`${API}/caja/transaccion`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transaccionData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Error al registrar transacción");
      }

      const resultado = await res.json();

      // Mostrar resultado con partida doble
      if (resultado.data?.comprobante) {
        setComprobanteReciente({
          ...resultado.data.movimiento,
          factura: resultado.data.factura,
          partida_doble: resultado.data.partida_doble,
          estudiante_nombre: estudianteSeleccionado
            ? `${estudianteSeleccionado.primer_apellido} ${estudianteSeleccionado.primer_nombre}`
            : null,
        });
        setMostrarComprobante(true);

        // Mensaje según tipo
        if (tipo === "INGRESO" && resultado.data.factura) {
          alert(
            `✅ Ingreso registrado:\n📄 Factura: ${resultado.data.factura.numero_factura}\n🧾 Comprobante: ${resultado.data.comprobante}`,
          );
        } else {
          alert(
            `✅ Egreso registrado:\n🧾 Comprobante: ${resultado.data.comprobante}`,
          );
        }
      }

      // Limpiar formulario
      setMonto("");
      setObservacion("");
      setConcepto("");
      setConceptoSeleccionado(null);
      setConceptosVenta([]);
      setArticulosVenta([]);
      setMostrarSelectorArticulos(false);
      limpiarEstudiante();
      cargarResumen();
    } catch (err: any) {
      alert(err.message || "Error al registrar transacción");
    } finally {
      setLoading(false);
    }
  };

  const eliminarMovimiento = async (id: string) => {
    if (!confirm("¿Eliminar este movimiento?")) return;

    const token = getAuthToken();
    try {
      const res = await fetch(`${API}/caja/movimientos/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error al eliminar");
      cargarResumen();
    } catch (err) {
      alert("Error al eliminar movimiento");
    }
  };

  const formatMoney = (val: number | string | undefined | null) => {
    if (val === undefined || val === null) return "$ 0";
    const num = typeof val === "string" ? parseFloat(val) : Number(val);
    if (isNaN(num)) return "$ 0";
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>
          <span className={styles.headerIcon}>�</span>
          Sistema Contable - Caja
        </h1>
        <p>
          Partida Doble: Ingresos generan Factura + Movimiento | Egresos solo
          Movimiento
        </p>
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

      {/* Tabs modernos */}
      <div className={styles.tabsContainer}>
        <button
          className={`${styles.tab} ${activeTab === "registrar" ? styles.tabActivo : ""}`}
          onClick={() => setActiveTab("registrar")}
        >
          ➕ Registrar
        </button>
        <button
          className={`${styles.tab} ${activeTab === "movimientos" ? styles.tabActivo : ""}`}
          onClick={() => setActiveTab("movimientos")}
        >
          📋 Movimientos
        </button>
        <button
          className={`${styles.tab} ${activeTab === "reporte" ? styles.tabActivo : ""}`}
          onClick={() => setActiveTab("reporte")}
        >
          📊 Reporte
        </button>
        <button
          className={`${styles.tab} ${activeTab === "facturas" ? styles.tabActivo : ""}`}
          onClick={() => {
            setActiveTab("facturas");
            cargarFacturas();
          }}
        >
          📄 Facturas
        </button>
      </div>

      {/* Tab: Registrar */}
      {activeTab === "registrar" && (
        <div className={styles.formContainer}>
          <div className={styles.formGroup}>
            <label>Tipo</label>
            <div className={styles.tipoButtons}>
              <button
                className={tipo === "INGRESO" ? styles.activeTipo : ""}
                onClick={() => setTipo("INGRESO")}
                type="button"
              >
                💰 Ingreso
              </button>
              <button
                className={tipo === "EGRESO" ? styles.activeTipo : ""}
                onClick={() => setTipo("EGRESO")}
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
            <label>
              Concepto
              {conceptosCobro.length > 0 && (
                <span className={styles.inventarioHint}>
                  {" "}
                  (📦 = con inventario)
                </span>
              )}
            </label>
            <select
              value={concepto}
              onChange={(e) => handleConceptoChange(e.target.value)}
            >
              <option value="">Seleccione...</option>
              {/* Todos los conceptos del backend */}
              {conceptosCobro.map((c) => (
                <option key={c.id} value={c.nombre}>
                  {c.nombre} {c.afecta_inventario ? "📦" : ""}
                </option>
              ))}
              {/* Conceptos hardcodeados adicionales */}
              {(tipo === "INGRESO" ? conceptosIngreso : conceptosEgreso)
                .filter((c) => !conceptosCobro.some((cc) => cc.nombre === c))
                .map((c, idx) => (
                  <option key={`hardcoded-${c}-${idx}`} value={c}>
                    {c}
                  </option>
                ))}
            </select>
          </div>

          {/* Selector de artículos para conceptos con inventario */}
          {mostrarSelectorArticulos && (
            <div className={styles.formGroup}>
              <label>📦 Seleccionar Artículo del Inventario</label>

              {/* Select de artículos disponibles */}
              <select
                value={articuloSeleccionado?.id || ""}
                onChange={(e) => {
                  const articulo = articulosInventario.find(
                    (a) => a.id === e.target.value,
                  );
                  if (articulo) handleArticuloSeleccionado(articulo);
                }}
                className={styles.selectArticulo}
              >
                <option value="">-- Seleccione un artículo --</option>
                {articulosInventario.map((articulo) => {
                  const precio =
                    articulo.precio_venta || articulo.precio_unitario || 0;
                  return (
                    <option key={articulo.id} value={articulo.id}>
                      {articulo.nombre} (Stock: {articulo.cantidad_stock}) -{" "}
                      {formatMoney(precio)}
                    </option>
                  );
                })}
              </select>

              {/* Lista de artículos agregados */}
              {articulosVenta.length > 0 && (
                <div className={styles.articulosLista}>
                  <h4>Artículos agregados:</h4>
                  {articulosVenta.map((art, index) => (
                    <div
                      key={art.articulo_inventario_id}
                      className={styles.articuloRow}
                    >
                      <span className={styles.articuloNombre}>
                        {art.nombre}
                      </span>
                      <span className={styles.articuloStock}>
                        Stock: {art.stock}
                      </span>
                      <div className={styles.cantidadControl}>
                        <button
                          type="button"
                          onClick={() =>
                            actualizarCantidadArticulo(
                              index,
                              Math.max(1, art.cantidad - 1),
                            )
                          }
                          disabled={art.cantidad <= 1}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={art.cantidad}
                          onChange={(e) =>
                            actualizarCantidadArticulo(
                              index,
                              parseInt(e.target.value) || 1,
                            )
                          }
                          min="1"
                          max={art.stock}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            actualizarCantidadArticulo(
                              index,
                              Math.min(art.stock, art.cantidad + 1),
                            )
                          }
                          disabled={art.cantidad >= art.stock}
                        >
                          +
                        </button>
                      </div>
                      <span className={styles.articuloPrecio}>
                        {formatMoney(art.precio_unitario * art.cantidad)}
                      </span>
                      <button
                        type="button"
                        onClick={() => eliminarArticulo(index)}
                        className={styles.btnEliminar}
                        title="Eliminar artículo"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                  <div className={styles.articulosTotal}>
                    <strong>
                      Total: {formatMoney(parseFloat(monto) || 0)}
                    </strong>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className={styles.formGroup}>
            <label>Monto</label>
            <input
              type="number"
              placeholder="0"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              min="0"
              step="1000"
              disabled={mostrarSelectorArticulos && articulosVenta.length > 0}
              title={
                mostrarSelectorArticulos
                  ? "El monto se calcula automáticamente según los artículos"
                  : ""
              }
            />
          </div>

          {/* Selector de estudiante para matrícula/pensión */}
          {requiereEstudiante && (
            <div className={styles.formGroup}>
              <label>Estudiante *</label>
              <div className={styles.busquedaEstudiante}>
                <input
                  type="text"
                  placeholder="Buscar por nombre o documento..."
                  value={estudianteBusqueda}
                  onChange={(e) => {
                    setEstudianteBusqueda(e.target.value);
                    buscarEstudiantes(e.target.value);
                    setMostrarSelectorEstudiante(true);
                  }}
                />
                {estudianteSeleccionado && (
                  <button
                    onClick={limpiarEstudiante}
                    className={styles.clearBtn}
                  >
                    ✕
                  </button>
                )}
              </div>

              {mostrarSelectorEstudiante &&
                estudiantesEncontrados.length > 0 && (
                  <div className={styles.listaEstudiantes}>
                    {estudiantesEncontrados.map((est) => (
                      <div
                        key={est.id}
                        className={styles.estudianteItem}
                        onClick={() => seleccionarEstudiante(est)}
                      >
                        <span className={styles.estudianteNombre}>
                          {est.primer_apellido} {est.segundo_apellido}{" "}
                          {est.primer_nombre}
                        </span>
                        <span className={styles.estudianteDoc}>
                          {est.tipo_documento}: {est.numero_documento}
                        </span>
                        {est.matricula?.grupo && (
                          <span className={styles.estudianteGrupo}>
                            {est.matricula.grupo.grado?.nombre} -{" "}
                            {est.matricula.grupo.nombre}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

              {estudianteSeleccionado && (
                <div className={styles.estudianteSeleccionado}>
                  <strong>Seleccionado:</strong>{" "}
                  {estudianteSeleccionado.primer_apellido}{" "}
                  {estudianteSeleccionado.primer_nombre}
                  {estudianteSeleccionado.matricula?.grupo && (
                    <span>
                      {" "}
                      ({
                        estudianteSeleccionado.matricula.grupo.grado?.nombre
                      } - {estudianteSeleccionado.matricula.grupo.nombre})
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

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
            className={styles.btnPrimary}
            onClick={registrarTransaccion}
            disabled={loading}
          >
            {loading
              ? "Procesando..."
              : tipo === "INGRESO"
                ? "� Registrar Ingreso + Factura"
                : "💸 Registrar Egreso"}
          </button>
        </div>
      )}

      {/* Modal de comprobante */}
      {mostrarComprobante && comprobanteReciente && (
        <div className={styles.modalOverlay}>
          <div className={styles.comprobanteModal}>
            <h3>✅ Movimiento registrado</h3>
            <div className={styles.comprobanteInfo}>
              <p>
                <strong>Comprobante:</strong>{" "}
                {comprobanteReciente.numero_comprobante}
              </p>
              <p>
                <strong>Estudiante:</strong>{" "}
                {comprobanteReciente.estudiante_nombre || "N/A"}
              </p>
              <p>
                <strong>Concepto:</strong> {comprobanteReciente.concepto}
              </p>
              <p>
                <strong>Monto:</strong> {formatMoney(comprobanteReciente.monto)}
              </p>
              <p>
                <strong>Fecha:</strong>{" "}
                {new Date(comprobanteReciente.fecha).toLocaleDateString(
                  "es-CO",
                )}
              </p>
              <p>
                <strong>Registrado por:</strong>{" "}
                {comprobanteReciente.registrado_por_email ||
                  comprobanteReciente.registrado_por ||
                  "Sistema"}
              </p>
            </div>
            <div className={styles.comprobanteActions}>
              <button onClick={imprimirComprobante} className={styles.printBtn}>
                🖨️ Imprimir Comprobante
              </button>
              <button
                onClick={() => setMostrarComprobante(false)}
                className={styles.closeBtn}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de detalle de movimiento histórico */}
      {mostrarDetalleMovimiento && movimientoSeleccionado && (
        <div className={styles.modalOverlay}>
          <div className={styles.comprobanteModal}>
            <h3>📋 Detalle del Movimiento</h3>
            <div className={styles.comprobanteInfo}>
              <p>
                <strong>Comprobante:</strong>{" "}
                {movimientoSeleccionado.numero_comprobante || "N/A"}
              </p>
              <p>
                <strong>Tipo:</strong>{" "}
                <span
                  className={
                    movimientoSeleccionado.tipo === "INGRESO"
                      ? styles.positive
                      : styles.negative
                  }
                >
                  {movimientoSeleccionado.tipo === "INGRESO"
                    ? "💰 INGRESO"
                    : "💸 EGRESO"}
                </span>
              </p>
              <p>
                <strong>Concepto:</strong> {movimientoSeleccionado.concepto}
              </p>
              <p>
                <strong>Monto:</strong>{" "}
                {formatMoney(movimientoSeleccionado.monto)}
              </p>
              <p>
                <strong>Fecha:</strong>{" "}
                {new Date(movimientoSeleccionado.fecha).toLocaleDateString(
                  "es-CO",
                )}
              </p>
              {movimientoSeleccionado.estudiante_nombre && (
                <p>
                  <strong>Estudiante:</strong>{" "}
                  {movimientoSeleccionado.estudiante_nombre}
                </p>
              )}
              <p>
                <strong>Observación:</strong>{" "}
                {movimientoSeleccionado.observacion || "-"}
              </p>
              <p>
                <strong>Registrado por:</strong>{" "}
                {movimientoSeleccionado.registrado_por_email ||
                  movimientoSeleccionado.registrado_por ||
                  "Sistema"}
              </p>
            </div>
            <div className={styles.comprobanteActions}>
              {movimientoSeleccionado.numero_comprobante && (
                <button
                  onClick={imprimirComprobanteHistorial}
                  className={styles.printBtn}
                >
                  🖨️ Imprimir
                </button>
              )}
              <button
                onClick={() => setMostrarDetalleMovimiento(false)}
                className={styles.closeBtn}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Movimientos */}
      {activeTab === "movimientos" && (
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
                  <td>{new Date(m.fecha).toLocaleDateString("es-CO")}</td>
                  <td>
                    <span
                      className={
                        m.tipo === "INGRESO"
                          ? styles.badgeIngreso
                          : styles.badgeEgreso
                      }
                    >
                      {m.tipo === "INGRESO" ? "💰" : "💸"} {m.tipo}
                    </span>
                  </td>
                  <td>{m.concepto}</td>
                  <td
                    className={
                      m.tipo === "INGRESO" ? styles.positive : styles.negative
                    }
                  >
                    {formatMoney(m.monto)}
                  </td>
                  <td>{m.observacion || "-"}</td>
                  <td>
                    <button
                      className={styles.viewBtn}
                      onClick={() => verDetalleMovimiento(m)}
                      title="Ver detalle"
                    >
                      👁️
                    </button>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => eliminarMovimiento(m.id)}
                      title="Eliminar"
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
      {activeTab === "reporte" && resumen && (
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

      {/* Tab: Facturas */}
      {activeTab === "facturas" && (
        <div className={styles.movimientosContainer}>
          <h3>📄 Facturas</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Número</th>
                <th>Fecha</th>
                <th>Estudiante</th>
                <th>Total</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {facturas.map((factura: any) => (
                <tr key={factura.id}>
                  <td>{factura.numero_factura}</td>
                  <td>
                    {new Date(factura.fecha_emision).toLocaleDateString()}
                  </td>
                  <td>
                    {factura.estudiante
                      ? `${factura.estudiante.primer_apellido} ${factura.estudiante.primer_nombre}`
                      : "N/A"}
                  </td>
                  <td>{formatMoney(factura.total)}</td>
                  <td>
                    <span
                      className={
                        factura.estado === "PAGADA"
                          ? styles.estadoPagada
                          : factura.estado === "ANULADA"
                            ? styles.estadoAnulada
                            : styles.estadoPendiente
                      }
                    >
                      {factura.estado}
                    </span>
                  </td>
                </tr>
              ))}
              {facturas.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center" }}>
                    No hay facturas registradas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
