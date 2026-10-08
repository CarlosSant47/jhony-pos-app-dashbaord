import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withEnabledBlockingInitialNavigation, withHashLocation, withInMemoryScrolling, withRouterConfig, withViewTransitions } from '@angular/router';
import { IconSetService } from '@coreui/icons-angular';

import { apiInterceptor } from './interceptors/api.interceptor';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTicketsService, TicketsService } from './services/tickets.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withRouterConfig({
        onSameUrlNavigation: 'reload',
      }),
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled',
      }),
      withEnabledBlockingInitialNavigation(),
      withViewTransitions(),
      withHashLocation(),
    ),
    IconSetService,
    provideHttpClient(withInterceptors([apiInterceptor])),
    // Swap for InMemoryTicketsService to work without the backend
    { provide: TicketsService, useClass: HttpTicketsService },
  ],
};
