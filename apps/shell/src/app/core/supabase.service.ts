import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, inject } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { BrowserAuthStorage } from './browser-auth-storage';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  readonly client: SupabaseClient | null;
  private readonly storage: BrowserAuthStorage | null;

  constructor() {
    if (!environment.supabaseUrl || !environment.supabasePublishableKey) {
      this.client = null;
      this.storage = null;
      return;
    }
    const window = this.document.defaultView;
    const storageKey = `sb-${new URL(environment.supabaseUrl).hostname.split('.')[0]}-auth-token`;
    const safeStorage = (kind: 'localStorage' | 'sessionStorage'): Storage | null => {
      try {
        return window?.[kind] ?? null;
      } catch {
        return null;
      }
    };
    this.storage = new BrowserAuthStorage(
      storageKey,
      safeStorage('localStorage'),
      safeStorage('sessionStorage'),
    );
    this.client = createClient(environment.supabaseUrl, environment.supabasePublishableKey, {
      auth: {
        storageKey,
        storage: this.storage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: (url) =>
          ['/auth/login', '/auth/update-password'].includes(url.pathname.replace(/\/$/, '')),
      },
    });
    this.destroyRef.onDestroy(() => {
      void Promise.all([this.client!.auth.dispose(), this.client!.removeAllChannels()]).catch(() => {
        // Teardown must not log sessions or cause unhandled rejections.
      });
    });
  }

  setRemember(remember: boolean): void {
    this.storage?.setRemember(remember);
  }
}
