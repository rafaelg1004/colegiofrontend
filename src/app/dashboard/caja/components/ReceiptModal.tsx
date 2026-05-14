import React from 'react';
import styles from '../CajaModerna.module.css';

interface Props {
  comprobanteReciente: any;
  formatMoney: (val: number) => string;
  onPrint: (datos: any) => void;
  onClose: () => void;
}

const ReceiptModal: React.FC<Props> = ({
  comprobanteReciente,
  formatMoney,
  onPrint,
  onClose
}) => {
  if (!comprobanteReciente) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.comprobanteTitle}>
          <h2>¡Registro Exitoso!</h2>
          <p>Comprobante generado correctamente</p>
        </div>
        
        <div className={styles.comprobanteMonto}>
          <label>TOTAL</label>
          <span>{formatMoney(comprobanteReciente.monto)}</span>
        </div>

        <div className={styles.comprobanteDato}>
          <label>Referencia:</label>
          <span>{comprobanteReciente.numero_comprobante}</span>
        </div>
        <div className={styles.comprobanteDato}>
          <label>Beneficiario:</label>
          <span>{comprobanteReciente.estudiante_nombre}</span>
        </div>
        <div className={styles.comprobanteDato}>
          <label>Concepto:</label>
          <span>{comprobanteReciente.concepto}</span>
        </div>
        
        {comprobanteReciente.partida_doble && (
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '16px' }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '0.5rem' }}>REGISTRO CONTABLE (Partida Doble)</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span>Débito: {comprobanteReciente.partida_doble.debe?.[0]?.cuenta}</span>
              <span>{formatMoney(comprobanteReciente.partida_doble.debe?.[0]?.valor)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              <span>Crédito: {comprobanteReciente.partida_doble.haber?.[0]?.cuenta}</span>
              <span>{formatMoney(comprobanteReciente.partida_doble.haber?.[0]?.valor)}</span>
            </div>
          </div>
        )}

        <div className={styles.modalActions} style={{ marginTop: '2rem' }}>
          <button className={styles.btnModalPrimary} onClick={() => onPrint(comprobanteReciente)}>🖨️ Imprimir Recibo</button>
          <button className={styles.btnModalSecondary} onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;
