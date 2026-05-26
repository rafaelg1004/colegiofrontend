import React from 'react';
import styles from '../CajaModerna.module.css';

interface Props {
  datos: any;
  institucion: any;
  sedeActual: any;
  formatMoney: (val: number) => string;
  onClose: () => void;
}

const ReceiptPreview: React.FC<Props> = ({
  datos,
  institucion,
  sedeActual,
  formatMoney,
  onClose
}) => {
  if (!datos) return null;

  let fechaStr = datos.fecha || '';
  if (datos.fecha) {
    const cleanDateStr = datos.fecha.split('T')[0];
    const parts = cleanDateStr.split('-');
    if (parts.length === 3) {
      const localDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      fechaStr = localDate.toLocaleDateString("es-CO", {
        year: 'numeric', month: 'long', day: 'numeric'
      });
    } else {
      fechaStr = new Date(datos.fecha).toLocaleDateString("es-CO", {
        year: 'numeric', month: 'long', day: 'numeric'
      });
    }
  }

  const handlePrint = () => {
    window.print();
  };

  let detalles = datos.conceptos_detalle;
  if (typeof detalles === 'string') {
    try { detalles = JSON.parse(detalles); } catch (e) { detalles = null; }
  }

  return (
    <div className={`${styles.previewOverlay} no-print`}>
      <div className={styles.previewContainer}>
        <div className={`${styles.previewActions} no-print`}>
          <button onClick={handlePrint} className={styles.btnPrint}>🖨️ Imprimir / Guardar PDF</button>
          <button onClick={onClose} className={styles.btnClose}>Cerrar Visor</button>
        </div>
        
        <div className={styles.printableArea} id="printable-receipt">
          {/* Estilos embebidos para asegurar que el template sea IDÉNTICO al anterior */}
          <style dangerouslySetInnerHTML={{ __html: `
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
            .old-template { 
              font-family: 'Inter', sans-serif; 
              max-width: 800px; 
              margin: 0 auto; 
              border: 2px solid #e2e8f0; 
              padding: 40px; 
              border-radius: 20px;
              color: #1e293b;
              line-height: 1.5;
            }
            .old-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 30px; }
            .old-empresa h1 { margin: 0; font-size: 1.5rem; color: #4f46e5; }
            .old-empresa p { margin: 5px 0; color: #64748b; font-size: 0.9rem; }
            .old-info { text-align: right; }
            .old-info h2 { margin: 0; font-size: 1.2rem; color: #1e293b; }
            .old-numero { font-size: 2rem; font-weight: 800; color: #4f46e5; margin: 5px 0; }
            .old-datos { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .old-dato { background: #f8fafc; padding: 15px; border-radius: 12px; }
            .old-dato label { display: block; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 5px; }
            .old-dato span { font-weight: 600; color: #1e293b; }
            .old-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .old-table th { text-align: left; background: #f1f5f9; padding: 12px; font-size: 0.85rem; text-transform: uppercase; color: #475569; }
            .old-table td { padding: 12px; border-bottom: 1px solid #f1f5f9; }
            .old-total-box { display: flex; justify-content: flex-end; }
            .old-total-inner { background: #4f46e5; color: white; padding: 20px 40px; border-radius: 16px; text-align: right; }
            .old-total-label { display: block; font-size: 0.9rem; font-weight: 600; opacity: 0.8; }
            .old-total-value { font-size: 2rem; font-weight: 800; }
            .old-footer { margin-top: 50px; display: flex; justify-content: space-between; }
            .old-firma { border-top: 1px solid #cbd5e1; width: 250px; text-align: center; padding-top: 10px; font-size: 0.9rem; color: #64748b; }
            @media print {
              .old-template { border: none; padding: 0; }
            }
          `}} />

          <div className="old-template">
            <div className="old-header">
              <div className="old-empresa">
                <h1>{institucion?.nombre || sedeActual?.nombre || ''}</h1>
                <p style={{ fontWeight: 700, color: '#4f46e5' }}>Sede: {sedeActual?.nombre || ''}</p>
                <p>{sedeActual?.resolucion_aprobacion || institucion?.resolucion_aprobacion || ''}</p>
                <p>NIT: {institucion?.nit || sedeActual?.nit || ''}</p>
                <p>{sedeActual?.direccion || ''} {sedeActual?.ciudad ? '- ' + sedeActual?.ciudad : ''}</p>
              </div>
              <div className="old-info">
                <h2>COMPROBANTE DE {datos.tipo}</h2>
                <div className="old-numero">#{datos.numero_comprobante}</div>
                <p>Fecha: {fechaStr}</p>
              </div>
            </div>

            <div className="old-datos">
              <div className="old-dato">
                <label>Recibido de / Pagado a</label>
                <span>{datos.estudiante_nombre}</span>
              </div>
              <div className="old-dato">
                <label>Concepto General</label>
                <span>{datos.concepto}</span>
              </div>
            </div>

            {datos.observacion && (
              <div className="old-dato" style={{ marginBottom: '30px', marginTop: '-15px' }}>
                <label>Observaciones</label>
                <span>{datos.observacion}</span>
              </div>
            )}

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
                {detalles ? detalles.map((d: any, i: number) => (
                  <tr key={i}>
                    <td>{d.nombre || d.descripcion || 'Sin nombre'}</td>
                    <td>{d.cantidad}</td>
                    <td>{formatMoney(parseFloat(d.precio_unitario || d.valor_unitario || 0))}</td>
                    <td>{formatMoney(parseFloat(d.precio_unitario || d.valor_unitario || 0) * d.cantidad)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td>{datos.concepto}</td>
                    <td>1</td>
                    <td>{formatMoney(datos.monto)}</td>
                    <td>{formatMoney(datos.monto)}</td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="old-total-box">
              <div className="old-total-inner">
                <span className="old-total-label">TOTAL RECIBIDO</span>
                <span className="old-total-value">{formatMoney(datos.monto)}</span>
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
  );
};

export default ReceiptPreview;

