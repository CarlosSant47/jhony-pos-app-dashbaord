import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  AvatarComponent,
  BadgeComponent,
  BreadcrumbRouterComponent,
  ColorModeService,
  ContainerComponent,
  DropdownComponent,
  DropdownDividerDirective,
  DropdownHeaderDirective,
  DropdownItemDirective,
  DropdownMenuDirective,
  DropdownToggleDirective,
  FormControlDirective,
  HeaderComponent,
  HeaderNavComponent,
  HeaderTogglerDirective,
  ListGroupDirective,
  ListGroupItemDirective,
  ModalBodyComponent,
  ModalComponent,
  ModalHeaderComponent,
  ModalTitleDirective,
  NavLinkDirective,
  SearchButtonComponent,
  SidebarToggleDirective
} from '@coreui/angular';

import { IconDirective } from '@coreui/icons-angular';

@Component({
  selector: 'app-default-header',
  templateUrl: './main.header-layout.component.html',
  imports: [
    AvatarComponent,
    BadgeComponent,
    BreadcrumbRouterComponent,
    ContainerComponent,
    DropdownComponent,
    DropdownDividerDirective,
    DropdownHeaderDirective,
    DropdownItemDirective,
    DropdownMenuDirective,
    DropdownToggleDirective,
    FormControlDirective,
    HeaderNavComponent,
    HeaderTogglerDirective,
    IconDirective,
    ListGroupDirective,
    ListGroupItemDirective,
    ModalBodyComponent,
    ModalComponent,
    ModalHeaderComponent,
    ModalTitleDirective,
    NgTemplateOutlet,
    RouterLink,
    SearchButtonComponent,
    SidebarToggleDirective
  ]
})
export class MainHeaderLayoutComponent extends HeaderComponent {

  readonly #colorModeService = inject(ColorModeService);
  readonly colorMode = this.#colorModeService.colorMode;

  readonly colorModes = [
    { name: 'light', text: 'Light', icon: 'cilSun' },
    { name: 'dark', text: 'Dark', icon: 'cilMoon' },
    { name: 'auto', text: 'Auto', icon: 'cilContrast' }
  ];

  readonly icons = computed(() => {
    const currentMode = this.colorMode();
    return this.colorModes.find(mode => mode.name === currentMode)?.icon ?? 'cilSun';
  });

  constructor() {
    super();
  }

  readonly sidebarId = input('sidebar1');

  readonly searchVisible = signal(false);

  
}