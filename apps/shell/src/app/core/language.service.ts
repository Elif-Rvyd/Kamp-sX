import { DOCUMENT } from '@angular/common';
import { inject, Injectable, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly document = inject(DOCUMENT);
  private readonly i18n = inject(TranslocoService);
  readonly language = signal(this.document.documentElement.lang === 'tr' ? 'tr' : 'en');
  constructor() {
    this.set(this.language());
  }
  set(value: string) {
    const lang = value === 'tr' ? 'tr' : 'en';
    this.language.set(lang);
    this.i18n.setActiveLang(lang);
    this.document.documentElement.lang = lang;
    try {
      localStorage.setItem('kampusx-language', lang);
    } catch {
      /* No storage is required for switching. */
    }
  }
}
