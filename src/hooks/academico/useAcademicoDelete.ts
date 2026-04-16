"use client";

import { useState, useCallback } from "react";
import { getAuthToken } from "@/utils/auth";
import { API_URL } from "@/utils/api";
import type { TabId, Area } from "@/components/academico/types";

interface DeleteItem {
  id: string;
  name: string;
  type: TabId;
}

interface UseAcademicoDeleteProps {
  periodos: { anio_lectivo_id: string }[];
  areas: Area[];
  grados: { nivel_id: string }[];
  refreshData: Record<TabId, () => Promise<void>>;
}

export function useAcademicoDelete({
  periodos,
  areas,
  grados,
  refreshData,
}: UseAcademicoDeleteProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteItem, setDeleteItem] = useState<DeleteItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const checkDependencies = useCallback(
    (type: TabId, id: string): string | null => {
      switch (type) {
        case "anios":
          const hasPeriodos = periodos.some((p) => p.anio_lectivo_id === id);
          if (hasPeriodos)
            return "No se puede eliminar: Este año lectivo tiene períodos asociados.";
          return null;
        case "periodos":
          return null;
        case "areas": {
          const area = areas.find((a) => a.id === id);
          const hasAsignaturas = area?.asignatura && area.asignatura.length > 0;
          if (hasAsignaturas)
            return "No se puede eliminar: Esta área tiene asignaturas asociadas.";
          return null;
        }
        case "niveles":
          const hasGrados = grados.some((g) => g.nivel_id === id);
          if (hasGrados)
            return "No se puede eliminar: Este nivel tiene grados asociados.";
          return null;
        case "grados":
        case "sedes":
        case "tipos-actividad":
          return null;
        default:
          return null;
      }
    },
    [periodos, areas, grados],
  );

  const openDeleteModal = useCallback(
    (type: TabId, id: string, name: string) => {
      const dependencyError = checkDependencies(type, id);
      if (dependencyError) {
        setDeleteError(dependencyError);
      } else {
        setDeleteError(null);
      }
      setDeleteItem({ id, name, type });
      setShowDeleteModal(true);
    },
    [checkDependencies],
  );

  const closeDeleteModal = useCallback(() => {
    setShowDeleteModal(false);
    setDeleteError(null);
    setDeleteItem(null);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteItem) return;

    const dependencyError = checkDependencies(deleteItem.type, deleteItem.id);
    if (dependencyError) {
      setDeleteError(dependencyError);
      return;
    }

    setDeleting(true);
    try {
      const token = getAuthToken();
      let endpoint = "";

      switch (deleteItem.type) {
        case "sedes":
          endpoint = `sedes/${deleteItem.id}`;
          break;
        case "anios":
          endpoint = `anios-lectivos/${deleteItem.id}`;
          break;
        case "periodos":
          endpoint = `periodos/${deleteItem.id}`;
          break;
        case "areas":
          endpoint = `areas/${deleteItem.id}`;
          break;
        case "niveles":
          endpoint = `niveles/${deleteItem.id}`;
          break;
        case "grados":
          endpoint = `grados/${deleteItem.id}`;
          break;
        case "tipos-actividad":
          endpoint = `tipos-actividad/${deleteItem.id}`;
          break;
        default:
          throw new Error("Tipo no soportado para eliminación");
      }

      const res = await fetch(`${API_URL}/academico/${endpoint}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error al eliminar");
      }

      const refreshFn = refreshData[deleteItem.type];
      if (refreshFn) await refreshFn();

      closeDeleteModal();
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Error al eliminar el elemento";
      setDeleteError(message);
    } finally {
      setDeleting(false);
    }
  }, [deleteItem, checkDependencies, refreshData, closeDeleteModal]);

  return {
    showDeleteModal,
    deleteItem,
    deleteError,
    deleting,
    openDeleteModal,
    closeDeleteModal,
    handleDelete,
  };
}
