export interface Galeria {
  id: string;
  servicio_id: string | null;
  titulo: string;
  descripcion: string | null;
  foto_antes_url: string;
  foto_despues_url: string;
  activa: boolean;
  created_at: string;
  updated_at: string;
}

export interface GaleriaCreate {
  titulo: string;
  descripcion?: string | null;
  foto_antes_url: string;
  foto_despues_url: string;
  servicio_id?: string | null;
  activa?: boolean;
}

export type GaleriaUpdate = Partial<GaleriaCreate>;
