import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  isDevMode,
  signal,
  untracked,
} from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { ButtonComponent, IconComponent } from '@kampusx/shared/ui';
import { AuthService } from '../../../core/auth.service';
import { LanguageService } from '../../../core/language.service';
import {
  WorldNewsApiService,
  WorldNewsError,
  type WorldNewsFeed,
} from '../../../core/world-news-api.service';

@Component({
  selector: 'kx-world-news',
  standalone: true,
  imports: [TranslocoDirective, ButtonComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './world-news.component.html',
  styleUrl: './world-news.component.css',
})
export class WorldNewsComponent {
  private readonly api = inject(WorldNewsApiService);
  private readonly auth = inject(AuthService);
  readonly language = inject(LanguageService);
  private readonly destroy = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly wide = this.document.defaultView?.matchMedia('(min-width: 1024px)');
  readonly expanded = signal(this.wide?.matches ?? true);
  readonly more = signal(false);
  readonly loading = signal(false);
  readonly error = signal(false);
  readonly diagnostic = signal('');
  private readonly development = isDevMode();
  readonly feed = signal<WorldNewsFeed | null>(null);
  readonly visibleItems = computed(() => this.feed()?.items.slice(0, this.more() ? 8 : 4) ?? []);
  private controller: AbortController | null = null;
  private sequence = 0;
  constructor() {
    const onResize = (event: MediaQueryListEvent) => this.expanded.set(event.matches);
    this.wide?.addEventListener('change', onResize);
    effect(() => {
      const lang = this.language.language() as 'tr' | 'en';
      const epoch = this.auth.sessionEpoch();
      untracked(() => {
        this.controller?.abort();
        this.sequence++;
        this.feed.set(null);
        this.more.set(false);
        this.error.set(false);
        this.diagnostic.set('');
        this.loading.set(false);
      });
      if (this.expanded()) untracked(() => void this.load(lang, epoch));
    });
    const interval = setInterval(() => {
      if (this.expanded() && this.document.visibilityState === 'visible' && !this.loading())
        void this.refresh();
    }, 300_000);
    this.destroy.onDestroy(() => {
      this.controller?.abort();
      clearInterval(interval);
      this.wide?.removeEventListener('change', onResize);
    });
  }
  toggle(): void {
    this.expanded.update((value) => !value);
  }
  refresh(): Promise<void> {
    return this.load(this.language.language() as 'tr' | 'en', this.auth.sessionEpoch());
  }
  async load(lang: 'tr' | 'en', epoch: number): Promise<void> {
    this.controller?.abort();
    const controller = (this.controller = new AbortController()),
      sequence = ++this.sequence;
    if (!this.auth.session()) return;
    this.loading.set(true);
    this.error.set(false);
    this.diagnostic.set('');
    try {
      const feed = await this.api.load(lang, controller.signal);
      if (
        this.destroy.destroyed ||
        controller.signal.aborted ||
        sequence !== this.sequence ||
        epoch !== this.auth.sessionEpoch()
      )
        return;
      this.feed.set(feed);
    } catch (error) {
      if (
        !this.destroy.destroyed &&
        !controller.signal.aborted &&
        sequence === this.sequence &&
        epoch === this.auth.sessionEpoch()
      ) {
        this.error.set(true);
        if (this.development)
          this.diagnostic.set(error instanceof WorldNewsError ? error.diagnostic : 'invalid_response');
      }
    } finally {
      if (!this.destroy.destroyed && sequence === this.sequence) this.loading.set(false);
    }
  }
  date(value: string): string {
    return new Intl.DateTimeFormat(this.language.language() === 'tr' ? 'tr-TR' : 'en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  }
}
