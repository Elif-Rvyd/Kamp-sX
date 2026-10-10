import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
/** Navigation convenience; data authorization belongs in RLS/the server. */
export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.ready;
  return (await auth.hasVerifiedSession()) ? true : router.createUrlTree(['/auth/login']);
};
