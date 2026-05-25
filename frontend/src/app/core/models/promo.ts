export type PromoTipo =
  | 'descuento_pct'
  | 'descuento_fijo'
  | 'servicio_gratis'
  | 'producto_gratis';

export interface Promo {
  id: string;
  titulo: string;
  descripcion: string | null;
  tipo: PromoTipo;
  valor: string | number;
  vigencia_inicio: string | null;
  vigencia_fin: string | null;
  min_visitas: number;
  min_puntos: number;
  max_canjes_por_usuario: number;
  codigo: string | null;
  imagen_url: string | null;
  destacada: boolean;
  activa: boolean;
  created_at: string;
  updated_at: string;
}

export interface PromoCliente extends Promo {
  elegible: boolean;
  canjes_usados: number;
  motivo_no_elegible: string | null;
}

export interface PromoCreate {
  titulo: string;
  descripcion?: string | null;
  tipo: PromoTipo;
  valor: number;
  vigencia_inicio?: string | null;
  vigencia_fin?: string | null;
  min_visitas?: number;
  min_puntos?: number;
  max_canjes_por_usuario?: number;
  codigo?: string | null;
  imagen_url?: string | null;
  destacada?: boolean;
  activa?: boolean;
}

export type PromoUpdate = Partial<PromoCreate>;
