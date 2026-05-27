import { useState, useEffect } from "react";
import { ContabilidadService } from "../../services/contabilidad.service";

export interface CuentaContable {
  id: string;
  codigo: string;
  nombre: string;
  tipo: string;
  naturaleza: string;
}

export interface MovimientoContable {
  id: string;
  fecha: string;
  descripcion: string;
  debe: number;
  haber: number;
  cuenta?: { codigo: string; nombre: string; tipo: string };
  factura?: { numero_factura: string };
  nomina?: { periodo_mes: number; periodo_anio: number };
}

export function useContabilidad() {
  const [activeTab, setActiveTab] = useState("cuentas");
  const [loading, setLoading] = useState(false);

  // Datos
  const [cuentas, setCuentas] = useState<CuentaContable[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoContable[]>([]);
  const [balance, setBalance] = useState<any>(null);
  const [metricas, setMetricas] = useState<any>(null);

  // Forms
  const [formCuenta, setFormCuenta] = useState({
    codigo: "",
    nombre: "",
    tipo: "",
    naturaleza: "",
  });
  const [formMovimiento, setFormMovimiento] = useState({
    descripcion: "",
    debe: 0,
    haber: 0,
    cuenta_contable_id: "",
  });

  // Facturación
  const [estudiantes, setEstudiantes] = useState<any[]>([]);
  const [busquedaEstudiante, setBusquedaEstudiante] = useState("");
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState<any>(null);
  const [conceptoFactura, setConceptoFactura] = useState("");
  const [montoFactura, setMontoFactura] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  // Filtros
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  const loadCuentas = async () => {
    try {
      const data = await ContabilidadService.getCuentas(tipoFiltro);
      setCuentas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error cargando cuentas:", err);
      alert("Error de conexión al cargar cuentas");
      setCuentas([]);
    }
  };

  const loadMovimientos = async () => {
    try {
      const data = await ContabilidadService.getMovimientos(fechaDesde, fechaHasta);
      setMovimientos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error cargando movimientos:", err);
      alert("Error de conexión al cargar movimientos");
      setMovimientos([]);
    }
  };

  const loadBalance = async () => {
    try {
      const data = await ContabilidadService.getBalanceComprobacion(fechaDesde, fechaHasta);
      setBalance(data);
    } catch (err) {
      console.error("Error cargando balance:", err);
      alert("Error de conexión al cargar balance");
      setBalance(null);
    }
  };

  const loadMetricas = async () => {
    try {
      const data = await ContabilidadService.getMetricasFinancieras();
      setMetricas(data);
    } catch (err) {
      console.error("Error cargando métricas:", err);
    }
  };

  useEffect(() => {
    loadCuentas();
    loadMovimientos();
    loadBalance();
    loadMetricas();
  }, []);

  // Funciones de Facturación
  const buscarEstudiantes = async (query: string) => {
    if (query.length < 2) {
      setEstudiantes([]);
      setShowDropdown(false);
      return;
    }
    try {
      const data = await ContabilidadService.searchEstudiantes(query);
      setEstudiantes(data.data || []);
      setShowDropdown(true);
    } catch (err) {
      console.error("Error buscando estudiantes:", err);
    }
  };

  const seleccionarEstudiante = (est: any) => {
    setEstudianteSeleccionado(est);
    setBusquedaEstudiante(`${est.primer_nombre} ${est.primer_apellido} - ${est.numero_documento}`);
    setShowDropdown(false);
  };

  const crearFactura = async () => {
    if (!estudianteSeleccionado || !conceptoFactura || montoFactura <= 0) {
      alert("Seleccione un estudiante, ingrese concepto y monto");
      return;
    }
    setLoading(true);

    if (cuentas.length === 0) {
      await loadCuentas();
    }
    await new Promise((resolve) => setTimeout(resolve, 100));

    const conceptoLower = conceptoFactura.toLowerCase();
    const cuentaEncontrada = cuentas.find((c) => {
      const codigo = c.codigo;
      if (conceptoLower.includes("matrícula") || conceptoLower.includes("matricula")) return codigo === "4105";
      if (conceptoLower.includes("pensión") || conceptoLower.includes("pensio")) return codigo === "4115";
      if (conceptoLower.includes("merienda")) return codigo === "4130" || codigo === "4135";
      if (conceptoLower.includes("formulario")) return codigo === "4110";
      if (conceptoLower.includes("grado")) return codigo === "4120";
      if (conceptoLower.includes("clausura")) return codigo === "4125";
      return codigo === "4140";
    });
    const cuentaId = cuentaEncontrada?.id || "";

    if (!cuentaId) {
      alert("Cuenta de ingresos no encontrada. Cree las cuentas primero en la pestaña Plan de Cuentas.");
      setLoading(false);
      return;
    }

    try {
      // Movimiento ingreso
      await ContabilidadService.createMovimiento({
        descripcion: `${conceptoFactura} - ${estudianteSeleccionado.primer_nombre} ${estudianteSeleccionado.primer_apellido}`,
        haber: Number(montoFactura),
        cuenta_contable_id: cuentaId,
        fecha: new Date().toISOString().split("T")[0],
      });

      await loadCuentas();
      await new Promise((resolve) => setTimeout(resolve, 100));

      const cuentaBancaria = cuentas.find((c) => c.codigo === "1105" || c.codigo === "1110");
      if (cuentaBancaria) {
        await ContabilidadService.createMovimiento({
          descripcion: `Cobro ${conceptoFactura} - ${estudianteSeleccionado.primer_nombre} ${estudianteSeleccionado.primer_apellido}`,
          debe: Number(montoFactura),
          cuenta_contable_id: cuentaBancaria.id,
          fecha: new Date().toISOString().split("T")[0],
        });
      }

      loadMovimientos();
      loadBalance();

      alert("Factura registrada correctamente");
      setEstudianteSeleccionado(null);
      setBusquedaEstudiante("");
      setConceptoFactura("");
      setMontoFactura(0);
    } catch (err: any) {
      alert(err.message || "Error al crear factura");
    }
    setLoading(false);
  };

  const handleSaveCuenta = async () => {
    if (!formCuenta.codigo || !formCuenta.nombre || !formCuenta.tipo || !formCuenta.naturaleza) {
      alert("Complete todos los campos");
      return;
    }
    setLoading(true);
    try {
      await ContabilidadService.createCuenta(formCuenta);
      setFormCuenta({ codigo: "", nombre: "", tipo: "", naturaleza: "" });
      loadCuentas();
    } catch (err: any) {
      alert(err.message || "Error guardando");
    }
    setLoading(false);
  };

  const handleDeleteCuenta = async (id: string) => {
    if (!confirm("¿Eliminar cuenta?")) return;
    try {
      await ContabilidadService.deleteCuenta(id);
      loadCuentas();
    } catch (err) {
      alert("Error al eliminar");
    }
  };

  const crearCuentasIniciales = async () => {
    if (!confirm("¿Crear plan de cuentas inicial? Esto agregará las cuentas básicas del colegio.")) return;

    setLoading(true);
    const cuentasIniciales = [
      { codigo: "4105", nombre: "Matrículas", tipo: "Ingreso", naturaleza: "Crédito" },
      { codigo: "4110", nombre: "Formularios", tipo: "Ingreso", naturaleza: "Crédito" },
      { codigo: "4115", nombre: "Pensiones (10 meses)", tipo: "Ingreso", naturaleza: "Crédito" },
      { codigo: "4120", nombre: "Derecho a Grado", tipo: "Ingreso", naturaleza: "Crédito" },
      { codigo: "4125", nombre: "Clausura", tipo: "Ingreso", naturaleza: "Crédito" },
      { codigo: "4130", nombre: "Meriendas", tipo: "Ingreso", naturaleza: "Crédito" },
      { codigo: "4135", nombre: "Meriendas Sodexo", tipo: "Ingreso", naturaleza: "Crédito" },
      { codigo: "4140", nombre: "Otras Actividades", tipo: "Ingreso", naturaleza: "Crédito" },
      { codigo: "5105", nombre: "Pagos Docentes", tipo: "Gasto", naturaleza: "Débito" },
      { codigo: "5110", nombre: "Arriendo", tipo: "Gasto", naturaleza: "Débito" },
      { codigo: "5115", nombre: "Servicios (Luz, Agua, Internet)", tipo: "Gasto", naturaleza: "Débito" },
      { codigo: "5120", nombre: "4x1000", tipo: "Gasto", naturaleza: "Débito" },
      { codigo: "5125", nombre: "Aportes COOIENEM", tipo: "Gasto", naturaleza: "Débito" },
      { codigo: "5130", nombre: "Servicios Contadora", tipo: "Gasto", naturaleza: "Débito" },
      { codigo: "5200", nombre: "Implementos de Aseo", tipo: "Gasto", naturaleza: "Débito" },
      { codigo: "5205", nombre: "Material Didáctico", tipo: "Gasto", naturaleza: "Débito" },
      { codigo: "5210", nombre: "Cafetería Docente", tipo: "Gasto", naturaleza: "Débito" },
      { codigo: "5215", nombre: "Transporte", tipo: "Gasto", naturaleza: "Débito" },
      { codigo: "5220", nombre: "Mano de Obra", tipo: "Gasto", naturaleza: "Débito" },
      { codigo: "5225", nombre: "Mantenimiento y Reparación", tipo: "Gasto", naturaleza: "Débito" },
      { codigo: "5230", nombre: "Papelería Administrativa", tipo: "Gasto", naturaleza: "Débito" },
      { codigo: "5235", nombre: "Bono Cumpleaños", tipo: "Gasto", naturaleza: "Débito" },
      { codigo: "1105", nombre: "Caja", tipo: "Activo", naturaleza: "Débito" },
      { codigo: "1110", nombre: "Banco", tipo: "Activo", naturaleza: "Débito" },
      { codigo: "2105", nombre: "Cuentas por Pagar", tipo: "Pasivo", naturaleza: "Crédito" },
    ];

    try {
      let creadas = 0;
      for (const cuenta of cuentasIniciales) {
        try {
          await ContabilidadService.createCuenta(cuenta);
          creadas++;
        } catch (e) {
          // Ignorar cuentas duplicadas
        }
      }
      loadCuentas();
      alert(`Plan de cuentas creado: ${creadas} cuentas registradas`);
    } catch (err) {
      alert("Error al crear cuentas iniciales");
    }
    setLoading(false);
  };

  const handleSaveMovimiento = async () => {
    if (!formMovimiento.descripcion || !formMovimiento.cuenta_contable_id) {
      alert("Complete los campos");
      return;
    }
    if (formMovimiento.debe === 0 && formMovimiento.haber === 0) {
      alert("Ingrese al menos un valor en DÉBITO o CRÉDITO");
      return;
    }
    setLoading(true);
    try {
      await ContabilidadService.createMovimiento({
        ...formMovimiento,
        fecha: new Date().toISOString().split("T")[0],
      });
      setFormMovimiento({ descripcion: "", debe: 0, haber: 0, cuenta_contable_id: "" });
      loadMovimientos();
    } catch (err: any) {
      alert(err.message || "Error guardando");
    }
    setLoading(false);
  };

  const conceptosDefault = [
    "Matrícula",
    "Pensión Mes de",
    "Formularios",
    "Derecho a Grado",
    "Clausura",
    "Meriendas",
    "Meriendas Sodexo",
    "Uniforme",
    "Materiales",
    "Otra",
  ];

  const tipos = ["Activo", "Pasivo", "Patrimonio", "Ingreso", "Gasto", "Costo"];
  const naturalezas = ["Débito", "Crédito"];

  const tabs = [
    { id: "metricas", label: "Métricas Financieras" },
    { id: "cuentas", label: "Plan de Cuentas (PUC)" },
    { id: "movimientos", label: "Libro Diario" },
    { id: "balance", label: "Balance de Comprobación" },
    { id: "facturacion", label: "Asiento Manual" },
  ];

  const totalActivos = balance?.cuentas?.find((c: any) => c.codigo === '1')?.saldo || 0;
  const totalPasivos = balance?.cuentas?.find((c: any) => c.codigo === '2')?.saldo || 0;
  const totalIngresos = balance?.cuentas?.find((c: any) => c.codigo === '4')?.saldo || 0;
  const totalGastos = balance?.cuentas?.find((c: any) => c.codigo === '5')?.saldo || 0;

  return {
    state: {
      activeTab, loading, cuentas, movimientos, balance, metricas, formCuenta, formMovimiento,
      estudiantes, busquedaEstudiante, estudianteSeleccionado, conceptoFactura, montoFactura,
      showDropdown, tipoFiltro, fechaDesde, fechaHasta,
      conceptosDefault, tipos, naturalezas, tabs,
      totalActivos, totalPasivos, totalIngresos, totalGastos
    },
    actions: {
      setActiveTab, setFormCuenta, setFormMovimiento,
      setBusquedaEstudiante, setEstudianteSeleccionado, setConceptoFactura,
      setMontoFactura, setShowDropdown, setTipoFiltro, setFechaDesde, setFechaHasta,
      loadCuentas, loadMovimientos, loadBalance, loadMetricas,
      buscarEstudiantes, seleccionarEstudiante, crearFactura,
      handleSaveCuenta, handleDeleteCuenta, crearCuentasIniciales, handleSaveMovimiento
    }
  };
}
