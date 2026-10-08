import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { ColorModeService } from '@coreui/angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { IconSetService } from '@coreui/icons-angular';
import { Title } from '@angular/platform-browser';
import { delay, filter, map, tap } from 'rxjs';
import { LoadingOverlayComponent } from './components/shared/loading-overlay/loading-overlay.component';
import { iconSubset } from './utils/icons-subset';

@Component({
  selector: 'app-root',
  template: '<router-outlet /><app-loading-overlay />',
  imports: [RouterOutlet, LoadingOverlayComponent]
})
export class App implements OnInit {

  title = 'Jhony App Dashbaord';

  readonly #destroyRef: DestroyRef = inject(DestroyRef);
  readonly #activatedRoute: ActivatedRoute = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #titleService = inject(Title);

  readonly #colorModeService = inject(ColorModeService);
  readonly #iconSetService = inject(IconSetService);

  constructor() {
    this.#titleService.setTitle(this.title);
    // iconSet singleton
    this.#iconSetService.icons = { ...iconSubset };
    this.#colorModeService.localStorageItemName.set('coreui-free-angular-admin-template-theme-default');
    this.#colorModeService.eventName.set('ColorSchemeChange');
  }

  ngOnInit(): void {

    this.#router.events.pipe(
      takeUntilDestroyed(this.#destroyRef)
    ).subscribe((evt) => {
      if (!(evt instanceof NavigationEnd)) {
        return;
      }
    });


    this.#activatedRoute.queryParams
      .pipe(
        delay(1),
        map(params => <string>params['theme']?.match(/^[A-Za-z0-9\s]+/)?.[0]),
        filter(theme => ['dark', 'light', 'auto'].includes(theme)),
        tap(theme => {
          this.#colorModeService.colorMode.set(theme);
        }),
        takeUntilDestroyed(this.#destroyRef)
      )
      .subscribe();
    
    
  }


}

