import { DOCUMENT } from '@angular/common';
import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
export type AuthMode = 'login' | 'register' | 'reset';
@Injectable({ providedIn: 'root' })
export class AuthUiService {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  readonly mode = signal<AuthMode>('login');
  readonly contextKey = signal('');
  async open(mode: AuthMode, contextKey = '') {
    this.mode.set(mode);
    this.contextKey.set(contextKey);
    if (this.router.url.split(/[?#]/)[0] !== '/') await this.router.navigate(['/']);
    requestAnimationFrame(() => {
      const panel = this.document.getElementById('auth-panel');
      panel?.scrollIntoView({
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
        block: 'center',
      });
      panel?.querySelector<HTMLElement>('[data-panel-heading]')?.focus({ preventScroll: true });
    });
  }
}
