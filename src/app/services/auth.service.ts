import { Injectable, signal } from '@angular/core';

/** Route the user is sent to when the session is missing or not allowed (401 / 403). */
export const LOGIN_ROUTE = '/login';

const TOKEN_KEY = 'auth-token';

/** Minimal token holder. Replace with the real login flow when it exists. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  readonly token = this._token.asReadonly();

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    this._token.set(token);
  }

  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
    this._token.set(null);
  }
}
