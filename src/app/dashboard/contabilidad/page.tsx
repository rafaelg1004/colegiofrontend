"use client";

import styles from "./Contabilidad.module.css";
import MetricasFinancierasTab from "./components/MetricasFinancierasTab";
import PlanCuentasTab from "./components/PlanCuentasTab";
import AsientoManualTab from "./components/AsientoManualTab";
import LibroDiarioTab from "./components/LibroDiarioTab";
import BalanceComprobacionTab from "./components/BalanceComprobacionTab";
import { useContabilidad } from "@/hooks/contabilidad/useContabilidad";

export default function ContabilidadPage() {
  const { state, actions } = useContabilidad();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Módulo Contable</h1>
      </div>

      <div className={styles.widgetsContainer}>
        <div className={styles.widget}>
          <span className={styles.widgetTitle}>Total Activos</span>
          <span className={`${styles.widgetValue} ${state.totalActivos >= 0 ? styles.positive : styles.negative}`}>
            ${state.totalActivos.toLocaleString('es-CO')}
          </span>
        </div>
        <div className={styles.widget}>
          <span className={styles.widgetTitle}>Total Pasivos</span>
          <span className={styles.widgetValue}>
            ${state.totalPasivos.toLocaleString('es-CO')}
          </span>
        </div>
        <div className={styles.widget}>
          <span className={styles.widgetTitle}>Ingresos</span>
          <span className={`${styles.widgetValue} ${styles.positive}`}>
            ${state.totalIngresos.toLocaleString('es-CO')}
          </span>
        </div>
        <div className={styles.widget}>
          <span className={styles.widgetTitle}>Gastos Operativos</span>
          <span className={`${styles.widgetValue} ${styles.negative}`}>
            ${state.totalGastos.toLocaleString('es-CO')}
          </span>
        </div>
      </div>

      <div className={styles.tabsContainer}>
        {state.tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              actions.setActiveTab(tab.id);
              if (tab.id === "balance") actions.loadBalance();
              if (tab.id === "metricas") actions.loadMetricas();
              if (tab.id === "facturacion" && state.cuentas.length === 0)
                actions.loadCuentas();
            }}
            className={`${styles.tab} ${state.activeTab === tab.id ? styles.tabActive : ""}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {state.activeTab === "metricas" && (
        <MetricasFinancierasTab metricas={state.metricas} />
      )}

      {state.activeTab === "cuentas" && (
        <PlanCuentasTab
          cuentas={state.cuentas}
          formCuenta={state.formCuenta}
          setFormCuenta={actions.setFormCuenta}
          tipos={state.tipos}
          naturalezas={state.naturalezas}
          tipoFiltro={state.tipoFiltro}
          setTipoFiltro={actions.setTipoFiltro}
          loadCuentas={actions.loadCuentas}
          loading={state.loading}
          handleSaveCuenta={actions.handleSaveCuenta}
          handleDeleteCuenta={actions.handleDeleteCuenta}
          crearCuentasIniciales={actions.crearCuentasIniciales}
        />
      )}

      {state.activeTab === "facturacion" && (
        <AsientoManualTab
          busquedaEstudiante={state.busquedaEstudiante}
          setBusquedaEstudiante={actions.setBusquedaEstudiante}
          estudiantes={state.estudiantes}
          buscarEstudiantes={actions.buscarEstudiantes}
          estudianteSeleccionado={state.estudianteSeleccionado}
          setEstudianteSeleccionado={actions.setEstudianteSeleccionado}
          conceptoFactura={state.conceptoFactura}
          setConceptoFactura={actions.setConceptoFactura}
          conceptosDefault={state.conceptosDefault}
          montoFactura={state.montoFactura}
          setMontoFactura={actions.setMontoFactura}
          showDropdown={state.showDropdown}
          setShowDropdown={actions.setShowDropdown}
          loading={state.loading}
          crearFactura={actions.crearFactura}
          seleccionarEstudiante={actions.seleccionarEstudiante}
        />
      )}

      {state.activeTab === "movimientos" && (
        <LibroDiarioTab
          cuentas={state.cuentas}
          formMovimiento={state.formMovimiento}
          setFormMovimiento={actions.setFormMovimiento}
          movimientos={state.movimientos}
          fechaDesde={state.fechaDesde}
          setFechaDesde={actions.setFechaDesde}
          fechaHasta={state.fechaHasta}
          setFechaHasta={actions.setFechaHasta}
          loadMovimientos={actions.loadMovimientos}
          loading={state.loading}
          handleSaveMovimiento={actions.handleSaveMovimiento}
        />
      )}

      {state.activeTab === "balance" && (
        <BalanceComprobacionTab
          balance={state.balance}
          fechaDesde={state.fechaDesde}
          setFechaDesde={actions.setFechaDesde}
          fechaHasta={state.fechaHasta}
          setFechaHasta={actions.setFechaHasta}
          loadBalance={actions.loadBalance}
        />
      )}
    </div>
  );
}
