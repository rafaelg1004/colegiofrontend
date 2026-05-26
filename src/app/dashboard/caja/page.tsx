"use client";

import React, { useState, useEffect } from "react";
import { useCajaLogic } from "@/hooks/caja/useCajaLogic";
import styles from "./CajaModerna.module.css";
import CajaSummary from "./components/CajaSummary";
import ConfirmationModal from "./components/ConfirmationModal";
import CajaHistory from "./components/CajaHistory";
import ReceiptModal from "./components/ReceiptModal";
import ReceiptPreview from "./components/ReceiptPreview";
import Link from "next/link";

export default function CajaPage() {
  const {
    activeTab, setActiveTab,
    loading, resumen,
    tipo, setTipo,
    monto, setMonto,
    observacion, setObservacion,
    fecha, setFecha,
    busquedaBeneficiario, setBusquedaBeneficiario,
    resultadosBusqueda, setResultadosBusqueda,
    beneficiarioSeleccionado, setBeneficiarioSeleccionado,
    busquedaConcepto, setBusquedaConcepto,
    resultadosConceptos, setResultadosConceptos,
    conceptosCobro,
    articulosInventario,
    mostrarSelectorArticulos, setMostrarSelectorArticulos,
    articulosVenta, setArticulosVenta,
    notification, setNotification,
    showConfirmModal, setShowConfirmModal,
    comprobanteReciente, setComprobanteReciente,
    mostrarComprobante, setMostrarComprobante,
    fechaDesde, setFechaDesde,
    fechaHasta, setFechaHasta,
    showToast,
    cargarResumen,
    institucion,
    sedes,
    sedeSeleccionada,
    setSedeSeleccionada,
    seleccionarBeneficiario,
    facturasPendientes,
    setFacturasPendientes,
    facturaIdSeleccionada,
    setFacturaIdSeleccionada,
    buscarBeneficiarios,
    buscarConceptos,
    seleccionarConcepto,
    fetchArticulos,
    handleAddArticulo,
    handleUpdateCantidad,
    updateArticulosYTotal,
    registrarTransaccion,
    showConceptDropdown, setShowConceptDropdown,
    showBeneficiarioDropdown, setShowBeneficiarioDropdown,
    conceptoSeleccionado, setConceptoSeleccionado
  } = useCajaLogic();

  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileStep, setMobileStep] = useState(1);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const formatMoney = (val: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(val);

  const imprimirRecibo = (datos: any) => {
    setPreviewData(datos);
    setShowPreview(true);
  };

  return (
    <div className={styles.container}>
      {notification && (
        <div className={`${styles.toast} ${styles['toast_' + notification.type]}`}>
          {notification.type === 'success' ? '✅' : notification.type === 'error' ? '❌' : 'ℹ️'} {notification.msg}
          <button onClick={() => setNotification(null)}>×</button>
        </div>
      )}
      <header className={styles.header}>
        <Link href="/dashboard" className={styles.backButton}>
          ← Volver al Dashboard
        </Link>
        <h1><span className={styles.headerIcon}>🏦</span> Gestión de Caja</h1>
        <p>Administración financiera y contabilidad en tiempo real</p>
      </header>

      <div className={styles.tabsContainer}>
        <button className={`${styles.tab} ${activeTab === 'registrar' ? styles.tabActivo : ''}`} onClick={() => setActiveTab('registrar')}>✨ Registrar Movimiento</button>
        <button className={`${styles.tab} ${activeTab === 'movimientos' ? styles.tabActivo : ''}`} onClick={() => setActiveTab('movimientos')}>📑 Historial</button>
      </div>

      {activeTab === "registrar" && (
        isMobile ? (
          <div className={styles.mobileWizard}>
            {/* Indicador de pasos */}
            <div className={styles.mobileStepsContainer}>
              <div className={`${styles.mobileStepIndicator} ${mobileStep >= 1 ? styles.mobileStepActive : ''}`}>
                <span className={styles.mobileStepNum}>1</span>
                <span className={styles.mobileStepLabel}>Datos</span>
              </div>
              <div className={styles.mobileStepLine} />
              <div className={`${styles.mobileStepIndicator} ${mobileStep >= 2 ? styles.mobileStepActive : ''}`}>
                <span className={styles.mobileStepNum}>2</span>
                <span className={styles.mobileStepLabel}>Artículos</span>
              </div>
              <div className={styles.mobileStepLine} />
              <div className={`${styles.mobileStepIndicator} ${mobileStep >= 3 ? styles.mobileStepActive : ''}`}>
                <span className={styles.mobileStepNum}>3</span>
                <span className={styles.mobileStepLabel}>Confirmar</span>
              </div>
            </div>

            {/* PASO 1: Datos Básicos */}
            {mobileStep === 1 && (
              <div className={styles.mobileStepContent}>
                <div className={styles.mobileFormGroup}>
                  <label>Tipo de Transacción</label>
                  <div className={styles.tipoButtons}>
                    <button className={tipo === "INGRESO" ? styles.activeTipo : ""} onClick={() => { setTipo("INGRESO"); setBeneficiarioSeleccionado(null); setBusquedaBeneficiario(""); }}>📥 Ingreso</button>
                    <button className={tipo === "EGRESO" ? styles.activeTipo : ""} onClick={() => { setTipo("EGRESO"); setBeneficiarioSeleccionado(null); setBusquedaBeneficiario(""); }}>📤 Egreso</button>
                  </div>
                </div>

                {sedes.length > 1 && (
                  <div className={styles.mobileFormGroup}>
                    <label>Sede / Punto de Venta</label>
                    <select 
                      value={sedeSeleccionada?.id} 
                      onChange={e => setSedeSeleccionada(sedes.find(s => s.id === e.target.value))}
                      className={styles.mobileSelect}
                    >
                      {sedes.map(s => (
                        <option key={s.id} value={s.id}>{s.nombre}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className={styles.mobileFormGroup}>
                  <label>Fecha de Registro</label>
                  <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className={styles.mobileInput} />
                </div>

                <div className={styles.mobileFormGroup}>
                  <label>🏷️ Concepto de Cobro</label>
                  {conceptoSeleccionado ? (
                    <div className={styles.selectedConceptCard}>
                      <div className={styles.selectedConceptInfo}>
                        <span className={styles.selectedConceptIcon}>🏷️</span>
                        <div>
                          <strong>{conceptoSeleccionado.nombre}</strong>
                          <p>{formatMoney(conceptoSeleccionado.valor || 0)}</p>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        className={styles.btnClearConcept}
                        onClick={() => {
                          setConceptoSeleccionado(null);
                          setBusquedaConcepto("");
                          setArticulosVenta([]);
                          setMonto("0");
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div style={{ position: 'relative' }}>
                      <input 
                        type="text" 
                        value={busquedaConcepto} 
                        onChange={e => { buscarConceptos(e.target.value); setShowConceptDropdown(true); }} 
                        onFocus={() => { buscarConceptos(""); setShowConceptDropdown(true); }}
                        onBlur={() => setTimeout(() => setShowConceptDropdown(false), 300)}
                        placeholder="Seleccionar concepto..." 
                        className={styles.mobileInput}
                      />
                      {showConceptDropdown && (resultadosConceptos.length > 0 ? (
                        <div className={styles.searchDropdown} style={{ zIndex: 9999 }}>
                          {resultadosConceptos.map(c => (
                            <div 
                              key={c.id} 
                              className={styles.searchItem} 
                              onMouseDown={(e) => {
                                e.preventDefault();
                                seleccionarConcepto(c);
                                setShowConceptDropdown(false);
                              }}
                            >
                              <strong>{c.nombre}</strong>
                            </div>
                          ))}
                        </div>
                      ) : busquedaConcepto.length > 0 && (
                        <div className={styles.searchDropdown} style={{ zIndex: 9999, padding: '15px', textAlign: 'center', color: '#64748b' }}>
                          No se encontraron conceptos compatibles.
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className={styles.mobileFormGroup}>
                  <label>{tipo === "INGRESO" ? "👤 Estudiante / Pagador" : "🏢 Beneficiario"}</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="text" 
                      value={busquedaBeneficiario} 
                      onChange={e => { buscarBeneficiarios(e.target.value); setShowBeneficiarioDropdown(true); }} 
                      onFocus={() => { buscarBeneficiarios(""); setShowBeneficiarioDropdown(true); }}
                      onBlur={() => setTimeout(() => setShowBeneficiarioDropdown(false), 200)}
                      placeholder={`Buscar...`} 
                      className={styles.mobileInput}
                    />
                    {showBeneficiarioDropdown && (resultadosBusqueda.length > 0 ? (
                      <div className={styles.searchDropdown} style={{ zIndex: 9999 }}>
                        {resultadosBusqueda.map(r => (
                          <div 
                            key={r.id} 
                            className={styles.searchItem} 
                            onMouseDown={(e) => {
                              e.preventDefault();
                              seleccionarBeneficiario(r);
                            }}
                          >
                            <strong>{r.primer_apellido} {r.primer_nombre}</strong> {r.cargo ? `(${r.cargo})` : ""}
                          </div>
                        ))}
                      </div>
                    ) : busquedaBeneficiario.length > 0 && (
                      <div className={styles.searchDropdown} style={{ zIndex: 9999, padding: '15px', textAlign: 'center', color: '#64748b' }}>
                        No se encontraron resultados.
                      </div>
                    ))}
                  </div>
                </div>

                {/* Alerta de Facturas Pendientes (Cartera) */}
                {tipo === "INGRESO" && facturasPendientes.length > 0 && (
                  <div className={styles.mobileAlertaCartera}>
                    <div className={styles.alertaHeader}>
                      <span className={styles.alertaIcon}>⚠️</span>
                      <div>
                        <strong>Atención: Estudiante con deudas pendientes</strong>
                        <p>Tiene {facturasPendientes.length} cobro(s) pendiente(s).</p>
                      </div>
                    </div>
                    <div className={styles.facturasPendientesList}>
                      {facturasPendientes.map(f => (
                        <div key={f.id} className={`${styles.facturaPendienteItem} ${facturaIdSeleccionada === f.id ? styles.facturaSelected : ''}`}>
                          <div className={styles.facturaInfo}>
                            <span className={styles.facturaNumero}>{f.numero_factura}</span>
                            <span className={styles.facturaDesc}>{f.observaciones || 'Pensión / Cobro'}</span>
                            <span className={styles.facturaMonto}>{formatMoney(f.total)}</span>
                          </div>
                          <button 
                            className={styles.btnPagarDeuda}
                            onClick={() => {
                              setFacturaIdSeleccionada(f.id);
                              const detalles = f.factura_detalle.map((d: any) => ({
                                ...d,
                                id: d.articulo_inventario_id || d.concepto_cobro_id || d.id,
                                nombre: d.descripcion,
                                precio_unitario: d.valor_unitario,
                                cantidad: d.cantidad,
                                es_concepto: d.concepto_cobro_id ? true : false,
                                aplica_iva: d.valor_iva > 0,
                                porcentaje_iva: d.valor_iva > 0 ? (d.valor_iva / d.valor_unitario) * 100 : 0
                              }));
                              setArticulosVenta(detalles);
                              setMonto(f.total.toString());
                              setObservacion(`Pago de factura ${f.numero_factura}`);
                              showToast("Factura cargada al carrito", "info");
                            }}
                          >
                            {facturaIdSeleccionada === f.id ? 'Seleccionada' : 'Cobrar esta factura'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button 
                  type="button" 
                  className={styles.btnWizardNext} 
                  onClick={() => {
                    if (!conceptoSeleccionado) return showToast("Por favor, seleccione un concepto de cobro", "error");
                    setMobileStep(2);
                  }}
                >
                  Siguiente: Seleccionar Artículos ➡️
                </button>
              </div>
            )}

            {/* PASO 2: Selección de Artículos */}
            {mobileStep === 2 && (
              <div className={styles.mobileStepContent}>
                <div className={styles.mobileInventoryBlock}>
                  <div className={styles.inventarioHeader}>
                    <h3>📦 Catálogo de Artículos</h3>
                  </div>
                  
                  <div className={styles.articulosGridMobile}>
                    {articulosInventario.length > 0 ? (
                      articulosInventario.map(art => (
                        <div key={art.id} className={styles.articuloCardMobile} onClick={() => { handleAddArticulo(art); showToast(`${art.nombre} agregado`, "success"); }}>
                          <div className={styles.articuloHeaderMobile}>
                            <span className={styles.articuloNombreMobile}>{art.nombre}</span>
                            {art.es_servicio ? (
                              <span className={styles.badgeServicio}>SERVICIO</span>
                            ) : (
                              <span className={styles.articuloStock}>Stock: {art.cantidad_stock}</span>
                            )}
                          </div>
                          <div className={styles.articuloFooterMobile}>
                            <span className={styles.articuloPrecio}>{formatMoney(art.precio_venta || art.precio_unitario)}</span>
                            <button className={styles.btnAddArtMobile} type="button">+</button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                        No se encontraron artículos con stock disponible.
                      </div>
                    )}
                  </div>
                </div>

                {articulosVenta.length > 0 && (
                  <div className={styles.mobileCartSection}>
                    <label style={{ display: 'block', margin: '1rem 0 0.5rem 0', fontWeight: 800, fontSize: '1rem' }}>🛒 Carrito de Compra ({articulosVenta.length})</label>
                    <div className={styles.mobileCartCards}>
                      {articulosVenta.map((a, i) => (
                        <div key={i} className={styles.cartCard}>
                          <div className={styles.cartCardHeader}>
                            <span className={styles.cartCardName}>{a.nombre}</span>
                            <button 
                              type="button" 
                              onClick={() => updateArticulosYTotal(articulosVenta.filter((_, idx) => idx !== i))} 
                              className={styles.btnRemoveCartCard}
                            >
                              ✕
                            </button>
                          </div>
                          <div className={styles.cartCardBody}>
                            <div className={styles.cartCardRow}>
                              <label>Precio Unitario:</label>
                              <input 
                                type="text" 
                                value={a.precio_unitario === 0 ? '' : new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(a.precio_unitario)} 
                                onChange={(e) => {
                                  const rawValue = e.target.value.replace(/\D/g, '');
                                  const numValue = parseFloat(rawValue) || 0;
                                  const newItems = [...articulosVenta];
                                  newItems[i].precio_unitario = numValue;
                                  updateArticulosYTotal(newItems);
                                }}
                                placeholder="Monto..."
                                className={styles.cartCardPriceInput}
                              />
                            </div>
                            <div className={styles.cartCardRow}>
                              <label>Cantidad:</label>
                              <div className={styles.cartCardQuantitySelector}>
                                <button type="button" onClick={() => handleUpdateCantidad(i, -1)} className={styles.btnQuantity}>-</button>
                                <span className={styles.quantityCount}>{a.cantidad}</span>
                                <button type="button" onClick={() => handleUpdateCantidad(i, 1)} className={styles.btnQuantity}>+</button>
                              </div>
                            </div>
                          </div>
                          <div className={styles.cartCardFooter}>
                            <span>Subtotal:</span>
                            <strong className={styles.cartCardSubtotal}>{formatMoney(a.precio_unitario * a.cantidad)}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className={styles.mobileWizardActions}>
                  <button type="button" className={styles.btnWizardBack} onClick={() => setMobileStep(1)}>⬅️ Atrás</button>
                  <button 
                    type="button" 
                    className={styles.btnWizardNext} 
                    onClick={() => {
                      if (articulosVenta.length === 0) return showToast("Debe agregar al menos un artículo o concepto", "error");
                      setMobileStep(3);
                    }}
                  >
                    Siguiente: Confirmar ➡️
                  </button>
                </div>
              </div>
            )}

            {/* PASO 3: Confirmación */}
            {mobileStep === 3 && (
              <div className={styles.mobileStepContent}>
                <div className={styles.mobileSummaryBox}>
                  <h3>💳 Resumen de Operación</h3>
                  <div className={styles.mobileSummaryRow}>
                    <span>Tipo:</span>
                    <strong>{tipo}</strong>
                  </div>
                  <div className={styles.mobileSummaryRow}>
                    <span>Concepto:</span>
                    <strong>{busquedaConcepto}</strong>
                  </div>
                  <div className={styles.mobileSummaryRow}>
                    <span>Destinatario:</span>
                    <strong>{busquedaBeneficiario || "Ninguno"}</strong>
                  </div>
                  <div className={styles.mobileSummaryRow}>
                    <span>Artículos:</span>
                    <strong>{articulosVenta.length} ítems registrados</strong>
                  </div>
                </div>

                <div className={styles.mobileFormGroup}>
                  <label>📝 Observaciones</label>
                  <textarea 
                    value={observacion} 
                    onChange={e => setObservacion(e.target.value)} 
                    placeholder="Detalles adicionales del movimiento..." 
                    rows={3} 
                    className={styles.mobileTextarea}
                  />
                </div>

                <div className={styles.mobileTotalBox}>
                  <span>💵 Monto Total a Registrar</span>
                  <strong>{formatMoney(parseFloat(monto) || 0)}</strong>
                </div>

                <div className={styles.mobileWizardActions}>
                  <button type="button" className={styles.btnWizardBack} onClick={() => setMobileStep(2)}>⬅️ Atrás</button>
                  <button 
                    type="button" 
                    className={styles.btnConfirmarRegistroMobile} 
                    onClick={() => {
                      if (articulosVenta.length === 0) return showToast("El carrito está vacío", "error");
                      if (!beneficiarioSeleccionado && tipo === "INGRESO") return showToast("Debe seleccionar un estudiante", "error");
                      setShowConfirmModal(true);
                    }} 
                    disabled={loading}
                  >
                    {loading ? "Procesando..." : "💳 Confirmar y Registrar Transacción Ahora"}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.formContainer}>
            <div className={styles.formGroup}>
              <label>Tipo de Transacción</label>
              <div className={styles.tipoButtons}>
                <button className={tipo === "INGRESO" ? styles.activeTipo : ""} onClick={() => { setTipo("INGRESO"); setBeneficiarioSeleccionado(null); setBusquedaBeneficiario(""); }}>📥 Ingreso</button>
                <button className={tipo === "EGRESO" ? styles.activeTipo : ""} onClick={() => { setTipo("EGRESO"); setBeneficiarioSeleccionado(null); setBusquedaBeneficiario(""); }}>📤 Egreso</button>
              </div>
            </div>

            {sedes.length > 1 && (
              <div className={styles.formGroup}>
                <label>Sede / Punto de Venta</label>
                <select 
                  value={sedeSeleccionada?.id} 
                  onChange={e => setSedeSeleccionada(sedes.find(s => s.id === e.target.value))}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white' }}
                >
                  {sedes.map(s => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
              </div>
            )}

            <div className={styles.formGroup}>
              <label>Fecha de Registro</label>
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
            </div>

            <div className={`${styles.formGroup} ${styles.conceptoGroup}`}>
              <label>🏷️ Concepto de Cobro</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  value={busquedaConcepto} 
                  onChange={e => { buscarConceptos(e.target.value); setShowConceptDropdown(true); }} 
                  onFocus={() => { buscarConceptos(""); setShowConceptDropdown(true); }}
                  onBlur={() => setTimeout(() => setShowConceptDropdown(false), 300)}
                  placeholder="Seleccionar concepto..." 
                  className={styles.inputConcepto}
                />
                {showConceptDropdown && (resultadosConceptos.length > 0 ? (
                  <div className={styles.searchDropdown} style={{ zIndex: 9999 }}>
                    {resultadosConceptos.map(c => (
                      <div 
                        key={c.id} 
                        className={styles.searchItem} 
                        onMouseDown={(e) => {
                          e.preventDefault();
                          seleccionarConcepto(c);
                          setShowConceptDropdown(false);
                        }}
                      >
                        <strong>{c.nombre}</strong>
                      </div>
                    ))}
                  </div>
                ) : busquedaConcepto.length > 0 && (
                  <div className={styles.searchDropdown} style={{ zIndex: 9999, padding: '15px', textAlign: 'center', color: '#64748b' }}>
                    No se encontraron conceptos compatibles.
                  </div>
                ))}
              </div>
            </div>

            <div className={`${styles.formGroup} ${styles.beneficiarioGroup}`}>
              <label>{tipo === "INGRESO" ? "👤 Estudiante / Pagador" : "🏢 Beneficiario"}</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  value={busquedaBeneficiario} 
                  onChange={e => { buscarBeneficiarios(e.target.value); setShowBeneficiarioDropdown(true); }} 
                  onFocus={() => { buscarBeneficiarios(""); setShowBeneficiarioDropdown(true); }}
                  onBlur={() => setTimeout(() => setShowBeneficiarioDropdown(false), 200)}
                  placeholder={`Buscar...`} 
                  className={styles.inputBeneficiario}
                />
                {showBeneficiarioDropdown && (resultadosBusqueda.length > 0 ? (
                  <div className={styles.searchDropdown} style={{ zIndex: 9999 }}>
                    {resultadosBusqueda.map(r => (
                      <div 
                        key={r.id} 
                        className={styles.searchItem} 
                        onMouseDown={(e) => {
                          e.preventDefault();
                          seleccionarBeneficiario(r);
                        }}
                      >
                        <strong>{r.primer_apellido} {r.primer_nombre}</strong> {r.cargo ? `(${r.cargo})` : ""}
                      </div>
                    ))}
                  </div>
                ) : busquedaBeneficiario.length > 0 && (
                  <div className={styles.searchDropdown} style={{ zIndex: 9999, padding: '15px', textAlign: 'center', color: '#64748b' }}>
                    No se encontraron resultados.
                  </div>
                ))}
              </div>
            </div>

            {/* Alerta de Facturas Pendientes (Cartera) */}
            {tipo === "INGRESO" && facturasPendientes.length > 0 && (
              <div className={`${styles.alertaCartera} ${styles.fullWidth}`}>
                <div className={styles.alertaHeader}>
                  <span className={styles.alertaIcon}>⚠️</span>
                  <div>
                    <strong>Atención: Estudiante con deudas pendientes</strong>
                    <p>Este estudiante tiene {facturasPendientes.length} factura(s) pendiente(s) de pago.</p>
                  </div>
                </div>
                <div className={styles.facturasPendientesList}>
                  {facturasPendientes.map(f => (
                    <div key={f.id} className={`${styles.facturaPendienteItem} ${facturaIdSeleccionada === f.id ? styles.facturaSelected : ''}`}>
                      <div className={styles.facturaInfo}>
                        <span className={styles.facturaNumero}>{f.numero_factura}</span>
                        <span className={styles.facturaDesc}>{f.observaciones || 'Pensión / Cobro'}</span>
                        <span className={styles.facturaMonto}>{formatMoney(f.total)}</span>
                      </div>
                      <button 
                        className={styles.btnPagarDeuda}
                        onClick={() => {
                          setFacturaIdSeleccionada(f.id);
                          // Cargar automáticamente los detalles al carrito
                          const detalles = f.factura_detalle.map((d: any) => ({
                            ...d,
                            id: d.articulo_inventario_id || d.concepto_cobro_id || d.id,
                            nombre: d.descripcion,
                            precio_unitario: d.valor_unitario,
                            cantidad: d.cantidad,
                            es_concepto: d.concepto_cobro_id ? true : false,
                            aplica_iva: d.valor_iva > 0,
                            porcentaje_iva: d.valor_iva > 0 ? (d.valor_iva / d.valor_unitario) * 100 : 0
                          }));
                          setArticulosVenta(detalles);
                          setMonto(f.total.toString());
                          setObservacion(`Pago de factura ${f.numero_factura}`);
                          showToast("Factura cargada al carrito", "info");
                        }}
                      >
                        {facturaIdSeleccionada === f.id ? 'Seleccionada' : 'Cobrar esta factura'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {mostrarSelectorArticulos && (
              <div className={styles.inventarioSelector}>
                <div className={styles.inventarioHeader}>
                  <h3>📦 Selección de Artículos</h3>
                  <button 
                    type="button" 
                    className={styles.btnCerrarSelector}
                    onClick={() => setMostrarSelectorArticulos(false)}
                  >
                    ✕
                  </button>
                </div>
                <div className={styles.articulosGrid}>
                  {articulosInventario.length > 0 ? (
                    articulosInventario.map(art => (
                      <div key={art.id} className={styles.articuloCard} onClick={() => handleAddArticulo(art)}>
                        <div className={styles.articuloHeader}>
                          <span className={styles.articuloNombre}>{art.nombre}</span>
                          {art.es_servicio ? (
                            <span className={styles.badgeServicio}>SERVICIO</span>
                          ) : (
                            <span className={styles.articuloStock}>Stock: {art.cantidad_stock}</span>
                          )}
                        </div>
                        <div className={styles.articuloFooter}>
                          <span className={styles.articuloPrecio}>{formatMoney(art.precio_venta || art.precio_unitario)}</span>
                          <button className={styles.btnAddArt}>+</button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ gridColumn: '1 / -1', padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                      No se encontraron artículos en esta categoría con stock disponible.
                    </div>
                  )}
                </div>
              </div>
            )}

            {articulosVenta.length > 0 && (
              <div className={`${styles.cartSection} ${styles.fullWidth}`} style={{ marginTop: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '1rem', fontWeight: 700, fontSize: '1.1rem' }}>🛒 Detalle de la Transacción</label>
                
                {/* Vista de escritorio (Tabla) */}
                <div className={styles.desktopCartTable}>
                  <div className={styles.tableWrapper}>
                    <table className={styles.table} style={{ borderSpacing: 0 }}>
                      <thead>
                        <tr>
                          <th style={{ background: '#f8fafc' }}>Concepto / Artículo</th>
                          <th style={{ background: '#f8fafc' }}>Cant</th>
                          <th style={{ background: '#f8fafc' }}>Precio Unitario</th>
                          <th style={{ background: '#f8fafc' }}>Subtotal</th>
                          <th style={{ background: '#f8fafc' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {articulosVenta.map((a, i) => (
                          <tr key={i}>
                            <td style={{ background: 'white', borderBottom: '1px solid #f1f5f9' }}>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: 600 }}>{a.nombre}</span>
                                {a.es_servicio && <span style={{ fontSize: '0.7rem', color: '#4f46e5', fontWeight: 700 }}>SERVICIO</span>}
                              </div>
                            </td>
                            <td style={{ background: 'white', borderBottom: '1px solid #f1f5f9' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <button type="button" onClick={() => handleUpdateCantidad(i, -1)} style={{ padding: '2px 8px', borderRadius: '4px', border: '1px solid #ddd', background: '#f8fafc' }}>-</button>
                                <span style={{ minWidth: '20px', textAlign: 'center', fontWeight: 700 }}>{a.cantidad}</span>
                                <button type="button" onClick={() => handleUpdateCantidad(i, 1)} style={{ padding: '2px 8px', borderRadius: '4px', border: '1px solid #ddd', background: '#f8fafc' }}>+</button>
                              </div>
                            </td>
                            <td style={{ background: 'white', borderBottom: '1px solid #f1f5f9', fontWeight: 700 }}>
                              <input 
                                type="text" 
                                value={a.precio_unitario === 0 ? '' : new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(a.precio_unitario)} 
                                onChange={(e) => {
                                  const rawValue = e.target.value.replace(/\D/g, '');
                                  const numValue = parseFloat(rawValue) || 0;
                                  const newItems = [...articulosVenta];
                                  newItems[i].precio_unitario = numValue;
                                  updateArticulosYTotal(newItems);
                                }}
                                placeholder="Monto..."
                                style={{ 
                                  width: '120px', 
                                  padding: '8px 12px', 
                                  border: '1.5px solid #cbd5e1', 
                                  borderRadius: '8px', 
                                  fontSize: '0.95rem',
                                  fontWeight: 700,
                                  color: '#1e293b',
                                  outline: 'none',
                                  transition: 'border-color 0.2s, box-shadow 0.2s',
                                  textAlign: 'right'
                                }}
                                onFocus={(e) => {
                                  e.target.style.borderColor = '#4f46e5';
                                  e.target.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.1)';
                                }}
                                onBlur={(e) => {
                                  e.target.style.borderColor = '#cbd5e1';
                                  e.target.style.boxShadow = 'none';
                                }}
                              />
                            </td>
                            <td style={{ background: 'white', borderBottom: '1px solid #f1f5f9', fontWeight: 800, color: '#4f46e5' }}>{formatMoney(a.precio_unitario * a.cantidad)}</td>
                            <td style={{ background: 'white', borderBottom: '1px solid #f1f5f9' }}>
                              <button type="button" onClick={() => updateArticulosYTotal(articulosVenta.filter((_, idx) => idx !== i))} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Vista de móvil (Cards) */}
                <div className={styles.mobileCartCards}>
                  {articulosVenta.map((a, i) => (
                    <div key={i} className={styles.cartCard}>
                      <div className={styles.cartCardHeader}>
                        <span className={styles.cartCardName}>{a.nombre}</span>
                        <button 
                          type="button" 
                          onClick={() => updateArticulosYTotal(articulosVenta.filter((_, idx) => idx !== i))} 
                          className={styles.btnRemoveCartCard}
                        >
                          ✕
                        </button>
                      </div>
                      <div className={styles.cartCardBody}>
                        <div className={styles.cartCardRow}>
                          <label>Precio Unitario:</label>
                          <input 
                            type="text" 
                            value={a.precio_unitario === 0 ? '' : new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(a.precio_unitario)} 
                            onChange={(e) => {
                              const rawValue = e.target.value.replace(/\D/g, '');
                              const numValue = parseFloat(rawValue) || 0;
                              const newItems = [...articulosVenta];
                              newItems[i].precio_unitario = numValue;
                              updateArticulosYTotal(newItems);
                            }}
                            placeholder="Monto..."
                            className={styles.cartCardPriceInput}
                          />
                        </div>
                        <div className={styles.cartCardRow}>
                          <label>Cantidad:</label>
                          <div className={styles.cartCardQuantitySelector}>
                            <button type="button" onClick={() => handleUpdateCantidad(i, -1)} className={styles.btnQuantity}>-</button>
                            <span className={styles.quantityCount}>{a.cantidad}</span>
                            <button type="button" onClick={() => handleUpdateCantidad(i, 1)} className={styles.btnQuantity}>+</button>
                          </div>
                        </div>
                      </div>
                      <div className={styles.cartCardFooter}>
                        <span>Subtotal:</span>
                        <strong className={styles.cartCardSubtotal}>{formatMoney(a.precio_unitario * a.cantidad)}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label>Observaciones</label>
              <textarea value={observacion} onChange={e => setObservacion(e.target.value)} placeholder="Detalles adicionales del movimiento..." rows={3} />
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label>Monto Total (Auto-calculado)</label>
              <input 
                type="text" 
                value={formatMoney(parseFloat(monto) || 0)} 
                readOnly 
                style={{ background: '#f1f5f9', fontWeight: 800, fontSize: '1.8rem', color: '#4f46e5', textAlign: 'right', border: '2px solid #e2e8f0' }} 
              />
            </div>

            <button className={styles.btnConfirmarRegistro} onClick={() => {
              if (articulosVenta.length === 0) return showToast("El carrito está vacío", "error");
              if (!beneficiarioSeleccionado && tipo === "INGRESO") return showToast("Debe seleccionar un estudiante", "error");
              setShowConfirmModal(true);
            }} disabled={loading}>
              {loading ? "Procesando..." : "💳 Confirmar y Registrar Transacción Ahora"}
            </button>
          </div>
        )
      )}

      {activeTab === "movimientos" && (
        <>
          <CajaSummary resumen={resumen} formatMoney={formatMoney} />
          <CajaHistory 
            resumen={resumen}
            fechaDesde={fechaDesde}
            setFechaDesde={setFechaDesde}
            fechaHasta={fechaHasta}
            setFechaHasta={setFechaHasta}
            cargarResumen={cargarResumen}
            formatMoney={formatMoney}
            imprimirRecibo={imprimirRecibo}
          />
        </>
      )}

      {mostrarComprobante && (
        <ReceiptModal 
          comprobanteReciente={comprobanteReciente}
          formatMoney={formatMoney}
          onPrint={imprimirRecibo}
          onClose={() => setMostrarComprobante(false)}
        />
      )}

      {showPreview && (
        <ReceiptPreview 
          datos={previewData}
          institucion={institucion}
          sedeActual={sedeSeleccionada}
          formatMoney={formatMoney}
          onClose={() => setShowPreview(false)}
        />
      )}

      {showConfirmModal && (
        <ConfirmationModal 
          tipo={tipo}
          busquedaBeneficiario={busquedaBeneficiario}
          articulosVenta={articulosVenta}
          monto={monto}
          formatMoney={formatMoney}
          onCancel={() => setShowConfirmModal(false)}
          onConfirm={() => {
            setShowConfirmModal(false);
            registrarTransaccion();
          }}
        />
      )}
    </div>
  );
}
