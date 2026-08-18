"use client";

import React, { useEffect, useState } from "react";
import { getAuthToken } from "@/utils/auth";
import { API_URL } from "@/utils/api";
import styles from "./InventarioList.module.css";

export const InventarioList = () => {
  const [elementos, setElementos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<string>("todos");
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("todas");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "move" | "history">(
    "create",
  );
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [showNuevaCategoria, setShowNuevaCategoria] = useState(false);
  const [nuevaCategoriaNombre, setNuevaCategoriaNombre] = useState("");
  const [savingCategoria, setSavingCategoria] = useState(false);
  // Estados para validación y alertas interactivas sin alert() de navegador
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [modalErrorMessage, setModalErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const clearErrors = () => {
    setFormErrors({});
    setModalErrorMessage(null);
  };

  const formatCurrency = (val: number | string) => {
    if (val === undefined || val === null || val === "") return "";
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return "";
    return new Intl.NumberFormat("es-CO", {
      maximumFractionDigits: 0
    }).format(num);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const rawValue = value.replace(/\D/g, '');
    const numValue = parseFloat(rawValue) || 0;

    if (formErrors[name]) {
      setFormErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }

    setFormData({ ...formData, [name]: numValue });
  };

  const fetchInventario = async () => {
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/inventario/articulos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setElementos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategorias = async () => {
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/inventario/categorias`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCategorias(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchInventario();
    fetchCategorias();
  }, []);

  const openCreate = () => {
    clearErrors();
    setFormData({
      nombre: "",
      descripcion: "",
      codigo_interno: "", // El backend lo generará automáticamente
      cantidad_stock: 0,
      cantidad_minima: 0,
      unidad_medida: "und",
      precio_unitario: 0,
      precio_venta: 0,
      ubicacion: "Almacén Central",
      categoria_id: "",
      es_servicio: false,
    });
    setModalMode("create");
    setShowModal(true);
  };

  const openEdit = (item: any) => {
    clearErrors();
    setSelectedItem(item);
    setFormData({
      nombre: item.nombre || "",
      descripcion: item.descripcion || "",
      codigo_interno: item.codigo_interno || "",
      cantidad_stock: item.cantidad_stock || 0,
      cantidad_minima: item.cantidad_minima || 0,
      unidad_medida: item.unidad_medida || "und",
      precio_unitario: Number(item.precio_unitario) || 0,
      precio_venta: Number(item.precio_venta) || 0,
      ubicacion: item.ubicacion || "Almacén Central",
      categoria_id: item.categoria_id || "",
      es_servicio: item.es_servicio || false,
    });
    setModalMode("edit");
    setShowModal(true);
  };

  const openMove = (item: any) => {
    clearErrors();
    setSelectedItem(item);
    setFormData({
      tipo_movimiento: "Entrada",
      cantidad: 0,
      observacion: "",
    });
    setModalMode("move");
    setShowModal(true);
  };

  const openHistory = (item: any) => {
    clearErrors();
    setSelectedItem(item);
    setModalMode("history");
    setShowModal(true);
  };

  const openGeneralMove = () => {
    clearErrors();
    setSelectedItem(null);
    setFormData({
      tipo_movimiento: "Entrada",
      cantidad: "",
      observacion: "",
      articulo_busqueda: ""
    });
    setModalMode("move");
    setShowModal(true);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = e.target;
    let parsedValue: any = value;
    
    if (type === "number") {
      parsedValue = value === "" ? "" : parseFloat(value);
    } else if (type === "checkbox") {
      parsedValue = (e.target as HTMLInputElement).checked;
    }

    // Detectar si seleccionó "nueva_categoria"
    if (name === "categoria_id" && value === "nueva_categoria") {
      setShowNuevaCategoria(true);
      parsedValue = ""; // No guardar el valor especial
    }

    // Limpiar error específico del campo modificado
    if (formErrors[name]) {
      setFormErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }

    setFormData({ ...formData, [name]: parsedValue });
  };

  const handleCrearCategoria = async () => {
    if (!nuevaCategoriaNombre.trim()) {
      setModalErrorMessage("Ingrese el nombre de la nueva categoría");
      return;
    }

    setSavingCategoria(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/inventario/categorias`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nombre: nuevaCategoriaNombre.trim() }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Error al crear categoría");
      }

      const nuevaCategoria = await res.json();

      // Actualizar lista de categorías
      await fetchCategorias();

      // Seleccionar la nueva categoría y limpiar errores
      setFormData({ ...formData, categoria_id: nuevaCategoria.id });
      setFormErrors(prev => {
        const next = { ...prev };
        delete next.categoria_id;
        return next;
      });

      setNuevaCategoriaNombre("");
      setShowNuevaCategoria(false);
      showToast(`Categoría "${nuevaCategoria.nombre}" creada exitosamente`, "success");
    } catch (err: any) {
      setModalErrorMessage(err.message || "Error al crear categoría");
    } finally {
      setSavingCategoria(false);
    }
  };

  const handleSubmit = async () => {
    const errors: { [key: string]: string } = {};

    if (modalMode === "create" || modalMode === "edit") {
      if (!formData.nombre?.trim()) {
        errors.nombre = "El nombre es un campo obligatorio.";
      }
      if (!formData.categoria_id || formData.categoria_id.trim() === "" || formData.categoria_id === "nueva_categoria") {
        errors.categoria_id = "La categoría es un campo obligatorio.";
      }
      if (formData.precio_venta === undefined || formData.precio_venta === null || formData.precio_venta === "") {
        errors.precio_venta = "El precio de venta es obligatorio.";
      }
    } else if (modalMode === "move") {
      if (!formData.cantidad || Number(formData.cantidad) <= 0) {
        errors.cantidad = "La cantidad debe ser mayor a 0.";
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setModalErrorMessage("Faltan datos obligatorios. Por favor verifique los campos marcados en rojo.");
      return;
    }

    clearErrors();
    setSaving(true);
    try {
      const token = getAuthToken();
      let url = "";
      let method = "";
      let body = {};

      if (modalMode === "move") {
        url = `${API_URL}/inventario/movimientos`;
        method = "POST";
        body = {
          articulo_id: selectedItem.id,
          tipo: formData.tipo_movimiento,
          cantidad: formData.cantidad,
          motivo: formData.observacion
        };
      } else {
        const isEdit = modalMode === "edit";
        url = isEdit
          ? `${API_URL}/inventario/articulos/${selectedItem.id}`
          : `${API_URL}/inventario/articulos`;
        method = isEdit ? "PATCH" : "POST";
        
        const cleanBody: any = {
          ...formData,
          cantidad_stock: formData.cantidad_stock !== undefined && formData.cantidad_stock !== null && formData.cantidad_stock !== "" ? Number(formData.cantidad_stock) : 0,
          cantidad_minima: formData.cantidad_minima !== undefined && formData.cantidad_minima !== null && formData.cantidad_minima !== "" ? Number(formData.cantidad_minima) : 0,
          precio_unitario: formData.precio_unitario !== undefined && formData.precio_unitario !== null && formData.precio_unitario !== "" ? Number(formData.precio_unitario) : 0,
          precio_venta: formData.precio_venta !== undefined && formData.precio_venta !== null && formData.precio_venta !== "" ? Number(formData.precio_venta) : 0,
          es_servicio: !!formData.es_servicio,
        };

        if (!cleanBody.categoria_id || cleanBody.categoria_id === "" || cleanBody.categoria_id === "null" || cleanBody.categoria_id === "nueva_categoria") {
          delete cleanBody.categoria_id;
        }

        body = cleanBody;
      }

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Error en la operación");
      }

      setShowModal(false);
      showToast(modalMode === "create" ? "Guardado exitosamente" : "Actualizado exitosamente", "success");
      fetchInventario();
    } catch (err: any) {
      setModalErrorMessage(err.message || "Error al realizar la operación");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm(`¿Está seguro de eliminar el artículo "${nombre}"?`)) {
      return;
    }

    setDeletingId(id);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/inventario/articulos/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Error al eliminar artículo");
      }

      showToast(`Artículo "${nombre}" eliminado correctamente`, "success");
      fetchInventario();
    } catch (err: any) {
      showToast(err.message || "Error al eliminar artículo", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredElementos = elementos.filter((el) => {
    // Filtro de búsqueda por texto
    const matchesSearch =
      el.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      el.codigo_interno?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      el.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      el.descripcion?.toLowerCase().includes(searchTerm.toLowerCase());

    // Filtro por Tipo (Producto / Servicio)
    let matchesTipo = true;
    if (tipoFiltro === "servicio") matchesTipo = el.es_servicio === true;
    if (tipoFiltro === "producto") matchesTipo = !el.es_servicio;

    // Filtro por Categoría
    let matchesCategoria = true;
    if (categoriaFiltro && categoriaFiltro !== "todas") {
      matchesCategoria = el.categoria_id === categoriaFiltro || el.categoria?.id === categoriaFiltro;
    }

    return matchesSearch && matchesTipo && matchesCategoria;
  });

  return (
    <div className={styles.container}>
      {/* Notificación Toast flotante */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: toastMessage.type === 'success' ? '#10b981' : '#ef4444',
          color: '#ffffff',
          padding: '12px 22px',
          borderRadius: '10px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
          zIndex: 99999,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.95rem'
        }}>
          <span>{toastMessage.type === 'success' ? '✅' : '❌'} {toastMessage.message}</span>
        </div>
      )}

      <header className={styles.header}>
        <div className={styles.titleSection}>
          <h1>Inventario Institucional</h1>
          <p>Control de recursos físicos, suministros y activos</p>
        </div>
        <div className={styles.actions}>
          <button
            className={styles.moveBtn}
            onClick={openGeneralMove}
          >
            Registrar Movimiento
          </button>
          <button className={styles.addBtn} onClick={openCreate}>
            + Nuevo Elemento
          </button>
        </div>
      </header>

      <div className={styles.searchBar} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="🔍 Buscar por nombre, código o descripción..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: '2 1 240px' }}
        />

        <select
          value={tipoFiltro}
          onChange={(e) => setTipoFiltro(e.target.value)}
          style={{
            flex: '1 1 160px',
            padding: '0.6rem 1rem',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            backgroundColor: '#ffffff',
            fontSize: '0.9rem',
            fontWeight: 500,
            color: '#334155',
            cursor: 'pointer'
          }}
        >
          <option value="todos">📦✨ Todos los Tipos</option>
          <option value="producto">📦 Solo Productos</option>
          <option value="servicio">✨ Solo Servicios</option>
        </select>

        <select
          value={categoriaFiltro}
          onChange={(e) => setCategoriaFiltro(e.target.value)}
          style={{
            flex: '1 1 180px',
            padding: '0.6rem 1rem',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            backgroundColor: '#ffffff',
            fontSize: '0.9rem',
            fontWeight: 500,
            color: '#334155',
            cursor: 'pointer'
          }}
        >
          <option value="todas">🏷️ Todas las Categorías</option>
          {categorias.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.grid}>
        {loading ? (
          <div className={styles.loading}>Sincronizando almacén...</div>
        ) : (
          filteredElementos.map((el) => (
            <div key={el.id} className={styles.itemCard}>
              <div className={styles.cardHeader}>
                <span className={styles.category}>
                  🏷️ {el.categoria?.nombre || (categorias.find(c => c.id === el.categoria_id)?.nombre) || "Sin Categoría"}
                </span>
                {el.es_servicio ? (
                  <span className={styles.category} style={{ background: '#e0e7ff', color: '#4338ca' }}>
                    SERVICIO
                  </span>
                ) : (
                  <span
                    className={`${styles.stock} ${el.cantidad_stock <= (el.cantidad_minima || 0) ? styles.low : ""}`}
                  >
                    Stock: {el.cantidad_stock} {el.unidad_medida || "und"}
                  </span>
                )}
              </div>
              <h3>{el.nombre}</h3>
              <p className={styles.description}>
                {el.descripcion || "Sin descripción"}
              </p>
              <div className={styles.cardFooter}>
                <span className={styles.location}>
                  📍 {el.ubicacion || "Almacén Central"}
                </span>
                <div className={styles.cardActions}>
                  <button
                    className={styles.editBtn}
                    onClick={() => openEdit(el)}
                    title="Editar artículo"
                  >
                    ✏️
                  </button>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleDelete(el.id, el.nombre)}
                    disabled={deletingId === el.id}
                    title="Eliminar artículo"
                  >
                    {deletingId === el.id ? "..." : "🗑️"}
                  </button>
                  <button
                    className={styles.moveBtn}
                    style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }}
                    onClick={() => openMove(el)}
                  >
                    Mover
                  </button>
                  <button
                    className={styles.detailBtn}
                    onClick={() => openHistory(el)}
                  >
                    Historial
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>
                {modalMode === "create" && "Nuevo Elemento"}
                {modalMode === "edit" && `Editar: ${selectedItem?.nombre}`}
                {modalMode === "move" && `Movimiento: ${selectedItem?.nombre}`}
                {modalMode === "history" &&
                  `Historial: ${selectedItem?.nombre}`}
              </h2>
              <button
                className={styles.closeBtn}
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              {modalErrorMessage && (
                <div style={{
                  backgroundColor: '#fef2f2',
                  borderLeft: '4px solid #ef4444',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  color: '#991b1b',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>⚠️ {modalErrorMessage}</span>
                </div>
              )}

              {(modalMode === "create" || modalMode === "edit") && (
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label style={{ color: formErrors.nombre ? '#dc2626' : undefined, fontWeight: formErrors.nombre ? 600 : undefined }}>
                      Nombre {formErrors.nombre ? '⚠️ *' : '*'}
                    </label>
                    <input
                      name="nombre"
                      value={formData.nombre || ""}
                      onChange={handleChange}
                      placeholder="Ej. Pensión Mensual, Cuaderno..."
                      style={{
                        border: formErrors.nombre ? '2px solid #ef4444' : undefined,
                        backgroundColor: formErrors.nombre ? '#fef2f2' : undefined,
                      }}
                    />
                    {formErrors.nombre && (
                      <span style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '4px', display: 'block', fontWeight: 600 }}>
                        ⚠️ {formErrors.nombre}
                      </span>
                    )}
                  </div>
                  <div className={styles.formGroup}>
                    <label>Tipo de Ítem</label>
                    <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input type="radio" name="es_servicio" checked={!formData.es_servicio} onChange={() => setFormData({...formData, es_servicio: false})} /> 📦 Producto
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input type="radio" name="es_servicio" checked={formData.es_servicio} onChange={() => setFormData({...formData, es_servicio: true})} /> ✨ Servicio
                      </label>
                    </div>
                  </div>
                  <div className={styles.formGroup}>
                    <label style={{ color: formErrors.categoria_id ? '#dc2626' : undefined, fontWeight: formErrors.categoria_id ? 600 : undefined }}>
                      Categoría {formErrors.categoria_id ? '⚠️ *' : '*'}
                    </label>
                    <select
                      name="categoria_id"
                      value={formData.categoria_id || ""}
                      onChange={handleChange}
                      style={{
                        border: formErrors.categoria_id ? '2px solid #ef4444' : undefined,
                        backgroundColor: formErrors.categoria_id ? '#fef2f2' : undefined,
                      }}
                    >
                      <option value="">-- Seleccionar categoría * --</option>
                      {categorias.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.nombre}
                        </option>
                      ))}
                      <option value="nueva_categoria">
                        + Crear nueva categoría
                      </option>
                    </select>
                    {formErrors.categoria_id && (
                      <span style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '4px', display: 'block', fontWeight: 600 }}>
                        ⚠️ {formErrors.categoria_id}
                      </span>
                    )}

                    {showNuevaCategoria && (
                      <div className={styles.nuevaCategoriaBox}>
                        <input
                          type="text"
                          placeholder="Nombre de nueva categoría"
                          value={nuevaCategoriaNombre}
                          onChange={(e) =>
                            setNuevaCategoriaNombre(e.target.value)
                          }
                          className={styles.nuevaCategoriaInput}
                        />
                        <div className={styles.nuevaCategoriaButtons}>
                          <button
                            type="button"
                            onClick={() => setShowNuevaCategoria(false)}
                            className={styles.cancelBtn}
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={handleCrearCategoria}
                            disabled={savingCategoria}
                            className={styles.saveBtn}
                          >
                            {savingCategoria ? "Creando..." : "Crear"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  {!formData.es_servicio && (
                    <>
                      <div className={styles.formGroup}>
                        <label>Cantidad Inicial</label>
                        <input
                          type="number"
                          name="cantidad_stock"
                          value={formData.cantidad_stock || 0}
                          onChange={handleChange}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Cantidad Mínima</label>
                        <input
                          type="number"
                          name="cantidad_minima"
                          value={formData.cantidad_minima || 0}
                          onChange={handleChange}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Unidad</label>
                        <select
                          name="unidad_medida"
                          value={formData.unidad_medida || "und"}
                          onChange={handleChange}
                        >
                          <option value="und">Unidad</option>
                          <option value="kg">Kilogramo</option>
                          <option value="lt">Litro</option>
                          <option value="pkg">Paquete</option>
                          <option value="caja">Caja</option>
                        </select>
                      </div>
                    </>
                  )}
                  <div className={styles.formGroup}>
                    <label>Precio Costo</label>
                    <input
                      type="text"
                      name="precio_unitario"
                      value={formatCurrency(formData.precio_unitario)}
                      onChange={handlePriceChange}
                      placeholder="0"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label style={{ color: formErrors.precio_venta ? '#dc2626' : undefined, fontWeight: formErrors.precio_venta ? 600 : undefined }}>
                      Precio Venta {formErrors.precio_venta ? '⚠️ *' : '*'}
                    </label>
                    <input
                      type="text"
                      name="precio_venta"
                      value={formatCurrency(formData.precio_venta)}
                      onChange={handlePriceChange}
                      placeholder="0"
                      style={{
                        border: formErrors.precio_venta ? '2px solid #ef4444' : undefined,
                        backgroundColor: formErrors.precio_venta ? '#fef2f2' : undefined,
                      }}
                    />
                    {formErrors.precio_venta && (
                      <span style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '4px', display: 'block', fontWeight: 600 }}>
                        ⚠️ {formErrors.precio_venta}
                      </span>
                    )}
                  </div>
                  {!formData.es_servicio && (
                    <div className={styles.formGroup}>
                      <label>Ubicación</label>
                      <input
                        name="ubicacion"
                        value={formData.ubicacion || ""}
                        onChange={handleChange}
                      />
                    </div>
                  )}
                  <div className={styles.formGroup}>
                    <label>Código Interno (Se asignará automáticamente)</label>
                    <input
                      name="codigo_interno"
                      value={formData.codigo_interno || "ART-XXXXXX (Auto)"}
                      readOnly
                      className={styles.codigoAutogenerado}
                      title="El código se generará automáticamente al guardar"
                    />
                  </div>
                  <div
                    className={styles.formGroup}
                    style={{ gridColumn: "1 / -1" }}
                  >
                    <label>Descripción</label>
                    <textarea
                      name="descripcion"
                      value={formData.descripcion || ""}
                      onChange={handleChange}
                      rows={3}
                      className={styles.textareaDescripcion}
                      placeholder="Descripción detallada del artículo..."
                    />
                  </div>
                </div>
              )}
              {modalMode === "move" && (
                <div className={styles.formGrid}>
                  {!selectedItem && (
                    <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                      <label>Buscar Artículo *</label>
                      <div className={styles.searchWrapper}>
                        <input
                          type="text"
                          placeholder="Escriba nombre del artículo..."
                          value={formData.articulo_busqueda || ""}
                          onChange={(e) => setFormData({ ...formData, articulo_busqueda: e.target.value })}
                          className={styles.searchInnerInput}
                        />
                        {formData.articulo_busqueda && !selectedItem && (
                          <div className={styles.searchResultsDropdown}>
                            {elementos
                              .filter(el => el.nombre.toLowerCase().includes(formData.articulo_busqueda.toLowerCase()))
                              .slice(0, 5)
                              .map(el => (
                                <div 
                                  key={el.id} 
                                  className={styles.searchResultItem}
                                  onClick={() => {
                                    setSelectedItem(el);
                                    setFormData({ ...formData, articulo_busqueda: el.nombre });
                                  }}
                                >
                                  <strong>{el.nombre}</strong> (Stock: {el.cantidad_stock})
                                </div>
                              ))
                            }
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedItem && (
                    <>
                      <div className={styles.selectedItemBadge} style={{ gridColumn: '1 / -1' }}>
                        <span>Artículo: <strong>{selectedItem.nombre}</strong></span>
                        <span>Stock Actual: <strong>{selectedItem.cantidad_stock}</strong></span>
                        <button 
                          onClick={() => {
                            setSelectedItem(null);
                            setFormData({ ...formData, articulo_busqueda: "" });
                          }} 
                          className={styles.changeItemBtn}
                        >
                          Cambiar
                        </button>
                      </div>
                      
                      <div className={styles.formGroup}>
                        <label>Tipo de Movimiento</label>
                        <select
                          name="tipo_movimiento"
                          value={formData.tipo_movimiento || "Entrada"}
                          onChange={handleChange}
                        >
                          <option value="Entrada">Entrada</option>
                          <option value="Salida">Salida</option>
                          <option value="Ajuste">Ajuste</option>
                        </select>
                      </div>
                      <div className={styles.formGroup}>
                        <label>Cantidad</label>
                        <input
                          type="number"
                          name="cantidad"
                          value={formData.cantidad}
                          onChange={handleChange}
                          placeholder="Ej: 10"
                        />
                      </div>
                      <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                        <label>Observación / Motivo</label>
                        <input
                          name="observacion"
                          value={formData.observacion || ""}
                          onChange={handleChange}
                          placeholder="Opcional..."
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
              {modalMode === "history" && (
                <div className={styles.historyList}>
                  <p style={{ color: "#64748b", textAlign: "center" }}>
                    Historial de movimientos - Funcionalidad en desarrollo
                  </p>
                </div>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.cancelBtn}
                onClick={() => setShowModal(false)}
              >
                Cancelar
              </button>
              {modalMode !== "history" && (
                <button
                  className={styles.saveBtn}
                  onClick={handleSubmit}
                  disabled={saving}
                >
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
