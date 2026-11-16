import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api.config';
import { SellPoint } from '../models/ticket.models';

@Injectable({
  providedIn: 'root'
})
export class SellPointsService {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_BASE_URL)}${API_ENDPOINTS.sellPoint}`;

  list(): Observable<SellPoint[]> {
    return this.http.get<SellPoint[]>(this.url);
  }
}
