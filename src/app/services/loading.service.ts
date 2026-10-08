import { Injectable, computed, signal } from '@angular/core';

/** Tracks in-flight HTTP requests; `loading` is true while at least one is pending. */
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly pending = signal(0);
  readonly loading = computed(() => this.pending() > 0);

  start(): void {
    this.pending.update(n => n + 1);
  }

  stop(): void {
    this.pending.update(n => Math.max(0, n - 1));
  }
}
