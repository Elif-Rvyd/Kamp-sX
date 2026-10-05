import { DOCUMENT } from '@angular/common';
import { inject, Injectable, signal } from '@angular/core';
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  readonly dark = signal(this.document.documentElement.classList.contains('dark'));
  toggle() {
    this.dark.update((value) => !value);
    this.document.documentElement.classList.toggle('dark', this.dark());
    try {
      localStorage.setItem('kampusx-theme', this.dark() ? 'dark' : 'light');
    } catch {
      /* In-memory preference still works. */
    }
  }
}
