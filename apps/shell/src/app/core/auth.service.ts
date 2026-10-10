import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { AuthError, isAuthError, type Session } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly connection = inject(SupabaseService);
  private readonly supabase = this.connection.client;
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly currentSession = signal<Session | null>(null);
  readonly session = this.currentSession.asReadonly();
  readonly initialized = signal(false);
  readonly recovery = signal(false);
  readonly initializationError = signal<AuthError | null>(null);
  readonly ready: Promise<void>;
  private revision = 0;

  constructor() {
    if (!this.supabase) {
      this.initializationError.set(this.failure('auth_not_configured'));
      this.initialized.set(true);
      this.ready = Promise.resolve();
      return;
    }
    const {
      data: { subscription },
    } = this.supabase.auth.onAuthStateChange((event, session) => {
      if (this.destroyRef.destroyed) return;
      this.revision++;
      this.currentSession.set(session);
      if (event === 'PASSWORD_RECOVERY') this.recovery.set(!!session);
      else if (event === 'SIGNED_OUT' || !session) this.recovery.set(false);
      else if (event === 'SIGNED_IN') this.recovery.set(false);
      // Synchronous callback: nested SDK auth calls can deadlock.
    });
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
    this.ready = this.restoreSession();
  }

  private async restoreSession(): Promise<void> {
    const revision = this.revision;
    try {
      const initialized = await this.supabase!.auth.initialize();
      if (this.destroyRef.destroyed) return;
      if (initialized.error) {
        this.initializationError.set(initialized.error);
        this.currentSession.set(null);
        this.recovery.set(false);
        return;
      }
      const { data, error } = await this.supabase!.auth.getSession();
      if (this.destroyRef.destroyed) return;
      if (error) {
        this.initializationError.set(error);
        if (revision === this.revision) this.currentSession.set(null);
      } else if (revision === this.revision) this.currentSession.set(data.session);
    } catch (error) {
      if (!this.destroyRef.destroyed) {
        this.initializationError.set(this.normalizeError(error));
        if (revision === this.revision) this.currentSession.set(null);
      }
    } finally {
      if (!this.destroyRef.destroyed) {
        this.initialized.set(true);
        this.scrubCallbackUrl();
      }
    }
  }

  async signUp(email: string, password: string, username: string) {
    if (!this.supabase)
      return { data: { user: null, session: null }, error: this.failure('auth_not_configured') };
    try {
      return await this.supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { username: username.trim().replace(/^@/, '') },
          emailRedirectTo: this.callbackUrl('/auth/login'),
        },
      });
      // Metadata is user-editable; profile/role creation belongs in DB/server rules.
    } catch (error) {
      return { data: { user: null, session: null }, error: this.normalizeError(error) };
    }
  }

  async signIn(email: string, password: string, remember = false) {
    if (!this.supabase)
      return { data: { user: null, session: null }, error: this.failure('auth_not_configured') };
    await this.ready;
    this.connection.setRemember(remember);
    try {
      const result = await this.supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (!result.error) this.initializationError.set(null);
      return result;
    } catch (error) {
      return { data: { user: null, session: null }, error: this.normalizeError(error) };
    }
  }

  async signOut(): Promise<{ error: AuthError | null }> {
    if (!this.supabase) return { error: this.failure('auth_not_configured') };
    try {
      const result = await this.supabase.auth.signOut({ scope: 'local' });
      if (!result.error) {
        this.currentSession.set(null);
        this.recovery.set(false);
      }
      return result;
    } catch (error) {
      return { error: this.normalizeError(error) };
    }
  }

  async resetPassword(email: string): Promise<{ data: unknown; error: AuthError | null }> {
    if (!this.supabase) return { data: null, error: this.failure('auth_not_configured') };
    try {
      return await this.supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: this.callbackUrl('/auth/update-password'),
      });
    } catch (error) {
      return { data: null, error: this.normalizeError(error) };
    }
  }

  async updatePassword(password: string): Promise<{ error: AuthError | null; passwordUpdated: boolean }> {
    await this.ready;
    if (!this.supabase) return { error: this.failure('auth_not_configured'), passwordUpdated: false };
    if (!this.recovery() || !this.session() || this.initializationError()) {
      return { error: this.failure('recovery_required'), passwordUpdated: false };
    }
    if (password.length < 8) return { error: this.failure('weak_password'), passwordUpdated: false };
    try {
      const { error } = await this.supabase.auth.updateUser({ password });
      if (error) return { error, passwordUpdated: false };
      this.recovery.set(false);
      const signedOut = await this.signOut();
      return {
        error: signedOut.error ? this.failure('password_updated_signout_failed') : null,
        passwordUpdated: true,
      };
    } catch (error) {
      return { error: this.normalizeError(error), passwordUpdated: false };
    }
  }

  /** Navigation only: data authorization remains in RLS/the server. */
  async hasVerifiedSession(): Promise<boolean> {
    await this.ready;
    if (!this.supabase || !this.session() || this.initializationError()) return false;
    const revision = this.revision;
    const userId = this.session()!.user.id;
    try {
      const { data, error } = await this.supabase.auth.getUser();
      return !error && data.user?.id === userId && revision === this.revision;
    } catch {
      return false;
    }
  }

  errorKey(error: unknown): string {
    const value = error as { code?: string; status?: number; name?: string } | null;
    if (value?.code === 'auth_not_configured') return 'auth.errors.config';
    if (value?.code === 'recovery_required' || value?.code === 'otp_expired')
      return 'auth.errors.recoveryInvalid';
    if (value?.code === 'password_updated_signout_failed') return 'auth.errors.signOut';
    if (value?.code === 'invalid_credentials') return 'auth.errors.credentials';
    if (value?.code === 'email_not_confirmed') return 'auth.errors.unconfirmed';
    if (value?.code === 'weak_password') return 'auth.errors.weakPassword';
    if (
      value?.status === 429 ||
      value?.code === 'over_request_rate_limit' ||
      value?.code === 'over_email_send_rate_limit'
    )
      return 'auth.errors.rateLimit';
    if (value?.code === 'network_error' || value?.name === 'AuthRetryableFetchError')
      return 'auth.errors.network';
    return 'auth.errors.generic';
  }

  private failure(code: string): AuthError {
    return new AuthError('Authentication could not be completed.', undefined, code);
  }
  private normalizeError(error: unknown): AuthError {
    return isAuthError(error)
      ? error
      : this.failure(error instanceof TypeError ? 'network_error' : 'unexpected_failure');
  }
  private callbackUrl(path: string): string {
    return new URL(path, this.document.location.origin).href;
  }

  private scrubCallbackUrl(): void {
    const window = this.document.defaultView;
    if (
      !window ||
      !['/auth/login', '/auth/update-password'].includes(window.location.pathname.replace(/\/$/, ''))
    )
      return;
    const url = new URL(window.location.href);
    const keys = [
      'code',
      'access_token',
      'refresh_token',
      'token_type',
      'expires_in',
      'expires_at',
      'type',
      'error',
      'error_code',
      'error_description',
    ];
    const hash = new URLSearchParams(url.hash.slice(1));
    let changed = false;
    for (const key of keys) {
      if (url.searchParams.has(key)) {
        url.searchParams.delete(key);
        changed = true;
      }
      if (hash.has(key)) {
        hash.delete(key);
        changed = true;
      }
    }
    if (!changed) return;
    url.hash = hash.toString();
    try {
      window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
    } catch {
      /* History can be restricted by the host. */
    }
  }
}
