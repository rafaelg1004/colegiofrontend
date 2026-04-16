"use client";

import { useState, useCallback, useEffect } from "react";
import { getAuthToken } from "@/utils/auth";
import { API_URL } from "@/utils/api";
import type {
  Sede,
  Institucion,
  AnioLectivo,
  Periodo,
  Area,
  Nivel,
  Grado,
  TipoActividad,
  TabId,
} from "@/components/academico/types";

export function useAcademicoData(activeTab: TabId) {
  const [loading, setLoading] = useState(false);

  const [sedes, setSedes] = useState<Sede[]>([]);
  const [anios, setAnios] = useState<AnioLectivo[]>([]);
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [grados, setGrados] = useState<Grado[]>([]);
  const [tiposActividad, setTiposActividad] = useState<TipoActividad[]>([]);
  const [institucion, setInstitucion] = useState<Institucion | null>(null);

  const [anioSeleccionado, setAnioSeleccionado] = useState<string>("");
  const [nivelFiltro, setNivelFiltro] = useState<string>("");

  const fetchSedes = useCallback(async () => {
    const token = getAuthToken();
    const res = await fetch(`${API_URL}/academico/sedes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setSedes(await res.json());
  }, []);

  const fetchAnios = useCallback(async () => {
    const token = getAuthToken();
    const res = await fetch(`${API_URL}/academico/anios-lectivos`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setAnios(data || []);
      const activo = data.find((a: AnioLectivo) => a.activo);
      if (activo && !anioSeleccionado) setAnioSeleccionado(activo.id);
    }
  }, [anioSeleccionado]);

  const fetchPeriodos = useCallback(async () => {
    if (!anioSeleccionado) return;
    const token = getAuthToken();
    const res = await fetch(
      `${API_URL}/academico/periodos?anio_lectivo_id=${anioSeleccionado}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    if (res.ok) setPeriodos(await res.json());
  }, [anioSeleccionado]);

  const fetchAreas = useCallback(async () => {
    const token = getAuthToken();
    const res = await fetch(`${API_URL}/academico/areas`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setAreas(await res.json());
  }, []);

  const fetchNiveles = useCallback(async () => {
    const token = getAuthToken();
    const res = await fetch(`${API_URL}/academico/niveles`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setNiveles(await res.json());
  }, []);

  const fetchGrados = useCallback(async () => {
    const token = getAuthToken();
    const url = nivelFiltro
      ? `${API_URL}/academico/grados?nivel_id=${nivelFiltro}`
      : `${API_URL}/academico/grados`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setGrados(await res.json());
  }, [nivelFiltro]);

  const fetchTiposActividad = useCallback(async () => {
    const token = getAuthToken();
    const res = await fetch(`${API_URL}/academico/tipos-actividad`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setTiposActividad(await res.json());
  }, []);

  const fetchInstitucion = useCallback(async () => {
    const token = getAuthToken();
    const res = await fetch(`${API_URL}/configuracion/institucion`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setInstitucion(data);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    const loadData = async () => {
      switch (activeTab) {
        case "sedes":
          await fetchSedes();
          break;
        case "anios":
          await fetchAnios();
          break;
        case "periodos":
          await fetchAnios();
          await fetchPeriodos();
          break;
        case "areas":
          await fetchAreas();
          break;
        case "niveles":
          await fetchNiveles();
          break;
        case "grados":
          await fetchNiveles();
          await fetchGrados();
          break;
        case "tipos-actividad":
          await fetchTiposActividad();
          break;
      }
      setLoading(false);
    };
    loadData();
  }, [
    activeTab,
    fetchSedes,
    fetchAnios,
    fetchPeriodos,
    fetchAreas,
    fetchNiveles,
    fetchGrados,
    fetchTiposActividad,
  ]);

  useEffect(() => {
    fetchInstitucion();
  }, [fetchInstitucion]);

  useEffect(() => {
    if (activeTab === "periodos" && anioSeleccionado) {
      fetchPeriodos();
    }
  }, [anioSeleccionado, activeTab, fetchPeriodos]);

  useEffect(() => {
    if (activeTab === "grados") {
      fetchGrados();
    }
  }, [nivelFiltro, activeTab, fetchGrados]);

  return {
    loading,
    sedes,
    anios,
    periodos,
    areas,
    niveles,
    grados,
    tiposActividad,
    institucion,
    anioSeleccionado,
    setAnioSeleccionado,
    nivelFiltro,
    setNivelFiltro,
    refreshData: {
      sedes: fetchSedes,
      anios: fetchAnios,
      periodos: fetchPeriodos,
      areas: fetchAreas,
      niveles: fetchNiveles,
      grados: fetchGrados,
      "tipos-actividad": fetchTiposActividad,
    },
  };
}
