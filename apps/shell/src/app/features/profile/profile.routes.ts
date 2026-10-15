import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { ProfileService } from '../../core/profile.service';
import type { ProfileEditPage } from './profile-edit.page';
export const profileRoutes: Routes = [
  {
    path: 'edit',
    resolve: { profileMedia: () => inject(ProfileService).reload() },
    loadComponent: () => import('./profile-edit.page').then((module) => module.ProfileEditPage),
    canDeactivate: [(component: ProfileEditPage) => component.canLeave()],
  },
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./profile.page').then((module) => module.ProfilePage),
  },
];
