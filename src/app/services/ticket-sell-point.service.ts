import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { API_BASE_URL, API_ENDPOINTS } from "../config/api.config";
import { Page, PageRequest, TicketTemplateSellPoint, TicketTemplateSellPointPayload } from "../models/ticket.models";
import { Observable } from "rxjs";
import { HttpParams } from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class TicketSellPointService {

    private readonly http = inject(HttpClient);
    private readonly url = `${inject(API_BASE_URL)}${API_ENDPOINTS.ticketTemplateSellPoint}`;

    list(request: PageRequest): Observable<Page<TicketTemplateSellPoint>> {
        let params = new HttpParams()
            .set('page', request.page)
            .set('size', request.size)
            .set('sort', request.sort);
        return this.http.get<Page<TicketTemplateSellPoint>>(this.url, { params });
    }

    get(id: string): Observable<TicketTemplateSellPoint> {
        return this.http.get<TicketTemplateSellPoint>(`${this.url}/${id}`);
    }

    create(payload: TicketTemplateSellPointPayload): Observable<TicketTemplateSellPoint> {
        return this.http.post<TicketTemplateSellPoint>(this.url, payload);
    }

    /** The id travels in the body, not in the URL. */
    update(item: Pick<TicketTemplateSellPoint, 'id'> & TicketTemplateSellPointPayload): Observable<TicketTemplateSellPoint> {
        return this.http.put<TicketTemplateSellPoint>(this.url + `/${item.id}`, item);
    }
}