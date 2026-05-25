export type CitaEstado = 'pendiente' | 'confirmada' | 'cancelada' | 'completada';

export interface CitaServicioItem {
  servicio_id: string;
  nombre: string;
  precio_snapshot: number | string;
}

export interface Cita {
  id: string;
  usuario_id: string;
  fecha: string;       // YYYY-MM-DD
  hora: string;        // HH:mm:ss
  estado: CitaEstado;
  notas: string | null;
  staff_id: string | null;
  staff_nombre: string | null;
  created_at: string;
  servicios: CitaServicioItem[];
  total: number | string;
}

export interface CitaAdmin extends Cita {
  cliente_nombre: string;
  cliente_apellido: string;
  cliente_email: string | null;
  cliente_telefono: string | null;
}

export interface CitaCreate {
  fecha: string;
  hora: string;
  servicio_ids: string[];
  staff_id?: string | null;
  notas?: string | null;
}

export interface Disponibilidad {
  fecha: string;
  ocupados: string[];  // ["10:00", "11:30", ...]
}
