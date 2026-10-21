import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./features/welcome/welcome.page').then((m) => m.WelcomePage),
  },
  { path: 'auth', loadChildren: () => import('./features/auth/auth.routes').then((m) => m.authRoutes) },
  {
    path: '',
    canActivateChild: [authGuard],
    loadComponent: () =>
      import('./features/social/social-layout.component').then((m) => m.SocialLayoutComponent),
    children: [
      {
        path: 'settings/account-status',
        canDeactivate: [
          (component: import('./features/social/account-status.page').AccountStatusPage) =>
            component.canLeave(),
        ],
        loadComponent: () => import('./features/social/account-status.page').then((m) => m.AccountStatusPage),
      },
      {
        path: 'people/:id',
        loadComponent: () =>
          import('./features/profile/public-profile.page').then((m) => m.PublicProfilePage),
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/social/settings.page').then((m) => m.SettingsPage),
      },
      {
        path: 'settings/archive',
        data: { collection: 'archive' },
        loadComponent: () =>
          import('./features/social/post-collection.page').then((m) => m.PostCollectionPage),
      },
      {
        path: 'settings/bookmarks',
        data: { collection: 'bookmarks' },
        loadComponent: () =>
          import('./features/social/post-collection.page').then((m) => m.PostCollectionPage),
      },
      {
        path: 'settings/blocked',
        loadComponent: () => import('./features/social/blocked.page').then((m) => m.BlockedPage),
      },
      {
        path: 'search',
        loadComponent: () => import('./features/social/search.page').then((m) => m.SearchPage),
      },
      {
        path: 'posts/:id',
        canDeactivate: [
          (component: import('./features/posts/post-thread.page').PostThreadPage) => component.canLeave(),
        ],
        loadComponent: () => import('./features/posts/post-thread.page').then((m) => m.PostThreadPage),
      },
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
        loadChildren: () =>
          import('./features/profile/profile.routes').then((module) => module.profileRoutes),
      },
    ],
  },
  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found.page').then((m) => m.NotFoundPage),
  },
];
