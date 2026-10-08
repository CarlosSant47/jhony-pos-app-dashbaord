import { InjectionToken } from '@angular/core';

/**
 * Base path of the Spring Boot API. Relative so that `ng serve` forwards it through proxy.conf.json
 * (avoids CORS); in production the web server / gateway must route /api/admin to the backend.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => '/api/admin'
});
