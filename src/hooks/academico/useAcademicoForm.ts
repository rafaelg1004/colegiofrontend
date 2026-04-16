"use client";

import { useState, useCallback } from "react";
import { getAuthToken } from "@/utils/auth";
import { API_URL } from "@/utils/api";
import type { ModalType, TabId } from "@/components/academico/types";

interface UseAcademicoFormProps {
  anioSeleccionado: string;
  institucion: { id: string } | null;
  refreshData: Record<TabId, () => Promise<void>>;
}

export function useAcademicoForm({
  anioSeleccionado,
  institucion,
  refreshData,
}: UseAcademicoFormProps) {
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<ModalType>("sede");
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, unknown>>({});

  const formatDateForInput = (isoDate?: string): string => {
    if (!isoDate) return "";
    const date = new Date(isoDate);
    return date.toISOString().split("T")[0];
  };

  const openModal = useCallback(
    (type: ModalType, data?: Record<string, unknown> & { id?: string }) => {
      setModalType(type);
      const isEdit = data && data.id;
      setModalMode(isEdit ? "edit" : "create");

      let defaultData: Record<string, unknown> = data || {};

      if (type === "sede" && !data && institucion) {
        defaultData = { institucion_id: institucion.id };
      }
      if (type === "anio" && !data) {
        defaultData = { anio: new Date().getFullYear(), activo: false };
      }
      if (type === "anio" && data) {
        defaultData = {
          ...data,
          fecha_inicio: formatDateForInput(data.fecha_inicio as string),
          fecha_fin: formatDateForInput(data.fecha_fin as string),
        };
      }
      if (type === "periodo" && !data) {
        defaultData = { numero: 1, porcentaje_peso: 25, activo: false };
      }
      if (type === "periodo" && data) {
        defaultData = {
          ...data,
          fecha_inicio: formatDateForInput(data.fecha_inicio as string),
          fecha_fin: formatDateForInput(data.fecha_fin as string),
        };
      }

      setFormData(defaultData);
      setShowModal(true);
    },
    [institucion],
  );

  const closeModal = useCallback(() => {
    setShowModal(false);
    setFormData({});
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]:
          type === "checkbox"
            ? (e.target as HTMLInputElement).checked
            : type === "number"
              ? parseFloat(value) || 0
              : value,
      }));
    },
    [],
  );

  const handleSubmit = useCallback(async () => {
    setSaving(true);
    try {
      const token = getAuthToken();
      let endpoint = "";
      let body: Record<string, unknown> = {};

      switch (modalType) {
        case "sede":
          endpoint = "sedes";
          body = {
            nombre: formData.nombre,
            direccion: formData.direccion,
            telefono: formData.telefono,
            institucion_id: formData.institucion_id || institucion?.id,
          };
          break;
        case "anio":
          endpoint = "anios-lectivos";
          body = {
            anio: parseInt(formData.anio as string) || new Date().getFullYear(),
            fecha_inicio: formData.fecha_inicio,
            fecha_fin: formData.fecha_fin,
            activo: formData.activo || false,
          };
          break;
        case "periodo":
          endpoint = "periodos";
          body = {
            nombre: formData.nombre,
            numero: parseInt(formData.numero as string),
            porcentaje_peso: parseFloat(formData.porcentaje_peso as string),
            anio_lectivo_id: anioSeleccionado,
            fecha_inicio: formData.fecha_inicio,
            fecha_fin: formData.fecha_fin,
          };
          break;
        case "area":
          endpoint = "areas";
          body = { nombre: formData.nombre };
          break;
        case "asignatura":
          endpoint = "asignaturas";
          body = { nombre: formData.nombre, area_id: formData.area_id };
          break;
        case "nivel":
          endpoint = "niveles";
          body = { nombre: formData.nombre };
          break;
        case "grado":
          endpoint = "grados";
          body = {
            nombre: formData.nombre,
            codigo: formData.codigo,
            orden: parseInt(formData.orden as string) || 1,
            nivel_id: formData.nivel_id,
          };
          break;
        case "tipo-actividad":
          endpoint = "tipos-actividad";
          body = { nombre: formData.nombre };
          break;
      }

      const isEdit = modalMode === "edit" && formData.id;
      const url = isEdit
        ? `${API_URL}/academico/${endpoint}/${formData.id}`
        : `${API_URL}/academico/${endpoint}`;

      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error al guardar");
      }

      const tabId = modalType === "asignatura" ? "areas" : (modalType + "s" as TabId);
      const refreshFn = refreshData[tabId];
      if (refreshFn) await refreshFn();

      closeModal();
      return { success: true };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error al guardar";
      return { success: false, error: message };
    } finally {
      setSaving(false);
    }
  }, [modalType, modalMode, formData, anioSeleccionado, institucion, refreshData, closeModal]);

  return {
    showModal,
    modalType,
    modalMode,
    saving,
    formData,
    openModal,
    closeModal,
    handleChange,
    handleSubmit,
  };
}
