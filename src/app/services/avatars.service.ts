import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { AvatarRecord } from '../models/avatars';
import { Page } from '../models/ticket.models';

/** Avatars are always requested in a single fixed-size page to avoid loading too many images. */
export const AVATARS_PAGE_SIZE = 25;

@Injectable({ providedIn: 'root' })
export class AvatarsService {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_BASE_URL)}/v1/avatars`;

  list(): Observable<Page<AvatarRecord>> {
    const params = new HttpParams().set('page', 0).set('size', AVATARS_PAGE_SIZE);
    return this.http.get<Page<AvatarRecord>>(this.url, { params });
  }

  /** Multipart upload; the form field is named `file`. */
  upload(file: File): Observable<AvatarRecord> {
    const body = new FormData();
    body.append('file', file, file.name);
    return this.http.post<AvatarRecord>(this.url, body);
  }
}
