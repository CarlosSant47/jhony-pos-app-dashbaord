import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { DayOpening, RouteTrackingPoint } from '../models/route-tracking';
import { Page } from '../models/ticket.models';

@Injectable({ providedIn: 'root' })
export class RouteTrackingService {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_BASE_URL)}/v1/day-openings`;

  /** Accepts either a plain array or a Spring Page. */
  listByDate(openedAt: string): Observable<DayOpening[]> {
    const params = new HttpParams().set('openedAt', openedAt);
    return this.http
      .get<DayOpening[] | Page<DayOpening>>(`${this.url}/period`, { params })
      .pipe(map(r => (Array.isArray(r) ? r : r.content)));
  }

  getTrackings(dayOpeningId: string): Observable<RouteTrackingPoint[]> {
    return this.http.get<RouteTrackingPoint[]>(`${this.url}/${dayOpeningId}/route-trackings`);
  }
}
