import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { getAuthToken } from "@/utils/auth";

const API = process.env.NEXT_PUBLIC_API_URL;

export interface ConceptoCobro {
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
  articulo_inventario_id?: string;
}

export interface Movimiento {
  id: string;
  fecha: string;
  tipo: "INGRESO" | "EGRESO";
  concepto: string;
  monto: number;
  estudiante_nombre?: string;
  observacion?: string;
  numero_comprobante?: string;
  factura_id?: string;
  partida_doble?: any;
  conceptos_detalle?: any;
}

export interface Resumen {
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

export const useCajaLogic = () => {
  const [activeTab, setActiveTab] = useState("registrar");
  const [loading, setLoading] = useState(false);
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [institucion, setInstitucion] = useState<any>(null);

  // Formulario
  const [tipo, setTipo] = useState<"INGRESO" | "EGRESO">("INGRESO");
  const [monto, setMonto] = useState("");
  const [observacion, setObservacion] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);

  // Beneficiario (Estudiante o Empleado)
  const [busquedaBeneficiario, setBusquedaBeneficiario] = useState("");
  const [resultadosBusqueda, setResultadosBusqueda] = useState<any[]>([]);
  const [beneficiarioSeleccionado, setBeneficiarioSeleccionado] = useState<any>(null);
  const [facturasPendientes, setFacturasPendientes] = useState<any[]>([]);
  const [facturaIdSeleccionada, setFacturaIdSeleccionada] = useState<string | null>(null);
  
  // Conceptos
  const [busquedaConcepto, setBusquedaConcepto] = useState("");
  const [resultadosConceptos, setResultadosConceptos] = useState<ConceptoCobro[]>([]);
  const [conceptosCobro, setConceptosCobro] = useState<ConceptoCobro[]>([]);
  const [conceptoSeleccionado, setConceptoSeleccionado] = useState<ConceptoCobro | null>(null);
  const [showConceptDropdown, setShowConceptDropdown] = useState(false);
  const [showBeneficiarioDropdown, setShowBeneficiarioDropdown] = useState(false);

  // Inventario
  const [articulosInventario, setArticulosInventario] = useState<any[]>([]);
  const [mostrarSelectorArticulos, setMostrarSelectorArticulos] = useState(false);
  const [articulosVenta, setArticulosVenta] = useState<any[]>([]);

  // Notificaciones y Modales
  const [notification, setNotification] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [comprobanteReciente, setComprobanteReciente] = useState<any>(null);
  const [mostrarComprobante, setMostrarComprobante] = useState(false);
  const [sedes, setSedes] = useState<any[]>([]);
  const [sedeSeleccionada, setSedeSeleccionada] = useState<any>(null);

  // Filtros Historial
  const [fechaDesde, setFechaDesde] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [fechaHasta, setFechaHasta] = useState(new Date().toISOString().split("T")[0]);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const searchParams = useSearchParams();

  useEffect(() => {
    cargarResumen();
    cargarConceptosCobro();
    cargarInstitucion();
    cargarSedes();
    
    // Auto-selección desde URL (Finanzas)
    const eId = searchParams.get('estudianteId');
    const fId = searchParams.get('facturaId');
    if (eId) {
      setTipo("INGRESO"); // Asegurar que es un ingreso
      handleAutoSeleccion(eId, fId);
    }
  }, [searchParams]);

  const handleAutoSeleccion = async (eId: string, fId: string | null) => {
    try {
      const token = getAuthToken();
      console.log("🔍 Iniciando auto-selección para estudiante:", eId);
      
      // 1. Buscar datos del estudiante directamente
      const res = await fetch(`${API}/caja/buscar-estudiantes?id=${eId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const students = await res.json();
        // El endpoint puede devolver un array o un objeto
        const student = Array.isArray(students) ? students.find((s: any) => s.id === eId) : students;
        
        if (student && student.id) {
          console.log("✅ Estudiante encontrado:", student.primer_nombre);
          setBeneficiarioSeleccionado(student);
          setBusquedaBeneficiario(`${student.primer_apellido || ''} ${student.primer_nombre || ''}`.trim());
          
          // 2. Cargar facturas y seleccionar la que viene
          const resF = await fetch(`${API}/caja/estudiantes/${eId}/facturas-pendientes`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (resF.ok) {
            const dataF = await resF.json();
            const facturas = dataF.data || [];
            setFacturasPendientes(facturas);
            
            if (fId && facturas.length > 0) {
              const fac = facturas.find((f: any) => f.id === fId);
              if (fac) {
                setFacturaIdSeleccionada(fac.id);
                setMonto(fac.total.toString());
                setObservacion(`Pago de factura ${fac.numero_factura}`);
                
                // CARGAR AL CARRITO AUTOMÁTICAMENTE
                if (fac.factura_detalle && fac.factura_detalle.length > 0) {
                  const detalles = fac.factura_detalle.map((d: any) => ({
                    ...d,
                    id: d.articulo_inventario_id || d.concepto_cobro_id || d.id,
                    nombre: d.descripcion,
                    precio_unitario: d.valor_unitario,
                    cantidad: d.cantidad,
                    es_concepto: d.concepto_cobro_id ? true : false,
                    aplica_iva: d.valor_iva > 0,
                    porcentaje_iva: d.valor_iva > 0 ? (Number(d.valor_iva) / Number(d.valor_unitario)) * 100 : 0
                  }));
                  setArticulosVenta(detalles);
                  console.log("🛒 Carrito cargado automáticamente con", detalles.length, "items");
                }
              }
            }
          }
        }
      }
    } catch (err) {
      console.error("Error en auto-selección:", err);
    }
  };

  const cargarSedes = async () => {
    try {
      const token = getAuthToken();
      const res = await fetch(`${API}/configuracion/sedes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSedes(data);
        if (data.length > 0) setSedeSeleccionada(data[0]);
      }
    } catch (err) { console.error(err); }
  };

  const cargarInstitucion = async () => {
    try {
      const token = getAuthToken();
      const res = await fetch(`${API}/configuracion/institucion`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setInstitucion(await res.json());
    } catch (err) { console.error(err); }
  };

  const cargarResumen = async () => {
    try {
      const token = getAuthToken();
      const res = await fetch(`${API}/caja/resumen?fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setResumen(await res.json());
    } catch (err) { console.error(err); }
  };

  const cargarConceptosCobro = async () => {
    try {
      const token = getAuthToken();
      const res = await fetch(`${API}/caja/conceptos-cobro`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setConceptosCobro(data);
        // Inicializar resultados para que al hacer clic ya existan
        const initial = data.filter((c: any) => !c.tipo || c.tipo === tipo);
        setResultadosConceptos(initial.slice(0, 20));
      }
    } catch (err) { console.error(err); }
  };

  const buscarBeneficiarios = async (q: string) => {
    setBusquedaBeneficiario(q);
    if (!q.trim()) {
      setResultadosBusqueda([]);
      return;
    }
    const token = getAuthToken();
    const endpoint = tipo === "INGRESO" ? "buscar-estudiantes" : "buscar-empleados";
    const res = await fetch(`${API}/caja/${endpoint}?q=${encodeURIComponent(q)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setResultadosBusqueda(await res.json());
      setShowBeneficiarioDropdown(true);
    }
  };

  const seleccionarBeneficiario = (b: any) => {
    setBeneficiarioSeleccionado(b);
    setBusquedaBeneficiario(`${b.primer_apellido || ''} ${b.primer_nombre || ''}`.trim());
    setResultadosBusqueda([]);
    setShowBeneficiarioDropdown(false);
    setFacturaIdSeleccionada(null); // Reset
    
    if (tipo === "INGRESO" && b.id) {
      cargarFacturasPendientes(b.id);
    } else {
      setFacturasPendientes([]);
    }
  };

  const cargarFacturasPendientes = async (estudianteId: string) => {
    try {
      const token = getAuthToken();
      const res = await fetch(`${API}/caja/estudiantes/${estudianteId}/facturas-pendientes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFacturasPendientes(data.data || []);
      }
    } catch (err) {
      console.error("Error al cargar facturas pendientes:", err);
    }
  };

  const buscarConceptos = (term: string) => {
    setBusquedaConcepto(term);
    
    // Si el término está vacío, mostramos todos los conceptos compatibles
    if (!term.trim()) {
      const all = conceptosCobro.filter(c => 
        !c.tipo || c.tipo === tipo
      );
      setResultadosConceptos(all.slice(0, 20));
      return;
    }

    const filtered = conceptosCobro.filter(c => 
      c.nombre.toLowerCase().includes(term.toLowerCase()) && 
      (!c.tipo || c.tipo === tipo)
    );
    setResultadosConceptos(filtered);
    setShowConceptDropdown(true);
  };

  const seleccionarConcepto = (found: ConceptoCobro) => {
    if (!found) return;
    setBusquedaConcepto(found.nombre);
    setResultadosConceptos([]);
    setShowConceptDropdown(false);
    
    if (found.afecta_inventario) {
      if (found.articulo_inventario_id) {
        const art = {
          ...found,
          id: found.articulo_inventario_id,
          nombre: found.nombre,
          precio_unitario: found.valor || 0,
          es_servicio: true,
          es_concepto: true,
          concepto_cobro_id: found.id,
          cantidad: 1
        };
        handleAddArticulo(art);
        setBusquedaConcepto("");
      } else {
        setConceptoSeleccionado(found);
        setMostrarSelectorArticulos(true);
        fetchArticulos(found.categoria_inventario_id);
      }
    } else {
      setConceptoSeleccionado(found);
      const art = {
        ...found,
        es_concepto: true,
        precio_unitario: found.valor || 0,
        cantidad: 1
      };
      handleAddArticulo(art);
      setBusquedaConcepto("");
    }
  };

  const fetchArticulos = async (categoriaId?: string) => {
    try {
      const token = getAuthToken();
      let url = `${API}/inventario/articulos`;
      if (categoriaId) url += `?categoria_id=${categoriaId}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setArticulosInventario(data.filter((a: any) => a.es_servicio || a.cantidad_stock > 0));
      }
    } catch (err) { console.error(err); }
  };

  const handleAddArticulo = (art: any) => {
    // Normalizar precio: algunos vienen como precio_venta, otros precio_unitario
    const precio = parseFloat(art.precio_venta || art.precio_unitario || art.valor || 0);
    const normalizedArt = { ...art, precio_unitario: precio };

    const existIdx = articulosVenta.findIndex(a => a.id === normalizedArt.id && a.es_concepto === normalizedArt.es_concepto);
    if (existIdx >= 0) {
      const newItems = [...articulosVenta];
      newItems[existIdx].cantidad += 1;
      updateArticulosYTotal(newItems);
    } else {
      updateArticulosYTotal([...articulosVenta, { ...normalizedArt, cantidad: 1 }]);
    }
    // No cerramos automáticamente para permitir agregar varios
    // setMostrarSelectorArticulos(false);
  };

  const handleUpdateCantidad = (idx: number, delta: number) => {
    const newItems = [...articulosVenta];
    newItems[idx].cantidad = Math.max(1, newItems[idx].cantidad + delta);
    updateArticulosYTotal(newItems);
  };

  const updateArticulosYTotal = (items: any[]) => {
    setArticulosVenta(items);
    const total = items.reduce((sum, item) => {
      const p = parseFloat(item.precio_unitario) || 0;
      const c = parseInt(item.cantidad) || 0;
      return sum + (p * c);
    }, 0);
    setMonto(total.toString());
  };

  const registrarTransaccion = async () => {
    if (loading) return;
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
          monto: parseFloat(monto), // Enviar monto total
          concepto: articulosVenta.length > 0 ? articulosVenta[0].nombre + (articulosVenta.length > 1 ? "..." : "") : "Varios", // Enviar concepto descriptivo
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
          metodo_pago: "EFECTIVO",
          factura_id: facturaIdSeleccionada,
          fecha: fecha
        })
      });

      if (res.ok) {
        const result = await res.json();
        showToast("Transacción registrada exitosamente", "success");
        // El backend devuelve { message, data: { factura, movimiento, comprobante, partida_doble } }
        const movData = result.data.movimiento || {};
        setComprobanteReciente({ 
          ...movData, 
          monto: parseFloat(movData.monto || 0),
          partida_doble: result.data.partida_doble,
          estudiante_nombre: nombreCompleto,
          institucion_nombre: institucion?.nombre,
          conceptos_detalle: [...articulosVenta]
        });
        setMostrarComprobante(true);
        // Reset form
        setMonto(""); setBusquedaConcepto(""); setArticulosVenta([]); setBeneficiarioSeleccionado(null); setBusquedaBeneficiario(""); setObservacion("");
        cargarResumen();
      } else {
        const err = await res.json();
        showToast(err.message || "Error al registrar la transacción", "error");
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return {
    activeTab, setActiveTab,
    loading, resumen,
    tipo, setTipo,
    monto, setMonto,
    observacion, setObservacion,
    fecha, setFecha,
    busquedaBeneficiario, setBusquedaBeneficiario,
    resultadosBusqueda, setResultadosBusqueda,
    beneficiarioSeleccionado, setBeneficiarioSeleccionado,
    busquedaConcepto, setBusquedaConcepto,
    resultadosConceptos, setResultadosConceptos,
    conceptosCobro,
    articulosInventario,
    mostrarSelectorArticulos, setMostrarSelectorArticulos,
    articulosVenta, setArticulosVenta,
    notification, setNotification,
    showConfirmModal, setShowConfirmModal,
    comprobanteReciente, setComprobanteReciente,
    mostrarComprobante, setMostrarComprobante,
    fechaDesde, setFechaDesde,
    fechaHasta, setFechaHasta,
    showToast,
    cargarResumen,
    cargarInstitucion,
    institucion,
    sedes,
    sedeSeleccionada,
    setSedeSeleccionada,
    seleccionarBeneficiario,
    cargarFacturasPendientes,
    facturasPendientes,
    setFacturasPendientes,
    facturaIdSeleccionada,
    setFacturaIdSeleccionada,
    buscarBeneficiarios,
    buscarConceptos,
    seleccionarConcepto,
    handleAddArticulo,
    handleUpdateCantidad,
    updateArticulosYTotal,
    registrarTransaccion,
    fetchArticulos,
    showConceptDropdown, setShowConceptDropdown,
    showBeneficiarioDropdown, setShowBeneficiarioDropdown,
    conceptoSeleccionado, setConceptoSeleccionado
  };
};
