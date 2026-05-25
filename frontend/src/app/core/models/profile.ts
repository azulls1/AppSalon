export interface Profile {
  id: string;
  nombre: string;
  apellido: string;
  telefono: string | null;
  is_admin: boolean;
  puntos: number;
  created_at: string;
  updated_at: string;
}

export type ProfileUpdate = Pick<Profile, 'nombre' | 'apellido' | 'telefono'>;
