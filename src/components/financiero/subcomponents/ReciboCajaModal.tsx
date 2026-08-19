import React, { useEffect, useState } from 'react';

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
  const [institucion, setInstitucion] = useState<any>(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.colegio.binaria.online/api/v1';
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const res = await fetch(`${API}/configuracion/institucion`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) setInstitucion(await res.json());
      } catch (e) {
        /* silencioso */
      }
    };
    if (datos) cargar();
  }, [datos]);

  if (!datos) return null;

  const numeroRecibo = datos.numero_factura && datos.numero_factura !== 'N/A'
    ? datos.numero_factura.replace('FAC-', 'REC-')
    : `REC-${(datos.estudiante_nombre || '').substring(0, 3).toUpperCase()}-${datos.anio || new Date().getFullYear()}`;

  let fechaStr = '';
  const rawDate = datos.fecha_pago || datos.fecha_emision;
  if (rawDate) {
    const cleanDateStr = String(rawDate).split('T')[0];
    const parts = cleanDateStr.split('-');
    if (parts.length === 3) {
      const localDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      fechaStr = localDate.toLocaleDateString("es-CO", { year: 'numeric', month: 'long', day: 'numeric' });
    } else {
      fechaStr = new Date(rawDate).toLocaleDateString("es-CO", { year: 'numeric', month: 'long', day: 'numeric' });
    }
  } else {
    fechaStr = new Date().toLocaleDateString("es-CO", { year: 'numeric', month: 'long', day: 'numeric' });
  }

  const montoFinal = Number(datos.monto_pagado || datos.monto_total || 0);
  const conceptoTexto = datos.concepto || `Pensión ${datos.mesNombre || ''} ${datos.anio || ''}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="finanzas-receipt-overlay no-print-overlay">
      <div className="finanzas-receipt-container">
        {/* Botones de acción - NO se imprimen */}
        <div className="finanzas-receipt-actions no-print">
          <button onClick={handlePrint} className="finanzas-btn-print">🖨️ Imprimir / Guardar PDF</button>
          <button onClick={onClose} className="finanzas-btn-close-receipt">Cerrar Visor</button>
        </div>

        {/* Área imprimible - usa la MISMA plantilla que Caja */}
        <div className="finanzas-printable-area" id="finanzas-printable-receipt">
          <style dangerouslySetInnerHTML={{ __html: `
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');

            .finanzas-receipt-overlay {
              position: fixed;
              top: 0; left: 0; right: 0; bottom: 0;
              background: rgba(15, 23, 42, 0.85);
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 1300;
              padding: 1rem;
              backdrop-filter: blur(6px);
            }
            .finanzas-receipt-container {
              background: #f1f5f9;
              border-radius: 20px;
              max-width: 860px;
              width: 100%;
              max-height: 95vh;
              overflow-y: auto;
              padding: 1.5rem;
            }
            .finanzas-receipt-actions {
              display: flex;
              gap: 0.75rem;
              margin-bottom: 1rem;
            }
            .finanzas-btn-print {
              background: #4f46e5;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 12px;
              font-weight: 700;
              cursor: pointer;
              font-size: 0.92rem;
              transition: background 0.2s;
            }
            .finanzas-btn-print:hover { background: #4338ca; }
            .finanzas-btn-close-receipt {
              background: #e2e8f0;
              color: #475569;
              border: none;
              padding: 10px 20px;
              border-radius: 12px;
              font-weight: 700;
              cursor: pointer;
              font-size: 0.92rem;
              transition: background 0.2s;
            }
            .finanzas-btn-close-receipt:hover { background: #cbd5e1; }

            .finanzas-printable-area {
              background: white;
              border-radius: 16px;
              overflow: hidden;
            }

            .rc-template { 
              font-family: 'Inter', sans-serif; 
              max-width: 800px; 
              margin: 0 auto; 
              border: 2px solid #e2e8f0; 
              padding: 40px; 
              border-radius: 20px;
              color: #1e293b;
              line-height: 1.5;
            }
            .rc-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 30px; }
            .rc-empresa h1 { margin: 0; font-size: 1.5rem; color: #4f46e5; }
            .rc-empresa p { margin: 5px 0; color: #64748b; font-size: 0.9rem; }
            .rc-info { text-align: right; }
            .rc-info h2 { margin: 0; font-size: 1.2rem; color: #1e293b; }
            .rc-numero { font-size: 2rem; font-weight: 800; color: #4f46e5; margin: 5px 0; }
            .rc-datos { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .rc-dato { background: #f8fafc; padding: 15px; border-radius: 12px; }
            .rc-dato label { display: block; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 5px; }
            .rc-dato span { font-weight: 600; color: #1e293b; }
            .rc-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .rc-table th { text-align: left; background: #f1f5f9; padding: 12px; font-size: 0.85rem; text-transform: uppercase; color: #475569; }
            .rc-table td { padding: 12px; border-bottom: 1px solid #f1f5f9; }
            .rc-total-box { display: flex; justify-content: flex-end; }
            .rc-total-inner { background: #4f46e5; color: white; padding: 20px 40px; border-radius: 16px; text-align: right; }
            .rc-total-label { display: block; font-size: 0.9rem; font-weight: 600; opacity: 0.8; }
            .rc-total-value { font-size: 2rem; font-weight: 800; }
            .rc-footer { margin-top: 50px; display: flex; justify-content: space-between; }
            .rc-firma { border-top: 1px solid #cbd5e1; width: 250px; text-align: center; padding-top: 10px; font-size: 0.9rem; color: #64748b; }

            @media (max-width: 640px) {
              .rc-template { padding: 15px; border-radius: 10px; }
              .rc-header { flex-direction: column; gap: 15px; align-items: flex-start; }
              .rc-info { text-align: left; }
              .rc-datos { grid-template-columns: 1fr; gap: 10px; }
              .rc-total-inner { width: 100%; padding: 15px; }
              .rc-footer { flex-direction: column; gap: 40px; align-items: center; }
              .rc-firma { width: 100%; max-width: 250px; }
            }

            @media print {
              body * { visibility: hidden !important; }
              .finanzas-printable-area,
              .finanzas-printable-area * {
                visibility: visible !important;
              }
              .finanzas-printable-area {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
              }
              .no-print, .no-print * { display: none !important; }
              .rc-template { border: none; padding: 20px 0; }
              .finanzas-receipt-overlay { background: none !important; position: static !important; }
              .finanzas-receipt-container { background: none !important; padding: 0 !important; }
            }
          `}} />

          <div className="rc-template">
            <div className="rc-header">
              <div className="rc-empresa">
                <h1>{institucion?.nombre || 'Institución Educativa'}</h1>
                {institucion?.nit && <p>NIT: {institucion.nit}</p>}
                {institucion?.resolucion_aprobacion && <p>{institucion.resolucion_aprobacion}</p>}
                {institucion?.direccion && <p>{institucion.direccion}{institucion.ciudad ? ` - ${institucion.ciudad}` : ''}</p>}
              </div>
              <div className="rc-info">
                <h2>COMPROBANTE DE RECIBO DE CAJA</h2>
                <div className="rc-numero">#{numeroRecibo}</div>
                <p>Fecha: {fechaStr}</p>
              </div>
            </div>

            <div className="rc-datos">
              <div className="rc-dato">
                <label>Estudiante Beneficiario</label>
                <span>{datos.estudiante_nombre}</span>
                <br />
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Doc: {datos.estudiante_documento || 'N/A'} | Grado: {datos.grado || 'N/A'}
                </span>
              </div>
              <div className="rc-dato">
                <label>Padre / Acudiente</label>
                <span>{datos.acudiente_nombre || 'N/A'}</span>
                <br />
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Doc: {datos.acudiente_documento || 'N/A'} | Tel: {datos.acudiente_celular || 'N/A'}
                </span>
              </div>
            </div>

            <table className="rc-table">
              <thead>
                <tr>
                  <th>Descripción</th>
                  <th>Cant</th>
                  <th>V. Unitario</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{conceptoTexto}</td>
                  <td>1</td>
                  <td>{formatMoney(montoFinal)}</td>
                  <td>{formatMoney(montoFinal)}</td>
                </tr>
              </tbody>
            </table>

            <div className="rc-total-box">
              <div className="rc-total-inner">
                <span className="rc-total-label">TOTAL RECIBIDO</span>
                <span className="rc-total-value">{formatMoney(montoFinal)}</span>
              </div>
            </div>

            <div className="rc-footer">
              <div className="rc-firma">Firma Autorizada</div>
              <div className="rc-firma">Firma del Interesado</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
