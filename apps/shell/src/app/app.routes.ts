import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/welcome/welcome.page').then((m) => m.WelcomePage) },
  { path: 'auth', loadChildren: () => import('./features/auth/auth.routes').then((m) => m.authRoutes) },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.page').then((m) => m.DashboardPage),
  },
  {
    path: 'compose',
    canActivate: [authGuard],
    canDeactivate: [
      (component: import('./features/posts/post-compose.page').PostComposePage) => component.canLeave(),
    ],
    loadComponent: () =>
      import('./features/posts/post-compose.page').then((module) => module.PostComposePage),
  },
  {
    path: 'profile',
    canActivateChild: [authGuard],
    loadChildren: () => import('./features/profile/profile.routes').then((module) => module.profileRoutes),
  },
  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found.page').then((m) => m.NotFoundPage),
  },
];
