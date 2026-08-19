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
      } catch (e) { /* silencioso */ }
    };
    if (datos) cargar();
  }, [datos]);

  if (!datos) return null;

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
  }

  const handlePrint = () => {
    window.print();
  };

  const numeroRecibo = datos.numero_factura && datos.numero_factura !== 'N/A'
    ? datos.numero_factura
    : `REC-${(datos.estudiante_nombre || '').substring(0, 3).toUpperCase()}-${datos.anio || new Date().getFullYear()}`;

  const montoFinal = Number(datos.monto_pagado || datos.monto_total || 0);
  const conceptoTexto = datos.concepto || `Pensión ${datos.mesNombre || ''} ${datos.anio || ''}`;

  return (
    <>
      {/* Estilos embebidos IDÉNTICOS a los de Caja ReceiptPreview */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
        .old-template { 
          font-family: 'Inter', sans-serif; 
          max-width: 800px; 
          margin: 0 auto; 
          border: 2px solid #e2e8f0; 
          padding: 30px; 
          border-radius: 16px;
          color: #1e293b;
          line-height: 1.4;
          font-size: 0.85rem;
        }
        .old-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f1f5f9; padding-bottom: 15px; margin-bottom: 20px; }
        .old-empresa h1 { margin: 0; font-size: 1.1rem; color: #4f46e5; }
        .old-empresa p { margin: 3px 0; color: #64748b; font-size: 0.78rem; }
        .old-info { text-align: right; }
        .old-info h2 { margin: 0; font-size: 0.9rem; color: #1e293b; }
        .old-numero { font-size: 1.3rem; font-weight: 800; color: #4f46e5; margin: 3px 0; }
        .old-datos { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 15px; }
        .old-dato { background: #f8fafc; padding: 10px 12px; border-radius: 10px; }
        .old-dato label { display: block; font-size: 0.65rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 3px; }
        .old-dato span { font-weight: 600; color: #1e293b; font-size: 0.82rem; }
        .old-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .old-table th { text-align: left; background: #f1f5f9; padding: 8px 10px; font-size: 0.72rem; text-transform: uppercase; color: #475569; }
        .old-table td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; font-size: 0.82rem; }
        .old-total-box { display: flex; justify-content: flex-end; }
        .old-total-inner { background: #4f46e5; color: white; padding: 12px 24px; border-radius: 12px; text-align: right; }
        .old-total-label { display: block; font-size: 0.72rem; font-weight: 600; opacity: 0.8; }
        .old-total-value { font-size: 1.2rem; font-weight: 800; }
        .old-footer { margin-top: 35px; display: flex; justify-content: space-between; }
        .old-firma { border-top: 1px solid #cbd5e1; width: 200px; text-align: center; padding-top: 8px; font-size: 0.78rem; color: #64748b; }
        @media (max-width: 640px) {
          .old-template { padding: 15px; border-radius: 10px; }
          .old-header { flex-direction: column; gap: 15px; align-items: flex-start; }
          .old-info { text-align: left; }
          .old-datos { grid-template-columns: 1fr; gap: 10px; }
          .old-total-inner { width: 100%; padding: 15px; }
          .old-footer { flex-direction: column; gap: 40px; align-items: center; }
          .old-firma { width: 100%; max-width: 250px; }
        }
        @media print {
          body * { visibility: hidden !important; }
          #finanzas-printable-receipt, #finanzas-printable-receipt * { visibility: visible !important; }
          #finanzas-printable-receipt { position: absolute; left: 0; top: 0; width: 100%; }
          .finanzas-no-print { display: none !important; }
          .old-template { border: none; padding: 20px 0; }
        }
      `}} />

      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
      }}>
        <div style={{
          background: 'white',
          width: '100%',
          maxWidth: '900px',
          maxHeight: '95vh',
          borderRadius: '24px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
        }}>
          {/* Botones - IDÉNTICOS a Caja */}
          <div className="finanzas-no-print" style={{
            padding: '20px',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '15px',
          }}>
            <button onClick={handlePrint} style={{
              background: '#4f46e5', color: 'white', border: 'none',
              padding: '12px 28px', borderRadius: '12px', fontWeight: 700,
              cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)',
            }}>🖨️ Imprimir / Guardar PDF</button>
            <button onClick={onClose} style={{
              background: 'white', color: '#64748b', border: '1px solid #e2e8f0',
              padding: '12px 28px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer',
            }}>Cerrar Visor</button>
          </div>

          {/* Área imprimible - MISMA estructura que Caja */}
          <div id="finanzas-printable-receipt" style={{ padding: '30px', overflowY: 'auto', flex: 1 }}>
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
                  <br />
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 400 }}>
                    Doc: {datos.estudiante_documento || 'N/A'} | Grado: {datos.grado || 'N/A'}
                  </span>
                </div>
                <div className="old-dato">
                  <label>Padre / Acudiente</label>
                  <span>{datos.acudiente_nombre || 'N/A'}</span>
                  <br />
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 400 }}>
                    Doc: {datos.acudiente_documento || 'N/A'} | Tel: {datos.acudiente_celular || 'N/A'}
                  </span>
                </div>
              </div>

              <div className="old-dato" style={{ marginBottom: '30px', marginTop: '-15px' }}>
                <label>Concepto General</label>
                <span>{conceptoTexto}</span>
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
                    <td>{conceptoTexto}</td>
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
};
