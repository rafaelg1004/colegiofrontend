import React from 'react';
import styles from '../FinanzasDashboard.module.css';

interface FinanzasFiltersBarProps {
  mesFiltro: number;
  setMesFiltro: (mes: number) => void;
  anioFiltro: number;
  setAnioFiltro: (anio: number) => void;
  aniosLectivos: number[];
  estadoFiltro: string;
  setEstadoFiltro: (estado: string) => void;
  grupoFiltro: string;
  setGrupoFiltro: (grupoId: string) => void;
  grupos: any[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  meses: { id: number; nombre: string }[];
  handleExportExcel: () => void;
  handleExportExcelAnual: () => void;
  exportingAnual: boolean;
}

export const FinanzasFiltersBar: React.FC<FinanzasFiltersBarProps> = ({
  mesFiltro,
  setMesFiltro,
  anioFiltro,
  setAnioFiltro,
  aniosLectivos,
  estadoFiltro,
  setEstadoFiltro,
  grupoFiltro,
  setGrupoFiltro,
  grupos,
  searchQuery,
  setSearchQuery,
  meses,
  handleExportExcel,
  handleExportExcelAnual,
  exportingAnual,
}) => {
  const mesNombre = meses.find(m => m.id === mesFiltro)?.nombre || '';

  return (
    <div className={styles.filtersBar}>
      <div className={styles.filterGroup}>
        <select 
          value={mesFiltro} 
          onChange={(e) => setMesFiltro(Number(e.target.value))}
          className={styles.selectInput}
        >
          {meses.map(m => (
            <option key={m.id} value={m.id}>{m.nombre}</option>
          ))}
        </select>

        <select 
          value={anioFiltro} 
          onChange={(e) => setAnioFiltro(Number(e.target.value))}
          className={styles.selectInput}
        >
          {(aniosLectivos.length > 0 ? aniosLectivos : [new Date().getFullYear()]).map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        <select 
          value={estadoFiltro} 
          onChange={(e) => setEstadoFiltro(e.target.value)}
          className={styles.selectInput}
        >
          <option value="Todos">Todos los Estados</option>
          <option value="Debe">Quiénes Deben (Pendientes)</option>
          <option value="Al dia">Quiénes Están al Día</option>
          <option value="Sin Factura">Sin Factura Generada</option>
        </select>

        <select 
          value={grupoFiltro} 
          onChange={(e) => setGrupoFiltro(e.target.value)}
          className={styles.selectInput}
        >
          <option value="">Todos los Grados</option>
          {grupos.map(g => (
            <option key={g.id} value={g.id}>{g.nombre}</option>
          ))}
        </select>

        <input 
          type="text"
          placeholder="🔍 Buscar estudiante o acudiente..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button 
          className={styles.exportBtn}
          onClick={handleExportExcel}
          title={`Exportar listado de ${mesNombre} a Excel`}
        >
          <span>📥</span> Exportar Mes ({mesNombre})
        </button>

        <button 
          className={styles.exportBtn}
          style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
          onClick={handleExportExcelAnual}
          disabled={exportingAnual}
          title="Exportar reporte de todos los meses del año a Excel"
        >
          <span>📊</span> {exportingAnual ? 'Generando Reporte...' : 'Exportar Todos los Meses'}
        </button>
      </div>
    </div>
  );
};
