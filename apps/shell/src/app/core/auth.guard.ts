import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
/** Navigation convenience; data authorization belongs in RLS/the server. */
export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.ready;
  if (auth.recovery()) return router.createUrlTree(['/auth/update-password']);
  return (await auth.hasVerifiedSession()) ? true : router.createUrlTree(['/auth/login']);
};

/** Confirmed sessions skip sign-in/sign-up, while recovery links keep their own flow. */
export const signedInGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.ready;
  if (auth.recovery()) return router.createUrlTree(['/auth/update-password']);
  return (await auth.hasVerifiedSession()) ? router.createUrlTree(['/dashboard']) : true;
};
