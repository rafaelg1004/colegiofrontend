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
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "move" | "history">(
    "create",
  );
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);

  // Estado para crear nueva categoría
  const [showNuevaCategoria, setShowNuevaCategoria] = useState(false);
  const [nuevaCategoriaNombre, setNuevaCategoriaNombre] = useState("");
  const [savingCategoria, setSavingCategoria] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
    // Solo permitir números y puntos de miles (que el usuario escriba o se formateen)
    const rawValue = value.replace(/\D/g, '');
    const numValue = parseFloat(rawValue) || 0;
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
    setSelectedItem(item);
    setModalMode("history");
    setShowModal(true);
  };

  const openGeneralMove = () => {
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

    setFormData({ ...formData, [name]: parsedValue });
  };

  const handleCrearCategoria = async () => {
    if (!nuevaCategoriaNombre.trim()) {
      alert("Ingrese el nombre de la categoría");
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

      // Seleccionar la nueva categoría
      setFormData({ ...formData, categoria_id: nuevaCategoria.id });

      // Limpiar y cerrar
      setNuevaCategoriaNombre("");
      setShowNuevaCategoria(false);

      alert(
        `Categoría "${nuevaCategoria.nombre}" creada exitosamente. El concepto de cobro se creará automáticamente.`,
      );
    } catch (err: any) {
      alert(err.message || "Error al crear categoría");
    } finally {
      setSavingCategoria(false);
    }
  };

  const handleSubmit = async () => {
    // Validaciones por modo
    if (modalMode === "create" || modalMode === "edit") {
      if (!formData.nombre?.trim()) {
        alert("El nombre del artículo es obligatorio");
        return;
      }
    } else if (modalMode === "move") {
      if (!formData.cantidad || formData.cantidad <= 0) {
        alert("La cantidad debe ser mayor a 0");
        return;
      }
    }

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
        
        // Limpiar tipos numéricos, booleanos y campos opcionales vacíos para evitar errores de class-validator
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
      fetchInventario();
    } catch (err: any) {
      alert(err.message || "Error en la operación");
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

      fetchInventario();
    } catch (err: any) {
      alert(err.message || "Error al eliminar");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredElementos = elementos.filter(
    (el) =>
      el.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      el.codigo?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className={styles.container}>
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

      <div className={styles.searchBar}>
        <input
          type="text"
          placeholder="Buscar elemento por nombre o código..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className={styles.grid}>
        {loading ? (
          <div className={styles.loading}>Sincronizando almacén...</div>
        ) : (
          filteredElementos.map((el) => (
            <div key={el.id} className={styles.itemCard}>
              <div className={styles.cardHeader}>
                <span className={styles.category}>
                  {el.categoria?.nombre || "General"}
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
              {(modalMode === "create" || modalMode === "edit") && (
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Nombre *</label>
                    <input
                      name="nombre"
                      value={formData.nombre || ""}
                      onChange={handleChange}
                      required
                    />
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
                    <label>Categoría</label>
                    <select
                      name="categoria_id"
                      value={formData.categoria_id || ""}
                      onChange={handleChange}
                    >
                      <option value="">Seleccionar categoría</option>
                      {categorias.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.nombre}
                        </option>
                      ))}
                      <option value="nueva_categoria">
                        + Crear nueva categoría
                      </option>
                    </select>

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
                    <label>Precio Venta *</label>
                    <input
                      type="text"
                      name="precio_venta"
                      value={formatCurrency(formData.precio_venta)}
                      onChange={handlePriceChange}
                      required
                      placeholder="0"
                    />
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
