export interface Sede {
  id: string;
  nombre: string;
  direccion?: string;
  telefono?: string;
  institucion_id?: string;
}

export interface Institucion {
  id: string;
  nombre: string;
  nit?: string;
}

export interface AnioLectivo {
  id: string;
  anio: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  activo: boolean;
}

export interface Periodo {
  id: string;
  nombre: string;
  numero: number;
  porcentaje_peso: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  activo: boolean;
  anio_lectivo_id: string;
}

export interface Area {
  id: string;
  nombre: string;
  asignatura?: Asignatura[];
}

export interface Asignatura {
  id: string;
  nombre: string;
  area_id: string;
}

export interface Nivel {
  id: string;
  nombre: string;
}

export interface Grado {
  id: string;
  nombre: string;
  codigo?: string;
  orden: number;
  nivel_id: string;
  nivel?: { nombre: string };
}

export interface TipoActividad {
  id: string;
  nombre: string;
}

export type TabId =
  | "sedes"
  | "anios"
  | "periodos"
  | "areas"
  | "niveles"
  | "grados"
  | "tipos-actividad";

export type ModalType =
  | "sede"
  | "anio"
  | "periodo"
  | "area"
  | "asignatura"
  | "nivel"
  | "grado"
  | "tipo-actividad";
