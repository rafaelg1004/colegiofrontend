import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { getAuthToken } from "@/utils/auth";
import { useCajaContext } from "@/context/CajaContext";

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

  // Filtros Historial (Desde el 1 de enero del año actual)
  const [fechaDesde, setFechaDesde] = useState(() => {
    const year = new Date().getFullYear();
    return `${year}-01-01`;
  });
  const [fechaHasta, setFechaHasta] = useState(new Date().toISOString().split("T")[0]);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const searchParams = useSearchParams();
  const { navState, clearNavState } = useCajaContext();

  useEffect(() => {
    cargarResumen();
    cargarConceptosCobro();
    cargarInstitucion();
    cargarSedes();
    
    // Prioridad 1: Auto-selección desde React Context en Memoria RAM (URL Limpia)
    // Prioridad 2: Fallback desde parámetros URL (para links compartidos)
    const eId = navState.estudianteId || searchParams.get('estudianteId');
    const fId = navState.facturaId || searchParams.get('facturaId');
    const grado = navState.grado || searchParams.get('grado');
    const mesNombre = navState.mes || searchParams.get('mes');
    const anio = navState.anio || searchParams.get('anio');

    if (eId) {
      console.log("⚡ Auto-selección disparada desde React Context / URL:", { eId, fId, grado, mesNombre, anio });
      setTipo("INGRESO"); // Asegurar que es un ingreso
      handleAutoSeleccion(eId, fId, grado, mesNombre, anio);
      if (navState.estudianteId) {
        clearNavState(); // Limpiar el contexto para mantener la memoria volátil libre
      }
    }
  }, [searchParams, navState]);

  const handleAutoSeleccion = async (
    eId: string, 
    fId: string | null,
    grado?: string | null,
    mesNombre?: string | null,
    anio?: string | null
  ) => {
    try {
      const token = getAuthToken();
      console.log("🔍 Iniciando auto-selección para estudiante:", eId);
      
      // 1. Buscar datos del estudiante directamente
      const res = await fetch(`${API}/caja/buscar-estudiantes?id=${eId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const students = await res.json();
        const student = Array.isArray(students) ? students.find((s: any) => s.id === eId) : students;
        
        if (student && student.id) {
          console.log("✅ Estudiante encontrado:", student.primer_nombre);
          setBeneficiarioSeleccionado(student);
          setBusquedaBeneficiario(`${student.primer_apellido || ''} ${student.primer_nombre || ''}`.trim());
          
          // 2. Cargar facturas y seleccionar la que viene
          const resF = await fetch(`${API}/caja/estudiantes/${eId}/facturas-pendientes`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          let facturaEncontrada = false;

          if (resF.ok) {
            const dataF = await resF.json();
            const facturas = dataF.data || [];
            setFacturasPendientes(facturas);
            
            if (fId && facturas.length > 0) {
              const fac = facturas.find((f: any) => f.id === fId);
              if (fac) {
                facturaEncontrada = true;
                setFacturaIdSeleccionada(fac.id);
                setMonto(fac.total.toString());
                setObservacion(`Pago de factura ${fac.numero_factura}`);
                
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

          // 3. Si no hay factura previa, buscar el Servicio / Concepto Académico de Pensión y auto-cargarlo
          if (!facturaEncontrada) {
            if (mesNombre && anio) {
              setObservacion(`PAGO DEL MES DE ${mesNombre.toUpperCase()} ${anio}`);
            }

            console.group("📡 [PETICIÓN CAJA] GET /inventario/articulos");
            const resArts = await fetch(`${API}/inventario/articulos`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (resArts.ok) {
              const articulos = await resArts.json();
              console.log("📦 Catálogo completo de artículos/servicios devueltos:", articulos);
              if (Array.isArray(articulos)) {
                console.table(
                  articulos.map((a: any) => ({
                    ID: a.id,
                    Nombre: a.nombre,
                    Precio: a.precio_venta || a.precio_unitario,
                    EsServicio: a.es_servicio
                  }))
                );
              }
              if (Array.isArray(articulos) && articulos.length > 0) {
                // Normalizar grado del estudiante (ej: "Pre-Jardín" -> "prejardin", "Transición" -> "transicion")
                const cleanGrade = (grado || '')
                  .toLowerCase()
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "")
                  .replace(/[^a-z0-9]/g, "");

                // Normalizar abreviaturas del colegio (PJ -> Pre-Jardín, J -> Jardín, T -> Transición, M -> Maternal)
                const rawGrad = (grado || '').toUpperCase().trim();
                let targetGradeKey = '';

                if (rawGrad.startsWith('PJ') || rawGrad.includes('PREJ') || rawGrad.includes('PRE-J') || rawGrad.includes('PRE J')) {
                  targetGradeKey = 'prejardin';
                } else if (rawGrad.startsWith('J') || rawGrad.includes('JARDIN') || rawGrad.includes('JARDÍN')) {
                  targetGradeKey = 'jardin';
                } else if (rawGrad.startsWith('T') || rawGrad.includes('TRANSIC')) {
                  targetGradeKey = 'transicion';
                } else if (rawGrad.startsWith('M') || rawGrad.includes('MATERN')) {
                  targetGradeKey = 'maternal';
                } else if (rawGrad.startsWith('P') || rawGrad.includes('PARVUL')) {
                  targetGradeKey = 'parvulos';
                } else {
                  targetGradeKey = rawGrad.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
                }

                // Filtrar estrictamente solo ítems de servicio excluyendo Matrícula, Formulario o Uniformes
                const serviciosPension = articulos.filter((a: any) => {
                  if (!a.es_servicio) return false;
                  const nameLower = (a.nombre || '').toLowerCase();
                  return !nameLower.includes('matricula') && 
                         !nameLower.includes('matrícula') && 
                         !nameLower.includes('formulario') && 
                         !nameLower.includes('uniforme');
                });

                let pencionMatch = null;

                // 1. Buscar servicio por clave de grado normalizada
                if (targetGradeKey) {
                  pencionMatch = serviciosPension.find((a: any) => {
                    const artName = (a.nombre || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    if (targetGradeKey === 'prejardin') {
                      return artName.includes('prej') || artName.includes('pre-j') || artName.includes('pre j') || artName.includes('pj');
                    }
                    if (targetGradeKey === 'jardin') {
                      return (artName.includes('jardin') || artName.endsWith(' j') || artName.includes(' j ')) && !artName.includes('pre');
                    }
                    if (targetGradeKey === 'transicion') {
                      return artName.includes('transic') || artName.includes('trans') || artName.endsWith(' t') || artName.includes(' t ') || artName.includes('t-');
                    }
                    if (targetGradeKey === 'maternal') {
                      return artName.includes('matern') || artName.includes('mat');
                    }
                    if (targetGradeKey === 'parvulos') {
                      return artName.includes('parvul') || artName.includes('parv');
                    }
                    return artName.replace(/[^a-z0-9]/g, "").includes(targetGradeKey);
                  });
                }

                // 2. Buscar servicio que contenga "Pensión" o "Pension"
                if (!pencionMatch) {
                  pencionMatch = serviciosPension.find((a: any) => {
                    const nameLower = (a.nombre || '').toLowerCase();
                    return nameLower.includes('pension') || nameLower.includes('pensión');
                  });
                }

                // 3. Último fallback: tomar el primer servicio que NO sea Matrícula
                if (!pencionMatch && serviciosPension.length > 0) {
                  pencionMatch = serviciosPension[0];
                }

                if (pencionMatch) {
                  const precio = Number(pencionMatch.precio_venta || pencionMatch.precio_unitario || 170000);
                  const itemCarrito = {
                    id: pencionMatch.id,
                    articulo_inventario_id: pencionMatch.id,
                    nombre: pencionMatch.nombre,
                    precio_unitario: precio,
                    cantidad: 1,
                    es_concepto: false,
                    aplica_iva: false,
                    porcentaje_iva: 0
                  };
                  setArticulosVenta([itemCarrito]);
                  setMonto(precio.toString());
                  console.log("✨ Servicio Académico por Grado pre-seleccionado:", pencionMatch.nombre, "para el grado:", grado);
                }
              }
            }
            console.groupEnd();
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
      if (res.ok) {
        const data = await res.json();
        if (data && !data.statusCode) {
          setResumen(data);
        }
      }
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
        setArticulosInventario(data.filter((a: any) => tipo === "EGRESO" || a.es_servicio || a.cantidad_stock > 0));
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
          estudiante_id: tipo === "INGRESO" ? (beneficiarioSeleccionado?.id || null) : null,
          empleado_id: tipo === "EGRESO" ? (beneficiarioSeleccionado?.id || null) : null,
          estudiante_nombre: nombreCompleto,
          monto: parseFloat(monto), // Enviar monto total
          concepto: articulosVenta.length > 0 ? articulosVenta[0].nombre + (articulosVenta.length > 1 ? "..." : "") : "Varios", // Enviar concepto descriptivo
          conceptos: articulosVenta.map(av => ({
            articulo_inventario_id: av.articulo_inventario_id || av.articulo_id || (av.es_concepto ? null : av.id),
            concepto_cobro_id: av.concepto_cobro_id || av.concepto_id || (av.es_concepto ? av.id : null),
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

  const anularMovimiento = async (id: string) => {
    if (!confirm("¿Está seguro de anular esta transacción? Se revertirá en contabilidad e inventario.")) return;
    setLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API}/caja/movimientos/${id}/anular`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showToast("Transacción anulada correctamente", "success");
        cargarResumen();
      } else {
        const err = await res.json();
        showToast(err.message || "Error al anular transacción", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error de conexión", "error");
    } finally {
      setLoading(false);
    }
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
    conceptoSeleccionado, setConceptoSeleccionado,
    anularMovimiento
  };
};
