"use client";

import { useState } from "react";
import styles from "./ConfiguracionAcademica.module.css";
import { useAcademicoData } from "@/hooks/academico/useAcademicoData";
import { useAcademicoDelete } from "@/hooks/academico/useAcademicoDelete";
import { useAcademicoForm } from "@/hooks/academico/useAcademicoForm";
import {
  SedesTab,
  AniosTab,
  PeriodosTab,
  AreasTab,
  NivelesTab,
  GradosTab,
  TiposActividadTab,
  FormModal,
  DeleteModal,
} from "./components";
import type { TabId, ModalType } from "./types";

const tabs = [
  { id: "anios" as TabId, name: "Años Lectivos", icon: "📅" },
  { id: "periodos" as TabId, name: "Periodos", icon: "📊" },
  { id: "sedes" as TabId, name: "Sedes", icon: "🏫" },
  { id: "areas" as TabId, name: "Áreas y Asignaturas", icon: "📚" },
  { id: "niveles" as TabId, name: "Niveles", icon: "🎚️" },
  { id: "grados" as TabId, name: "Grados", icon: "🎓" },
  { id: "tipos-actividad" as TabId, name: "Tipos de Actividad", icon: "📝" },
];

const addButtonConfig: Record<TabId, { label: string; type: ModalType }> = {
  sedes: { label: "+ Nueva Sede", type: "sede" },
  anios: { label: "+ Nuevo Año", type: "anio" },
  periodos: { label: "+ Nuevo Periodo", type: "periodo" },
  areas: { label: "+ Nueva Área", type: "area" },
  niveles: { label: "+ Nuevo Nivel", type: "nivel" },
  grados: { label: "+ Nuevo Grado", type: "grado" },
  "tipos-actividad": { label: "+ Nuevo Tipo", type: "tipo-actividad" },
};

export const ConfiguracionAcademica = () => {
  const [activeTab, setActiveTab] = useState<TabId>("anios");

  const {
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
    refreshData,
  } = useAcademicoData(activeTab);

  const {
    showDeleteModal,
    deleteItem,
    deleteError,
    deleting,
    openDeleteModal,
    closeDeleteModal,
    handleDelete,
  } = useAcademicoDelete({
    periodos,
    areas,
    grados,
    refreshData,
  });

  const {
    showModal,
    modalType,
    modalMode,
    saving,
    formData,
    openModal,
    closeModal,
    handleChange,
    handleSubmit,
  } = useAcademicoForm({
    anioSeleccionado,
    institucion,
    refreshData,
  });

  const renderContent = () => {
    switch (activeTab) {
      case "sedes":
        return (
          <SedesTab
            sedes={sedes}
            onEdit={(sede) =>
              openModal("sede", sede as unknown as Record<string, unknown>)
            }
            onDelete={(id, name) => openDeleteModal("sedes", id, name)}
          />
        );
      case "anios":
        return (
          <AniosTab
            anios={anios}
            onEdit={(anio) =>
              openModal("anio", anio as unknown as Record<string, unknown>)
            }
            onDelete={(id, name) => openDeleteModal("anios", id, name)}
          />
        );
      case "periodos":
        return (
          <PeriodosTab
            periodos={periodos}
            anios={anios}
            anioSeleccionado={anioSeleccionado}
            onAnioChange={setAnioSeleccionado}
            onEdit={(periodo) =>
              openModal(
                "periodo",
                periodo as unknown as Record<string, unknown>,
              )
            }
            onDelete={(id, name) => openDeleteModal("periodos", id, name)}
          />
        );
      case "areas":
        return (
          <AreasTab
            areas={areas}
            onEditArea={(area) =>
              openModal("area", area as unknown as Record<string, unknown>)
            }
            onDeleteArea={(id, name) => openDeleteModal("areas", id, name)}
            onAddAsignatura={(areaId) =>
              openModal("asignatura", { area_id: areaId })
            }
            onEditAsignatura={(asig, areaId) =>
              openModal("asignatura", { ...asig, area_id: areaId })
            }
          />
        );
      case "niveles":
        return (
          <NivelesTab
            niveles={niveles}
            onEdit={(nivel) =>
              openModal("nivel", nivel as unknown as Record<string, unknown>)
            }
            onDelete={(id, name) => openDeleteModal("niveles", id, name)}
          />
        );
      case "grados":
        return (
          <GradosTab
            grados={grados}
            niveles={niveles}
            nivelFiltro={nivelFiltro}
            onNivelChange={setNivelFiltro}
            onEdit={(grado) =>
              openModal("grado", grado as unknown as Record<string, unknown>)
            }
            onDelete={(id, name) => openDeleteModal("grados", id, name)}
          />
        );
      case "tipos-actividad":
        return (
          <TiposActividadTab
            tiposActividad={tiposActividad}
            onDelete={(id, name) =>
              openDeleteModal("tipos-actividad", id, name)
            }
          />
        );
      default:
        return null;
    }
  };

  const addBtn = addButtonConfig[activeTab];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Configuración Académica</h1>
        <button
          className={styles.addBtn}
          onClick={() => openModal(addBtn.type)}
        >
          {addBtn.label}
        </button>
      </div>

      <div className={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tabBtn} ${activeTab === tab.id ? styles.active : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span>{tab.icon}</span>
            {tab.name}
          </button>
        ))}
      </div>

      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner}></div>
        </div>
      )}

      <div className={styles.content}>{renderContent()}</div>

      <FormModal
        show={showModal}
        type={modalType}
        mode={modalMode}
        formData={formData}
        saving={saving}
        institucion={institucion}
        niveles={niveles}
        onClose={closeModal}
        onChange={handleChange}
        onSubmit={handleSubmit}
      />

      <DeleteModal
        show={showDeleteModal}
        itemName={deleteItem?.name || ""}
        error={deleteError}
        deleting={deleting}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
      />
    </div>
  );
};
