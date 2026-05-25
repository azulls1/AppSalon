export interface Recompensa {
  id: string;
  nombre: string;
  descripcion: string | null;
  puntos_costo: number;
  foto_url: string | null;
  stock: number | null;
  activa: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecompensaCreate {
  nombre: string;
  descripcion?: string | null;
  puntos_costo: number;
  foto_url?: string | null;
  stock?: number | null;
  activa?: boolean;
}

export type RecompensaUpdate = Partial<RecompensaCreate>;

export interface Canje {
  id: string;
  usuario_id: string;
  recompensa_id: string;
  puntos_descontados: number;
  estado: 'pendiente' | 'entregado' | 'expirado' | 'cancelado';
  codigo: string;
  created_at: string;
  recompensa_nombre: string | null;
}

export interface CanjearResult {
  canje_id: string;
  codigo: string;
  puntos_restantes: number;
}
