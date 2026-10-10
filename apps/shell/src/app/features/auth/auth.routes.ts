import { Routes } from '@angular/router';
export const authRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    data: { mode: 'login' },
    loadComponent: () => import('./auth.page').then((m) => m.AuthPage),
  },
  {
    path: 'register',
    data: { mode: 'register' },
    loadComponent: () => import('./auth.page').then((m) => m.AuthPage),
  },
  {
    path: 'forgot-password',
    data: { mode: 'reset' },
    loadComponent: () => import('./auth.page').then((m) => m.AuthPage),
  },
  {
    path: 'update-password',
    loadComponent: () => import('./update-password/update-password.page').then((m) => m.UpdatePasswordPage),
  },
];
