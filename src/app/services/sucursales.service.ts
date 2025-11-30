import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Sucursal } from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class SucursalesService {
  private apiUrl = 'http://localhost:8000/api/negocios';

  constructor(private http: HttpClient) { }

  /**
   * Obtener todas las sucursales
   */
  getAll(): Observable<Sucursal[]> {
    return this.http.get<Sucursal[]>(this.apiUrl);
  }

  /**
   * Obtener una sucursal por ID
   */
  getById(id: number): Observable<Sucursal> {
    return this.http.get<Sucursal>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crear una nueva sucursal
   */
  create(sucursal: Partial<Sucursal>): Observable<Sucursal> {
    return this.http.post<Sucursal>(this.apiUrl, sucursal);
  }

  /**
   * Actualizar una sucursal
   */
  update(id: number, sucursal: Partial<Sucursal>): Observable<Sucursal> {
    return this.http.put<Sucursal>(`${this.apiUrl}/${id}`, sucursal);
  }

  /**
   * Eliminar una sucursal
   */
  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}
