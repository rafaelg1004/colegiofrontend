import React from 'react';
import styles from '../CajaModerna.module.css';

interface Props {
  tipo: string;
  busquedaBeneficiario: string;
  articulosVenta: any[];
  monto: string;
  formatMoney: (val: number) => string;
  onCancel: () => void;
  onConfirm: () => void;
}

const ConfirmationModal: React.FC<Props> = ({ 
  tipo, 
  busquedaBeneficiario, 
  articulosVenta, 
  monto, 
  formatMoney, 
  onCancel, 
  onConfirm 
}) => {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal} style={{ maxWidth: '600px' }}>
        <div className={styles.comprobanteTitle}>
          <h2>Confirmar Transacción</h2>
          <p>Por favor verifique los datos antes de proceder</p>
        </div>

        <div className={styles.confirmBox}>
          <div className={styles.confirmRow}>
            <label>Tipo:</label>
            <span className={tipo === "INGRESO" ? styles.badgeIngreso : styles.badgeEgreso}>{tipo}</span>
          </div>
          <div className={styles.confirmRow}>
            <label>Beneficiario:</label>
            <strong>{busquedaBeneficiario || "No especificado"}</strong>
          </div>
        </div>

        <div className={styles.confirmItems}>
          <label>Items a Registrar:</label>
          {articulosVenta.map((a, i) => (
            <div key={i} className={styles.confirmItemRow}>
              <span>{a.cantidad} x {a.nombre}</span>
              <strong>{formatMoney(a.precio_unitario * a.cantidad)}</strong>
            </div>
          ))}
        </div>

        <div className={styles.comprobanteMonto} style={{ margin: '1rem 0' }}>
          <label>TOTAL A PAGAR</label>
          <span>{formatMoney(parseFloat(monto))}</span>
        </div>

        <div className={styles.modalActions}>
          <button className={styles.btnModalSecondary} onClick={onCancel}>Cancelar</button>
          <button className={styles.btnConfirmarFinal} onClick={onConfirm}>💳 Sí, Registrar Ahora</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
