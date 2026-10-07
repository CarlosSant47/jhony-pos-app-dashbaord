import { Routes } from '@angular/router';

export const routes: Routes = [

    {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
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
                loadComponent: () => import('./components/screens/tickets-editor/tickets-editor.component').then(m => m.TicketsEditorComponent),
                data: { title: 'Tickets Editor' }
            }
        ]
    },
     { path: '**', redirectTo: 'dashboard' }
];
