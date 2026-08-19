import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getAuthToken, API_URL } from '@/utils/auth';

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const cargar = async () => {
      try {
        const token = getAuthToken() || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
        const res = await fetch(`${API_URL}/configuracion/institucion`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const json = await res.json();
          const inst = Array.isArray(json) ? json[0] : (json?.data || json);
          if (inst && typeof inst === 'object') {
            setInstitucion(inst);
          }
        }
      } catch (e) {
        /* silencioso */
      }
    };
    if (datos) cargar();
  }, [datos]);

  if (!mounted || !datos) return null;

  // Formatear fecha exactamente como en Caja
  const rawFecha = datos.fecha_pago || datos.fecha_emision || '';
  let fechaStr = '';
  if (rawFecha) {
    const cleanDateStr = String(rawFecha).split('T')[0];
    const parts = cleanDateStr.split('-');
    if (parts.length === 3) {
      const localDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      fechaStr = localDate.toLocaleDateString("es-CO", {
        year: 'numeric', month: 'long', day: 'numeric'
      });
    } else {
      fechaStr = new Date(rawFecha).toLocaleDateString("es-CO", {
        year: 'numeric', month: 'long', day: 'numeric'
      });
    }
  } else {
    fechaStr = new Date().toLocaleDateString("es-CO", {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  const handlePrint = () => {
    window.print();
  };

  const numeroRecibo = datos.numero_factura && datos.numero_factura !== 'N/A'
    ? datos.numero_factura
    : `REC-${(datos.estudiante_nombre || '').substring(0, 3).toUpperCase()}-${datos.anio || new Date().getFullYear()}`;

  const montoFinal = Number(datos.monto_pagado || datos.monto_total || 0);
  const conceptoGeneralText = (datos.numero_factura && datos.numero_factura !== 'N/A')
    ? `Factura ${datos.numero_factura}`
    : (datos.concepto || `Pensión ${datos.mesNombre || ''} ${datos.anio || ''}`);

  const descripcionTablaText = datos.concepto || `Pensión ${datos.mesNombre || ''} ${datos.anio || ''}`;

  const modalJSX = (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');

        .recibo-overlay-bg {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999999;
          padding: 20px;
        }

        .recibo-modal-card {
          background: white;
          width: 100%;
          max-width: 850px;
          max-height: 95vh;
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          overflow: hidden;
        }

        .recibo-top-actions {
          padding: 14px 20px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .recibo-btn-imprimir {
          background: #4f46e5;
          color: white;
          border: none;
          padding: 10px 22px;
          border-radius: 10px;
          font-weight: 700;
          cursor: pointer;
          font-size: 0.88rem;
          transition: all 0.2s;
          box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
        }
        .recibo-btn-imprimir:hover {
          background: #4338ca;
        }

        .recibo-btn-cerrar {
          background: white;
          color: #64748b;
          border: 1px solid #e2e8f0;
          padding: 10px 22px;
          border-radius: 10px;
          font-weight: 700;
          cursor: pointer;
          font-size: 0.88rem;
        }

        .old-template { 
          font-family: 'Inter', sans-serif; 
          max-width: 800px; 
          margin: 0 auto; 
          border: 2px solid #e2e8f0; 
          padding: 24px; 
          border-radius: 16px;
          color: #1e293b;
          line-height: 1.4;
          font-size: 0.82rem;
        }
        .old-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; margin-bottom: 16px; }
        .old-empresa h1 { margin: 0; font-size: 1.1rem; color: #4f46e5; font-weight: 800; }
        .old-empresa p { margin: 2px 0; color: #64748b; font-size: 0.78rem; }
        .old-info { text-align: right; }
        .old-info h2 { margin: 0; font-size: 0.88rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
        .old-numero { font-size: 1.3rem; font-weight: 800; color: #4f46e5; margin: 2px 0; }
        .old-datos { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
        .old-dato { background: #f8fafc; padding: 10px 12px; border-radius: 10px; border: 1px solid #f1f5f9; }
        .old-dato label { display: block; font-size: 0.65rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 3px; }
        .old-dato span { font-weight: 600; color: #1e293b; font-size: 0.82rem; }
        .old-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        .old-table th { text-align: left; background: #f8fafc; padding: 8px 10px; font-size: 0.72rem; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e2e8f0; }
        .old-table td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; font-size: 0.82rem; color: #334155; }
        .old-total-box { display: flex; justify-content: flex-end; }
        .old-total-inner { background: #1e293b; color: white; padding: 10px 20px; border-radius: 10px; text-align: right; }
        .old-total-label { display: block; font-size: 0.7rem; font-weight: 600; opacity: 0.8; text-transform: uppercase; }
        .old-total-value { font-size: 1.15rem; font-weight: 800; }
        .old-footer { margin-top: 30px; display: flex; justify-content: space-around; }
        .old-firma { border-top: 1px solid #cbd5e1; width: 180px; text-align: center; padding-top: 6px; font-size: 0.75rem; color: #64748b; }

        @media print {
          @page {
            size: letter portrait;
            margin: 0;
          }
          
          html, body {
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            background: #ffffff !important;
          }

          body > *:not(.recibo-overlay-bg) {
            display: none !important;
            height: 0 !important;
            overflow: hidden !important;
          }

          .recibo-overlay-bg {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
            z-index: 999999 !important;
            overflow: hidden !important;
            backdrop-filter: none !important;
          }

          .recibo-modal-card {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            max-height: 100% !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .recibo-top-actions {
            display: none !important;
          }

          #finanzas-printable-receipt {
            padding: 20px !important;
            overflow: visible !important;
            width: 100% !important;
            height: auto !important;
          }

          .old-template {
            border: none !important;
            padding: 0 !important;
            margin: 0 auto !important;
            max-width: 100% !important;
            page-break-inside: avoid !important;
            page-break-before: avoid !important;
            page-break-after: avoid !important;
          }
        }
      `}} />

      <div className="recibo-overlay-bg">
        <div className="recibo-modal-card">
          <div className="recibo-top-actions">
            <button onClick={handlePrint} className="recibo-btn-imprimir">🖨️ Imprimir / Guardar PDF</button>
            <button onClick={onClose} className="recibo-btn-cerrar">Cerrar Visor</button>
          </div>

          <div id="finanzas-printable-receipt" style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
            <div className="old-template">
              <div className="old-header">
                <div className="old-empresa">
                  <h1>{institucion?.nombre || 'Institución Educativa'}</h1>
                  {institucion?.nombre && <p style={{ fontWeight: 700, color: '#4f46e5' }}>Sede: {institucion.nombre}</p>}
                  {institucion?.resolucion_aprobacion && <p>{institucion.resolucion_aprobacion}</p>}
                  {institucion?.nit && <p>NIT: {institucion.nit}</p>}
                  {institucion?.direccion && <p>{institucion.direccion}{institucion.ciudad ? ' - ' + institucion.ciudad : ''}</p>}
                </div>
                <div className="old-info">
                  <h2>COMPROBANTE DE INGRESO</h2>
                  <div className="old-numero">#{numeroRecibo}</div>
                  <p>Fecha: {fechaStr}</p>
                </div>
              </div>

              <div className="old-datos">
                <div className="old-dato">
                  <label>Recibido de / Pagado a</label>
                  <span>{datos.estudiante_nombre}</span>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                    Doc: {datos.estudiante_documento || 'N/A'} | Grado: {datos.grado || 'N/A'}
                  </div>
                  {datos.acudiente_nombre && (
                    <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '3px', fontWeight: 600 }}>
                      Acudiente: {datos.acudiente_nombre} (Tel: {datos.acudiente_celular || 'N/A'})
                    </div>
                  )}
                </div>
                <div className="old-dato">
                  <label>Concepto General</label>
                  <span>{conceptoGeneralText}</span>
                </div>
              </div>

              <table className="old-table">
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
                    <td>{descripcionTablaText}</td>
                    <td>1</td>
                    <td>{formatMoney(montoFinal)}</td>
                    <td>{formatMoney(montoFinal)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="old-total-box">
                <div className="old-total-inner">
                  <span className="old-total-label">TOTAL RECIBIDO</span>
                  <span className="old-total-value">{formatMoney(montoFinal)}</span>
                </div>
              </div>

              <div className="old-footer">
                <div className="old-firma">Firma Autorizada</div>
                <div className="old-firma">Firma del Interesado</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalJSX, document.body);
};
