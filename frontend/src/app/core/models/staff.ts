export interface Staff {
  id: string;
  nombre: string;
  apellido: string;
  especialidad: string;
  bio: string | null;
  foto_url: string | null;
  instagram: string | null;
  activo: boolean;
  rating_promedio: number | null;
  total_resenas: number;
  created_at: string;
  updated_at: string;
}

export interface Resena {
  id: string;
  cita_id: string;
  usuario_id: string;
  staff_id: string | null;
  rating: number;
  comentario: string | null;
  created_at: string;
  cliente_nombre: string | null;
}

export interface ResenaCreate {
  cita_id: string;
  rating: number;
  comentario?: string | null;
}
