import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { createDefaultTemplate, Page, PageRequest, TicketPayload, TicketRecord } from '../models/ticket.models';

/**
 * Contract for the tickets backend (Spring Boot).
 * Replace the provider in app.config.ts with an HttpClient implementation, e.g.:
 *   GET    /v1/ticket-templates?page=0&size=10&sort=name,asc&search=...  -> Page<TicketRecord>
 *   GET    /v1/ticket-templates/{id}   POST /v1/ticket-templates
 *   PUT    /v1/ticket-templates/{id}   DELETE /v1/ticket-templates/{id}
 */
export abstract class TicketsService {
  abstract list(request: PageRequest): Observable<Page<TicketRecord>>;
  abstract get(id: number): Observable<TicketRecord>;
  abstract create(payload: TicketPayload): Observable<TicketRecord>;
  abstract update(id: number, payload: TicketPayload): Observable<TicketRecord>;
  abstract delete(id: number): Observable<void>;
}

/** HttpClient implementation against the Spring Boot API. */
@Injectable()
export class HttpTicketsService extends TicketsService {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_BASE_URL)}/v1/ticket-templates`;

  list(request: PageRequest): Observable<Page<TicketRecord>> {
    let params = new HttpParams()
      .set('page', request.page)
      .set('size', request.size)
      .set('sort', request.sort);
    if (request.search.trim()) params = params.set('search', request.search.trim());
    return this.http.get<Page<TicketRecord>>(this.url, { params });
  }

  get(id: number): Observable<TicketRecord> {
    return this.http.get<TicketRecord>(`${this.url}/${id}`);
  }

  create(payload: TicketPayload): Observable<TicketRecord> {
    return this.http.post<TicketRecord>(this.url, payload);
  }

  update(id: number, payload: TicketPayload): Observable<TicketRecord> {
    return this.http.put<TicketRecord>(`${this.url}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}

/** Temporary in-memory implementation so the module works before the backend exists. */
@Injectable()
export class InMemoryTicketsService extends TicketsService {
  private nextId = 1;
  private records: TicketRecord[] = this.seed();

  list(request: PageRequest): Observable<Page<TicketRecord>> {
    const term = request.search.trim().toLowerCase();
    const [field, dir] = request.sort.split(',');
    const filtered = this.records.filter(
      r => !term || r.name.toLowerCase().includes(term) || r.description.toLowerCase().includes(term)
    );
    const sorted = [...filtered].sort((a, b) => {
      const x = (a as any)[field] ?? '';
      const y = (b as any)[field] ?? '';
      const result = x < y ? -1 : x > y ? 1 : 0;
      return dir === 'desc' ? -result : result;
    });
    const totalPages = Math.max(1, Math.ceil(sorted.length / request.size));
    const number = Math.min(request.page, totalPages - 1);
    const content = sorted.slice(number * request.size, (number + 1) * request.size);
    return of({
      content: structuredClone(content),
      totalElements: sorted.length,
      totalPages,
      number,
      size: request.size,
      first: number === 0,
      last: number >= totalPages - 1
    }).pipe(delay(250));
  }

  get(id: number): Observable<TicketRecord> {
    const record = this.records.find(r => r.id === id);
    return record ? of(structuredClone(record)).pipe(delay(150)) : throwError(() => new Error('Ticket no encontrado'));
  }

  create(payload: TicketPayload): Observable<TicketRecord> {
    const now = new Date().toISOString();
    const record: TicketRecord = { ...structuredClone(payload), id: this.nextId++, createdAt: now, updatedAt: now };
    this.records.unshift(record);
    return of(structuredClone(record)).pipe(delay(250));
  }

  update(id: number, payload: TicketPayload): Observable<TicketRecord> {
    const index = this.records.findIndex(r => r.id === id);
    if (index < 0) return throwError(() => new Error('Ticket no encontrado'));
    this.records[index] = { ...this.records[index], ...structuredClone(payload), updatedAt: new Date().toISOString() };
    return of(structuredClone(this.records[index])).pipe(delay(250));
  }

  delete(id: number): Observable<void> {
    this.records = this.records.filter(r => r.id !== id);
    return of(undefined).pipe(delay(200));
  }

  private seed(): TicketRecord[] {
    const names = ['Venta mostrador', 'Venta ruta', 'Pedido a domicilio', 'Corte de caja', 'Devolución', 'Cotización'];
    return Array.from({ length: 23 }, (_, i) => {
      const date = new Date(Date.now() - i * 86_400_000).toISOString();
      return {
        id: this.nextId++,
        name: `${names[i % names.length]} ${Math.floor(i / names.length) + 1}`,
        description: i % 3 === 0 ? 'Formato de 58 mm' : 'Formato de 80 mm',
        active: i % 4 !== 3,
        createdAt: date,
        updatedAt: date,
        template: createDefaultTemplate()
      };
    });
  }
}
