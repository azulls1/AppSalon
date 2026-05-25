import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Cita, CitaAdmin, CitaCreate, Disponibilidad } from '../models/cita';
import { Profile, ProfileUpdate } from '../models/profile';
import { Servicio, ServicioCreate, ServicioUpdate } from '../models/servicio';
import { Resena, ResenaCreate, Staff } from '../models/staff';
import { Galeria, GaleriaCreate, GaleriaUpdate } from '../models/galeria';
import { Canje, CanjearResult, Recompensa, RecompensaCreate, RecompensaUpdate } from '../models/recompensa';
import { Promo, PromoCliente, PromoCreate, PromoUpdate } from '../models/promo';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  // ---------- profile
  getMe(): Observable<Profile> {
    return this.http.get<Profile>(`${this.base}/profile/me`);
  }
  updateMe(payload: ProfileUpdate): Observable<Profile> {
    return this.http.put<Profile>(`${this.base}/profile/me`, payload);
  }

  // ---------- servicios
  listServicios(): Observable<Servicio[]> {
    return this.http.get<Servicio[]>(`${this.base}/servicios`);
  }
  createServicio(payload: ServicioCreate): Observable<Servicio> {
    return this.http.post<Servicio>(`${this.base}/servicios`, payload);
  }
  updateServicio(id: string, payload: ServicioUpdate): Observable<Servicio> {
    return this.http.put<Servicio>(`${this.base}/servicios/${id}`, payload);
  }
  deleteServicio(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/servicios/${id}`);
  }

  // ---------- staff
  listStaff(): Observable<Staff[]> {
    return this.http.get<Staff[]>(`${this.base}/staff`);
  }
  createStaff(payload: Partial<Staff>): Observable<Staff> {
    return this.http.post<Staff>(`${this.base}/staff`, payload);
  }
  updateStaff(id: string, payload: Partial<Staff>): Observable<Staff> {
    return this.http.put<Staff>(`${this.base}/staff/${id}`, payload);
  }

  // ---------- citas (cliente)
  listMyCitas(): Observable<Cita[]> {
    return this.http.get<Cita[]>(`${this.base}/citas`);
  }
  createCita(payload: CitaCreate): Observable<Cita> {
    return this.http.post<Cita>(`${this.base}/citas`, payload);
  }
  cancelCita(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/citas/${id}`);
  }
  getDisponibilidad(fecha: string): Observable<Disponibilidad> {
    return this.http.get<Disponibilidad>(`${this.base}/citas/disponibilidad/${fecha}`);
  }

  // ---------- reseñas
  listResenas(staffId?: string): Observable<Resena[]> {
    let params = new HttpParams();
    if (staffId) params = params.set('staff_id', staffId);
    return this.http.get<Resena[]>(`${this.base}/resenas`, { params });
  }
  createResena(payload: ResenaCreate): Observable<Resena> {
    return this.http.post<Resena>(`${this.base}/resenas`, payload);
  }

  // ---------- staff (admin)
  deleteStaff(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/staff/${id}`);
  }

  // ---------- galería
  listGaleria(): Observable<Galeria[]> {
    return this.http.get<Galeria[]>(`${this.base}/galeria`);
  }
  createGaleria(payload: GaleriaCreate): Observable<Galeria> {
    return this.http.post<Galeria>(`${this.base}/galeria`, payload);
  }
  updateGaleria(id: string, payload: GaleriaUpdate): Observable<Galeria> {
    return this.http.put<Galeria>(`${this.base}/galeria/${id}`, payload);
  }
  deleteGaleria(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/galeria/${id}`);
  }

  // ---------- recompensas
  listRecompensas(): Observable<Recompensa[]> {
    return this.http.get<Recompensa[]>(`${this.base}/recompensas`);
  }
  createRecompensa(payload: RecompensaCreate): Observable<Recompensa> {
    return this.http.post<Recompensa>(`${this.base}/recompensas`, payload);
  }
  updateRecompensa(id: string, payload: RecompensaUpdate): Observable<Recompensa> {
    return this.http.put<Recompensa>(`${this.base}/recompensas/${id}`, payload);
  }
  deleteRecompensa(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/recompensas/${id}`);
  }
  canjearRecompensa(id: string): Observable<CanjearResult> {
    return this.http.post<CanjearResult>(`${this.base}/recompensas/${id}/canjear`, {});
  }
  misCanjes(): Observable<Canje[]> {
    return this.http.get<Canje[]>(`${this.base}/recompensas/canjes/mios`);
  }

  // ---------- promos
  listPromos(): Observable<PromoCliente[]> {
    return this.http.get<PromoCliente[]>(`${this.base}/promos`);
  }
  listPromosAdmin(): Observable<Promo[]> {
    return this.http.get<Promo[]>(`${this.base}/promos/admin`);
  }
  createPromo(payload: PromoCreate): Observable<Promo> {
    return this.http.post<Promo>(`${this.base}/promos`, payload);
  }
  updatePromo(id: string, payload: PromoUpdate): Observable<Promo> {
    return this.http.put<Promo>(`${this.base}/promos/${id}`, payload);
  }
  deletePromo(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/promos/${id}`);
  }
  canjearPromo(id: string): Observable<{ canje_id: string; promo_id: string }> {
    return this.http.post<{ canje_id: string; promo_id: string }>(
      `${this.base}/promos/${id}/canjear`, {});
  }

  // ---------- uploads
  uploadImage(file: File): Observable<{ url: string; path: string }> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<{ url: string; path: string }>(`${this.base}/uploads/image`, fd);
  }

  // ---------- admin
  adminCitasByDate(fecha: string): Observable<CitaAdmin[]> {
    return this.http.get<CitaAdmin[]>(`${this.base}/admin/citas`, { params: { fecha } });
  }
  completarCita(id: string): Observable<{ cita_id: string; puntos_otorgados: number }> {
    return this.http.post<{ cita_id: string; puntos_otorgados: number }>(
      `${this.base}/admin/citas/${id}/completar`, {});
  }
}
