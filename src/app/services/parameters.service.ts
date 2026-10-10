import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
  ApplicationPayload,
  ApplicationRecord,
  DataTypeRecord,
  ParameterPayload,
  ParameterRecord
} from '../models/parameters';
import { Page } from '../models/ticket.models';

export interface SimplePageRequest {
  page: number;
  size: number;
  /** Spring format "field,dir"; omitted when empty. */
  sort?: string;
}

const toParams = (r: SimplePageRequest): HttpParams => {
  let params = new HttpParams().set('page', r.page).set('size', r.size);
  if (r.sort) params = params.set('sort', r.sort);
  return params;
};

@Injectable({ providedIn: 'root' })
export class ApplicationsService {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_BASE_URL)}/v1/applications`;

  list(request: SimplePageRequest): Observable<Page<ApplicationRecord>> {
    return this.http.get<Page<ApplicationRecord>>(this.url, { params: toParams(request) });
  }

  // Not used by the UI yet; kept ready for when applications can be managed.
  create(payload: ApplicationPayload): Observable<ApplicationRecord> {
    return this.http.post<ApplicationRecord>(this.url, payload);
  }

  update(id: string, payload: ApplicationPayload): Observable<ApplicationRecord> {
    return this.http.put<ApplicationRecord>(`${this.url}/${id}`, payload);
  }
}

@Injectable({ providedIn: 'root' })
export class ParametersService {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(API_BASE_URL)}/v1/parameters`;
  private readonly baseAplication = `${inject(API_BASE_URL)}/v1/applications`;




  list(applicationId: string, request: SimplePageRequest): Observable<Page<ParameterRecord>> {
    return this.http.get<Page<ParameterRecord>>(`${this.baseAplication}/${applicationId}/parameters`, { params: toParams(request) });
  }

  create(payload: ParameterPayload): Observable<ParameterRecord> {
    return this.http.post<ParameterRecord>(this.base, payload);
  }

  update(id: string, payload: ParameterPayload): Observable<ParameterRecord> {
    return this.http.put<ParameterRecord>(`${this.base}/${id}`, payload);
  }

  delete(applicationId: string, id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class DataTypesService {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_BASE_URL)}/v1/data-types`;

  /** Accepts either a plain array or a Spring Page. */
  list(): Observable<DataTypeRecord[]> {
    return this.http
      .get<DataTypeRecord[] | Page<DataTypeRecord>>(this.url)
      .pipe(map(r => (Array.isArray(r) ? r : r.content)));
  }
}
