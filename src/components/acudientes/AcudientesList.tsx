"use client";

import { useEffect, useState, useCallback } from "react";
import { getAuthToken } from "@/utils/auth";
import { API_URL } from "@/utils/api";
import styles from "./AcudientesList.module.css";

interface Estudiante {
  id: string;
  primer_nombre: string;
  primer_apellido: string;
  numero_documento: string;
}

interface Acudiente {
  id: string;
  primer_nombre: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  tipo_documento: string;
  numero_documento: string;
  parentesco?: string;
  telefono?: string;
  celular?: string;
  correo_electronico?: string;
  direccion?: string;
  ocupacion?: string;
  empresa?: string;
  estudiante_acudiente?: Array<{
    es_principal: boolean;
    estudiante: Estudiante;
  }>;
}

export const AcudientesList = () => {
  const [acudientes, setAcudientes] = useState<Acudiente[]>([]);
  const [loading, setLoading] = useState(true);
  const [buscar, setBuscar] = useState("");
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [searchEstudiante, setSearchEstudiante] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [showDetalle, setShowDetalle] = useState(false);
  const [selectedAcudiente, setSelectedAcudiente] = useState<Acudiente | null>(
    null,
  );
  const [formData, setFormData] = useState<any>({});
  const [selectedEstudiantes, setSelectedEstudiantes] = useState<Estudiante[]>(
    [],
  );
  const [saving, setSaving] = useState(false);

  const fetchAcudientes = useCallback(async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/acudientes?buscar=${buscar}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAcudientes(Array.isArray(data) ? data : []);
      }
    } finally {
      setLoading(false);
    }
  }, [buscar]);

  useEffect(() => {
    const timer = setTimeout(fetchAcudientes, 500);
    return () => clearTimeout(timer);
  }, [fetchAcudientes, buscar]);

  // Buscar estudiantes para asociar
  useEffect(() => {
    const searchStudents = async () => {
      if (searchEstudiante.length < 2) {
        setEstudiantes([]);
        return;
      }

      const token = getAuthToken();
      console.log("🔍 Buscando estudiantes:", searchEstudiante);

      try {
        const res = await fetch(
          `${API_URL}/estudiantes?buscar=${searchEstudiante}&limit=10`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        console.log("📡 Respuesta estudiantes:", res.status);

        if (res.ok) {
          const result = await res.json();
          console.log("📦 Datos recibidos:", result);

          // Manejar tanto array directo como objeto paginado { data: [], meta: {} }
          const estudiantesArray = Array.isArray(result)
            ? result
            : result.data || [];
          console.log("✅ Estudiantes procesados:", estudiantesArray.length);
          setEstudiantes(estudiantesArray);
        } else {
          console.error("❌ Error en respuesta:", res.status);
          setEstudiantes([]);
        }
      } catch (err) {
        console.error("❌ Error buscando estudiantes:", err);
        setEstudiantes([]);
      }
    };

    const timer = setTimeout(searchStudents, 300);
    return () => clearTimeout(timer);
  }, [searchEstudiante]);

  const openCreate = () => {
    setFormData({
      primer_nombre: "",
      primer_apellido: "",
      tipo_documento: "CC",
      numero_documento: "",
      parentesco: "Padre",
      telefono: "",
      celular: "",
      correo_electronico: "",
      direccion: "",
      ocupacion: "",
      empresa: "",
    });
    setSelectedEstudiantes([]);
    setSearchEstudiante("");
    setEstudiantes([]);
    setShowModal(true);
  };

  const viewDetails = (ac: Acudiente) => {
    setSelectedAcudiente(ac);
    setShowDetalle(true);
  };

  const openEdit = (ac: Acudiente) => {
    setFormData({
      id: ac.id,
      primer_nombre: ac.primer_nombre,
      primer_apellido: ac.primer_apellido,
      segundo_nombre: ac.segundo_nombre || "",
      segundo_apellido: ac.segundo_apellido || "",
      tipo_documento: ac.tipo_documento,
      numero_documento: ac.numero_documento,
      parentesco: ac.parentesco || "Padre",
      telefono: ac.telefono || "",
      celular: ac.celular || "",
      correo_electronico: ac.correo_electronico || "",
      direccion: ac.direccion || "",
      ocupacion: ac.ocupacion || "",
      empresa: ac.empresa || "",
    });
    // Cargar estudiantes ya vinculados
    if (ac.estudiante_acudiente) {
      setSelectedEstudiantes(
        ac.estudiante_acudiente.map((ea) => ea.estudiante),
      );
    } else {
      setSelectedEstudiantes([]);
    }
    setSearchEstudiante("");
    setEstudiantes([]);
    setShowDetalle(false);
    setShowModal(true);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const agregarEstudiante = (est: Estudiante) => {
    if (!selectedEstudiantes.find((e) => e.id === est.id)) {
      setSelectedEstudiantes([...selectedEstudiantes, est]);
    }
    setSearchEstudiante("");
    setEstudiantes([]);
  };

  const quitarEstudiante = (estId: string) => {
    setSelectedEstudiantes(selectedEstudiantes.filter((e) => e.id !== estId));
  };

  const handleSubmit = async () => {
    // Validar que hay al menos un estudiante seleccionado
    if (selectedEstudiantes.length === 0) {
      alert(
        "Debe seleccionar al menos un estudiante para vincular al acudiente",
      );
      return;
    }

    setSaving(true);
    try {
      const token = getAuthToken();
      const isEditing = formData.id;

      // Crear o actualizar acudiente
      const res = await fetch(
        isEditing
          ? `${API_URL}/acudientes/${formData.id}`
          : `${API_URL}/acudientes`,
        {
          method: isEditing ? "PATCH" : "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        },
      );

      if (res.ok) {
        const data = await res.json();
        const acudienteId = isEditing ? formData.id : data.data?.id;

        // Vincular todos los estudiantes seleccionados
        // El primero es el principal, los demás no
        for (let i = 0; i < selectedEstudiantes.length; i++) {
          const est = selectedEstudiantes[i];
          await fetch(`${API_URL}/estudiantes/${est.id}/acudiente`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              estudiante_id: est.id,
              acudiente_id: acudienteId,
              es_principal: i === 0, // El primero es principal
            }),
          });
        }

        setShowModal(false);
        fetchAcudientes();
      } else {
        const error = await res.json();
        throw new Error(error.message || "Error al guardar");
      }
    } catch (err: any) {
      alert(err.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleSection}>
          <h1>Acudientes y Padres</h1>
          <p>Gestión de representantes legales y contacto familiar</p>
        </div>
        <button className={styles.addBtn} onClick={openCreate}>
          + Nuevo Acudiente
        </button>
      </header>

      <div className={styles.filters}>
        <input
          className={styles.searchInput}
          placeholder="Buscar por nombre o documento..."
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
        />
      </div>

      <div className={styles.tableContainer}>
        {loading ? (
          <div className={styles.loading}>Cargando datos...</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nombre Completo</th>
                <th>Documento</th>
                <th>Parentesco</th>
                <th>Estudiantes</th>
                <th>Contacto</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {acudientes.map((ac) => (
                <tr key={ac.id}>
                  <td className={styles.nameCell}>
                    {ac.primer_nombre} {ac.primer_apellido}
                  </td>
                  <td>
                    {ac.tipo_documento}: {ac.numero_documento}
                  </td>
                  <td className={styles.parentesco}>{ac.parentesco}</td>
                  <td>
                    {ac.estudiante_acudiente &&
                    ac.estudiante_acudiente.length > 0 ? (
                      ac.estudiante_acudiente.map((ea, idx) => (
                        <div key={idx} style={{ fontSize: "0.8rem" }}>
                          {ea.estudiante.primer_nombre}{" "}
                          {ea.estudiante.primer_apellido}
                          {ea.es_principal && (
                            <span
                              style={{ marginLeft: "4px", color: "#16a34a" }}
                            >
                              ★
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                        Sin asociación
                      </span>
                    )}
                  </td>
                  <td>
                    <div>{ac.celular}</div>
                    <div style={{ fontSize: "0.8rem", opacity: 0.6 }}>
                      {ac.correo_electronico}
                    </div>
                  </td>
                  <td className={styles.actions}>
                    <button
                      className={styles.viewBtn}
                      onClick={() => viewDetails(ac)}
                      title="Ver detalles"
                    >
                      👁️
                    </button>
                    <button
                      className={styles.editBtn2}
                      onClick={() => openEdit(ac)}
                      title="Editar"
                    >
                      ✏️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div
            className={styles.modal}
            style={{ maxWidth: "600px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>{formData.id ? "Editar Acudiente" : "Nuevo Acudiente"}</h2>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Primer Nombre *</label>
                <input
                  name="primer_nombre"
                  value={formData.primer_nombre || ""}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Primer Apellido *</label>
                <input
                  name="primer_apellido"
                  value={formData.primer_apellido || ""}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Tipo Documento *</label>
                <select
                  name="tipo_documento"
                  value={formData.tipo_documento || "CC"}
                  onChange={handleChange}
                >
                  <option value="CC">Cédula de Ciudadanía</option>
                  <option value="CE">Cédula de Extranjería</option>
                  <option value="NIT">NIT</option>
                  <option value="Pasaporte">Pasaporte</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Número Documento *</label>
                <input
                  name="numero_documento"
                  value={formData.numero_documento || ""}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Parentesco *</label>
                <select
                  name="parentesco"
                  value={formData.parentesco || "Padre"}
                  onChange={handleChange}
                >
                  <option value="Padre">Padre</option>
                  <option value="Madre">Madre</option>
                  <option value="Abuelo">Abuelo/a</option>
                  <option value="Tío">Tío/a</option>
                  <option value="Hermano">Hermano/a</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Teléfono</label>
                <input
                  name="telefono"
                  value={formData.telefono || ""}
                  onChange={handleChange}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Celular</label>
                <input
                  name="celular"
                  value={formData.celular || ""}
                  onChange={handleChange}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Correo Electrónico</label>
                <input
                  name="correo_electronico"
                  type="email"
                  value={formData.correo_electronico || ""}
                  onChange={handleChange}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Dirección</label>
                <input
                  name="direccion"
                  value={formData.direccion || ""}
                  onChange={handleChange}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Ocupación</label>
                <input
                  name="ocupacion"
                  value={formData.ocupacion || ""}
                  onChange={handleChange}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Empresa</label>
                <input
                  name="empresa"
                  value={formData.empresa || ""}
                  onChange={handleChange}
                />
              </div>

              {/* Asociación de estudiante */}
              <div
                className={styles.formGroup}
                style={{ gridColumn: "1 / -1" }}
              >
                <label>
                  Asociar Estudiante(s) *{" "}
                  <small>(obligatorio, puede agregar varios)</small>
                </label>
                <input
                  type="text"
                  placeholder="Buscar estudiante por nombre o documento..."
                  value={searchEstudiante}
                  onChange={(e) => setSearchEstudiante(e.target.value)}
                />
                {estudiantes.length > 0 ? (
                  <div className={styles.dropdown}>
                    {estudiantes.map((est) => (
                      <div
                        key={est.id}
                        className={styles.dropdownItem}
                        onClick={() => agregarEstudiante(est)}
                      >
                        {est.primer_nombre} {est.primer_apellido} -{" "}
                        {est.numero_documento}
                      </div>
                    ))}
                  </div>
                ) : searchEstudiante.length >= 2 ? (
                  <div className={styles.noResults}>
                    No se encontraron estudiantes con "{searchEstudiante}"
                  </div>
                ) : null}
                {selectedEstudiantes.length > 0 && (
                  <div className={styles.estudiantesSeleccionados}>
                    <label>
                      Estudiantes seleccionados ({selectedEstudiantes.length}):
                    </label>
                    <div className={styles.listaEstudiantes}>
                      {selectedEstudiantes.map((est, idx) => (
                        <div key={est.id} className={styles.estudianteTag}>
                          <span>
                            {idx === 0 && "⭐ "}
                            {est.primer_nombre} {est.primer_apellido}
                            {idx === 0 && " (Principal)"}
                          </span>
                          <button
                            type="button"
                            onClick={() => quitarEstudiante(est.id)}
                            className={styles.quitarBtn}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    <small className={styles.ayuda}>
                      El primer estudiante marcado con ⭐ será el principal.
                      Puede agregar varios estudiantes.
                    </small>
                  </div>
                )}
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button onClick={() => setShowModal(false)}>Cancelar</button>
              <button
                className={styles.saveBtn}
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetalle && selectedAcudiente && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowDetalle(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>Detalles del Acudiente</h2>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Nombre Completo</label>
                <div
                  style={{
                    padding: "0.5rem",
                    background: "#f8fafc",
                    borderRadius: "6px",
                  }}
                >
                  {selectedAcudiente.primer_nombre}{" "}
                  {selectedAcudiente.primer_apellido}
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Documento</label>
                <div
                  style={{
                    padding: "0.5rem",
                    background: "#f8fafc",
                    borderRadius: "6px",
                  }}
                >
                  {selectedAcudiente.numero_documento}
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Parentesco</label>
                <div
                  style={{
                    padding: "0.5rem",
                    background: "#f8fafc",
                    borderRadius: "6px",
                  }}
                >
                  {selectedAcudiente.parentesco}
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Celular</label>
                <div
                  style={{
                    padding: "0.5rem",
                    background: "#f8fafc",
                    borderRadius: "6px",
                  }}
                >
                  {selectedAcudiente.celular || "No registrado"}
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Correo Electrónico</label>
                <div
                  style={{
                    padding: "0.5rem",
                    background: "#f8fafc",
                    borderRadius: "6px",
                  }}
                >
                  {selectedAcudiente.correo_electronico || "No registrado"}
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button onClick={() => setShowDetalle(false)}>Cerrar</button>
              <button
                className={styles.editBtn}
                onClick={() => {
                  setShowDetalle(false);
                  openEdit(selectedAcudiente);
                }}
              >
                ✏️ Editar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
