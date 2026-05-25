export interface Servicio {
  id: string;
  nombre: string;
  precio: number | string;
  duracion_min: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServicioCreate {
  nombre: string;
  precio: number;
  duracion_min?: number;
  activo?: boolean;
}

export type ServicioUpdate = Partial<ServicioCreate>;
