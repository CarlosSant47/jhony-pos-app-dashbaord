
import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { NgScrollbar } from 'ngx-scrollbar';
import { NgScrollHoverVisibility } from 'ngx-scrollbar/addons';

import { IconDirective } from '@coreui/icons-angular';
import {
  ContainerComponent,
  INavData,
  ShadowOnScrollDirective,
  SidebarBrandComponent,
  SidebarComponent,
  SidebarFooterComponent,
  SidebarHeaderComponent,
  SidebarNavComponent,
  SidebarToggleDirective,
  SidebarTogglerDirective
} from '@coreui/angular';
import { MainHeaderLayoutComponent } from './header/main.header-layout.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './main-layout.component.html',
  imports: [
    SidebarComponent,
    SidebarHeaderComponent,
    SidebarBrandComponent,
    SidebarNavComponent,
    SidebarFooterComponent,
    SidebarToggleDirective,
    SidebarTogglerDirective,
    ContainerComponent,
    IconDirective,
    NgScrollbar,
    NgScrollHoverVisibility,
    RouterOutlet,
    RouterLink,
    ShadowOnScrollDirective,
    MainHeaderLayoutComponent
  ]
})
export class MainLayoutComponent implements OnInit {

  public navItems: INavData[] = [];

  private loadNavItems(): void {
    this.navItems = [
      {
        name: 'Dashboard',
        url: '/dashboard',
        icon: 'icon-speedometer'
      },

      {
        title: true,
        name: 'App Management'
      },
      {
        name: 'Parameters',
        url: '/parameters',
        icon: 'icon-settings'
      },
      {
        name: "Tickets Editor",
        url: '/tickets-editor',
        icon: 'icon-pencil'
      },
      {
        name: 'Simulator Application',
        url: '/simulator',
        icon: 'icon-calculator'
      },

      {
        title: true,
        name: 'Admin'
      },


      {
        name: 'Settings',
        url: '/settings',
        icon: 'icon-settings'
      }
    ];
  }

  ngOnInit(): void {
    this.loadNavItems();
  }


}
