import { getAuthToken } from "@/utils/auth";
import { API_URL as API } from "@/utils/api";

const getHeaders = () => {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const ContabilidadService = {
  // Cuentas
  async getCuentas(tipo?: string) {
    const params = new URLSearchParams();
    if (tipo) params.append("tipo", tipo);
    const queryStr = params.toString() ? `?${params.toString()}` : "";
    
    const res = await fetch(`${API}/contabilidad/cuentas${queryStr}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async createCuenta(data: any) {
    const res = await fetch(`${API}/contabilidad/cuentas`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async deleteCuenta(id: string) {
    const res = await fetch(`${API}/contabilidad/cuentas/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Movimientos
  async getMovimientos(fechaDesde?: string, fechaHasta?: string, cuentaId?: string) {
    const params = new URLSearchParams();
    if (fechaDesde) params.append("fecha_desde", fechaDesde);
    if (fechaHasta) params.append("fecha_hasta", fechaHasta);
    if (cuentaId) params.append("cuenta_contable_id", cuentaId);
    const queryStr = params.toString() ? `?${params.toString()}` : "";

    const res = await fetch(`${API}/contabilidad/movimientos${queryStr}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async createMovimiento(data: any) {
    const res = await fetch(`${API}/contabilidad/movimientos`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Balance
  async getBalanceComprobacion(fechaDesde?: string, fechaHasta?: string) {
    const params = new URLSearchParams();
    if (fechaDesde) params.append("fecha_desde", fechaDesde);
    if (fechaHasta) params.append("fecha_hasta", fechaHasta);
    const queryStr = params.toString() ? `?${params.toString()}` : "";

    const res = await fetch(`${API}/contabilidad/balance-comprobacion${queryStr}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Métricas
  async getMetricasFinancieras() {
    const res = await fetch(`${API}/contabilidad/metricas`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Facturas / Asiento manual helper
  async searchEstudiantes(query: string) {
    const res = await fetch(`${API}/estudiantes?buscar=${query}&limit=10`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};
