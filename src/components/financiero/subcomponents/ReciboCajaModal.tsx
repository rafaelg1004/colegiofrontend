import React from 'react';

interface ReciboCajaModalProps {
  datos: {
    factura_id?: string;
    numero_factura?: string;
    estudiante_nombre?: string;
    estudiante_documento?: string;
    grado?: string;
    acudiente_nombre?: string;
    acudiente_documento?: string;
    acudiente_celular?: string;
    acudiente_correo?: string;
    concepto?: string;
    monto_pagado?: number;
    monto_total?: number;
    fecha_pago?: string;
    fecha_emision?: string;
    mesNombre?: string;
    anio?: number;
  } | null;
  formatMoney: (val: number) => string;
  onClose: () => void;
}

export const ReciboCajaModal: React.FC<ReciboCajaModalProps> = ({
  datos,
  formatMoney,
  onClose,
}) => {
  if (!datos) return null;

  const handlePrint = () => {
    window.print();
  };

  const numeroRecibo = datos.numero_factura && datos.numero_factura !== 'N/A'
    ? datos.numero_factura.replace('FAC-', 'REC-')
    : `REC-${(datos.estudiante_nombre || '').substring(0, 3).toUpperCase()}-2026`;

  const fechaFormat = datos.fecha_pago
    ? new Date(datos.fecha_pago).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
    : datos.fecha_emision
    ? new Date(datos.fecha_emision).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });

  const montoFinal = Number(datos.monto_pagado || datos.monto_total || 0);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1300,
      padding: '1rem',
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '24px',
        maxWidth: '750px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid #e2e8f0',
        padding: '2rem',
      }}>
        {/* Acciones superiores */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#16a34a', backgroundColor: '#dcfce7', padding: '4px 12px', borderRadius: '20px' }}>
            ✅ PAGO CONFIRMADO EN CAJA
          </span>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={handlePrint}
              style={{
                backgroundColor: '#4f46e5',
                color: '#ffffff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '10px',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.88rem',
              }}
            >
              🖨️ Imprimir / Guardar PDF
            </button>
            <button
              onClick={onClose}
              style={{
                backgroundColor: '#f1f5f9',
                color: '#475569',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '10px',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.88rem',
              }}
            >
              ✕ Cerrar
            </button>
          </div>
        </div>

        {/* Encabezado del Recibo de Caja */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #e2e8f0', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.4rem', color: '#1e293b', fontWeight: 800 }}>INSTITUCIÓN EDUCATIVA</h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>Sede Principal | NIT: 800.123.456-7</p>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>Resolución Aprobación N° 1234 de Secretaría de Educación</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.5px' }}>COMPROBANTE DE RECIBO DE CAJA</h2>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>#{numeroRecibo}</div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Fecha de Pago: <strong>{fechaFormat}</strong></p>
          </div>
        </div>

        {/* Datos Principales: Estudiante y Acudiente */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '14px', border: '1px solid #f1f5f9' }}>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
              👤 Estudiante Beneficiario
            </label>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', display: 'block' }}>{datos.estudiante_nombre}</span>
            <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Doc: {datos.estudiante_documento || 'N/A'} | Grado: {datos.grado || 'N/A'}</span>
          </div>

          <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '14px', border: '1px solid #f1f5f9' }}>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
              👨‍👩‍👧 Padre / Acudiente Pagador
            </label>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', display: 'block' }}>{datos.acudiente_nombre || 'N/A'}</span>
            <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Doc: {datos.acudiente_documento || 'N/A'} | Tel: {datos.acudiente_celular || 'N/A'}</span>
          </div>
        </div>

        {/* Tabla de Detalle del Pago */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
              <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: '0.8rem', color: '#475569', textTransform: 'uppercase' }}>Descripción del Concepto</th>
              <th style={{ textAlign: 'center', padding: '10px 14px', fontSize: '0.8rem', color: '#475569', textTransform: 'uppercase' }}>Cant</th>
              <th style={{ textAlign: 'right', padding: '10px 14px', fontSize: '0.8rem', color: '#475569', textTransform: 'uppercase' }}>Monto Recibido</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', fontSize: '0.92rem', fontWeight: 600, color: '#1e293b' }}>
                {datos.concepto || `Pensión ${datos.mesNombre || ''} ${datos.anio || ''}`}
              </td>
              <td style={{ textAlign: 'center', padding: '12px 14px', borderBottom: '1px solid #f1f5f9', fontSize: '0.92rem' }}>1</td>
              <td style={{ textAlign: 'right', padding: '12px 14px', borderBottom: '1px solid #f1f5f9', fontSize: '0.92rem', fontWeight: 700, color: '#16a34a' }}>
                {formatMoney(montoFinal)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Total Recibido */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
          <div style={{ backgroundColor: '#1e293b', color: '#ffffff', padding: '1.25rem 2.5rem', borderRadius: '16px', textAlign: 'right' }}>
            <span style={{ display: 'block', fontSize: '0.8rem', opacity: 0.8, textTransform: 'uppercase', fontWeight: 700 }}>TOTAL RECIBIDO</span>
            <span style={{ fontSize: '1.8rem', fontWeight: 800 }}>{formatMoney(montoFinal)}</span>
          </div>
        </div>

        {/* Firmas */}
        <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'space-around' }}>
          <div style={{ borderTop: '1px solid #cbd5e1', width: '220px', textAlign: 'center', paddingTop: '8px', fontSize: '0.82rem', color: '#64748b' }}>
            Firma Tesorería / Caja
          </div>
          <div style={{ borderTop: '1px solid #cbd5e1', width: '220px', textAlign: 'center', paddingTop: '8px', fontSize: '0.82rem', color: '#64748b' }}>
            Firma Acudiente / Pagador
          </div>
        </div>
      </div>
    </div>
  );
};
