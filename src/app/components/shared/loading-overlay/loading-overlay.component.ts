import { Component, inject } from '@angular/core';
import { SpinnerComponent } from '@coreui/angular';
import { LoadingService } from '../../../services/loading.service';

/** Full-screen opaque loader driven by LoadingService. Place once in the root component. */
@Component({
  selector: 'app-loading-overlay',
  imports: [SpinnerComponent],
  template: `
    @if (loading.loading()) {
      <div class="overlay" role="status" aria-live="polite" aria-label="Cargando">
        <c-spinner color="primary" />
      </div>
    }
  `,
  styles: `
    .overlay {
      position: fixed;
      inset: 0;
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
    /* Updated for glass effect */
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px); /* For better cross-browser support */
    }
  `
})
export class LoadingOverlayComponent {
  readonly loading = inject(LoadingService);
}
