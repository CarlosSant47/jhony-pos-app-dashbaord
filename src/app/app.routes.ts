import { Routes } from '@angular/router';

export const routes: Routes = [

    {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
    },
    {
        path: 'login',
        loadComponent: () => import('./components/screens/login/login.component').then(m => m.LoginComponent),
        data: { title: 'Login' }
    },
    {
        path: '', loadComponent: () => import('./components/main/main-layout.component').then(m => m.MainLayoutComponent),
        data: { title: 'Home' },
        children: [
            {
                path: 'dashboard',
                loadComponent: () => import('./components/screens/dashboard/dashboard.component').then(m => m.DashboardComponent),
                data: { title: 'Dashboard' }
            },
            {
                path: 'tickets-editor',
                loadComponent: () => import('./components/screens/tickets-list/tickets-list.component').then(m => m.TicketsListComponent),
                data: { title: 'Tickets' }
            },
            {
                path: 'route-tracking',
                loadComponent: () => import('./components/screens/route-tracking/route-tracking.component').then(m => m.RouteTrackingComponent),
                data: { title: 'Route Tracking' }
            },
            {
                path: 'parameters',
                loadComponent: () => import('./components/screens/parameters/parameters.component').then(m => m.ParametersComponent),
                data: { title: 'Parameters' }
            },
            {
                path: 'settings',
                loadComponent: () => import('./components/screens/settings/settings.component').then(m => m.SettingsComponent),
                data: { title: 'Settings' }
            }
        ]
    },
     { path: '**', redirectTo: 'dashboard' }
];
