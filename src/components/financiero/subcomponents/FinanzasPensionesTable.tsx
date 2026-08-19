import React from 'react';
import styles from '../FinanzasDashboard.module.css';

interface FinanzasPensionesTableProps {
  filteredDeudores: any[];
  loadingDeudores: boolean;
  mesFiltro: number;
  anioFiltro: number;
  meses: { id: number; nombre: string }[];
  formatMoney: (val: number) => string;
  handleVerRecibo: (item: any) => void;
  onRegistrarPago: (item: any) => void;
}

export const FinanzasPensionesTable: React.FC<FinanzasPensionesTableProps> = ({
  filteredDeudores,
  loadingDeudores,
  mesFiltro,
  anioFiltro,
  meses,
  formatMoney,
  handleVerRecibo,
  onRegistrarPago,
}) => {
  const mesNombre = meses.find(m => m.id === mesFiltro)?.nombre || '';

  return (
    <div className={styles.mainGrid}>
      <div className={styles.tableSection}>
        <div className={styles.sectionHeader}>
          <h3>Listado de Pensiones ({mesNombre} {anioFiltro})</h3>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>N° Factura</th>
                <th>Estudiante</th>
                <th>Grado</th>
                <th>Padre / Acudiente</th>
                <th>Mes Evaluado</th>
                <th>Monto Total</th>
                <th>Pagado</th>
                <th>Deuda</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loadingDeudores ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b', fontWeight: 500 }}>
                    ⏳ Cargando listado de pensiones para {mesNombre} {anioFiltro}...
                  </td>
                </tr>
              ) : filteredDeudores.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '2rem' }}>
                    No se encontraron registros para los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredDeudores.map((item) => (
                  <tr key={item.estudiante_id + (item.factura_id || '')}>
                    <td>
                      <strong style={{ fontSize: '0.85rem' }}>{item.numero_factura}</strong>
                    </td>
                    <td>
                      <div>
                        <strong>{item.estudiante_nombre}</strong>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Doc: {item.estudiante_documento || 'N/A'}</div>
                      </div>
                    </td>
                    <td>{item.grado}</td>
                    <td>
                      <div className={styles.acudienteBox}>
                        <span className={styles.acudienteName}>{item.acudiente_nombre}</span>
                        <div className={styles.acudienteSub}>
                          <span>Doc: {item.acudiente_documento}</span>
                          {item.acudiente_celular && item.acudiente_celular !== 'N/A' && (
                            <a 
                              href={`https://wa.me/57${item.acudiente_celular.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className={styles.whatsappLink}
                              title="Enviar mensaje por WhatsApp"
                            >
                              📱 {item.acudiente_celular}
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ 
                        fontSize: '0.82rem', 
                        fontWeight: 600, 
                        color: '#1e293b', 
                        backgroundColor: '#f1f5f9', 
                        padding: '4px 8px', 
                        borderRadius: '6px', 
                        display: 'inline-block' 
                      }}>
                        📅 {mesNombre} {anioFiltro}
                      </span>
                    </td>
                    <td>{formatMoney(item.monto_total)}</td>
                    <td style={{ color: '#16a34a', fontWeight: 600 }}>{formatMoney(item.monto_pagado)}</td>
                    <td className={styles.amount} style={{ color: item.deuda > 0 ? '#dc2626' : '#16a34a' }}>
                      {formatMoney(item.deuda)}
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${
                        item.estado === 'Al día' 
                          ? styles.statusAldia 
                          : item.estado === 'Debe' 
                          ? styles.statusDebe 
                          : item.estado === 'En mora'
                          ? styles.statusEnmora
                          : styles.statusSinfactura
                      }`}>
                        {item.estado === 'Al día' ? '✅ Al día' : item.estado === 'Debe' ? '⏳ Debe' : item.estado === 'En mora' ? '🔴 En mora' : '⚪ Sin Factura'}
                      </span>
                    </td>
                    <td>
                      {item.estado === 'Al día' ? (
                        <button 
                          className={styles.payBtn}
                          style={{
                            backgroundColor: '#4f46e5',
                            color: '#ffffff',
                            fontWeight: 600,
                            fontSize: '0.82rem',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }}
                          onClick={() => handleVerRecibo(item)}
                          title={`Abrir Recibo de Caja de ${item.estudiante_nombre}`}
                        >
                          🧾 Ver Recibo
                        </button>
                      ) : (
                        <button 
                          className={styles.payBtn}
                          style={{
                            backgroundColor: '#16a34a',
                            color: '#ffffff',
                            fontWeight: 600,
                            fontSize: '0.82rem',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }}
                          onClick={() => onRegistrarPago(item)}
                          title={`Ir a Caja a registrar pago para ${item.estudiante_nombre}`}
                        >
                          💵 Registrar Pago
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
