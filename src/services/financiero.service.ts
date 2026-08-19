import { getAuthToken } from "@/utils/auth";
import { API_URL } from "@/utils/auth";

const getHeaders = () => {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const FinancieroService = {
  // Resumen Financiero Global
  async getResumen() {
    const res = await fetch(`${API_URL}/financiero/resumen`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Listado de Deudores y Pensiones
  async getDeudores(params?: { mes?: number; anio?: number; estado?: string; grupo_id?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.mes) queryParams.append("mes", params.mes.toString());
    if (params?.anio) queryParams.append("anio", params.anio.toString());
    if (params?.estado && params.estado !== "Todos") queryParams.append("estado", params.estado);
    if (params?.grupo_id) queryParams.append("grupo_id", params.grupo_id);

    const queryStr = queryParams.toString() ? `?${queryParams.toString()}` : "";
    const url = `${API_URL}/financiero/deudores${queryStr}`;

    console.group(`📡 [PETICIÓN FINANZAS] GET /financiero/deudores${queryStr}`);
    console.log("🔍 Filtros enviados:", params);

    const res = await fetch(url, {
      headers: getHeaders(),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("❌ Error en petición deudores:", errText);
      console.groupEnd();
      throw new Error(errText);
    }

    const data = await res.json();
    console.log("📦 Respuesta completa del servidor:", data);
    
    if (data && Array.isArray(data.deudores)) {
      console.log(`📊 Total registros devueltos para el mes ${params?.mes || ''}: ${data.deudores.length}`);
      console.table(
        data.deudores.map((d: any) => ({
          Estudiante: d.estudiante_nombre,
          Grado: d.grado,
          Factura: d.numero_factura,
          Monto: d.monto_total,
          Pagado: d.monto_pagado,
          Deuda: d.deuda,
          Estado: d.estado,
          Mes: d.mes
        }))
      );
    }
    console.groupEnd();

    return data;
  },

  // Listado Anual de Deudores (Todos los Meses)
  async getDeudoresAnual(params?: { anio?: number; grupo_id?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.anio) queryParams.append("anio", params.anio.toString());
    if (params?.grupo_id) queryParams.append("grupo_id", params.grupo_id);

    const queryStr = queryParams.toString() ? `?${queryParams.toString()}` : "";
    const url = `${API_URL}/financiero/deudores-anual${queryStr}`;

    const res = await fetch(url, {
      headers: getHeaders(),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText);
    }

    return res.json();
  },

  // Generación Masiva de Pensiones
  async generarPensionesMasivas(dto: { mes: number; anio: number; anio_lectivo_id?: string; concepto_cobro_id?: string; articulo_id?: string }) {
    const res = await fetch(`${API_URL}/financiero/generar-pensiones`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(dto),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Generación de Cobro Extra
  async generarCobroExtra(dto: { articulo_id?: string; concepto_cobro_id?: string; descripcion?: string }) {
    const res = await fetch(`${API_URL}/financiero/generar-cobro-extra`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(dto),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Listar Grupos / Grados
  async getGrupos() {
    const res = await fetch(`${API_URL}/grupos`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Listar Años Lectivos
  async getAniosLectivos() {
    const res = await fetch(`${API_URL}/academico/anios-lectivos`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Listar Artículos / Servicios de Inventario para Facturación
  async getArticulosServicios() {
    const res = await fetch(`${API_URL}/inventario/articulos`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return (data || [])
      .filter((a: any) => a.es_servicio === true)
      .map((a: any) => ({ id: a.id, nombre: String(a.nombre || ""), tipo: "articulo" }));
  },
};
