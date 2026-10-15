import { DestroyRef, Injectable, inject, signal } from '@angular/core';
@Injectable({ providedIn: 'root' })
export class NoticeService {
  readonly message = signal('');
  private timer: ReturnType<typeof setTimeout> | undefined;
  constructor() {
    inject(DestroyRef).onDestroy(() => this.clear());
  }
  show(key: string): void {
    this.clear();
    this.message.set(key);
    this.timer = setTimeout(() => this.clear(), 6000);
  }
  clear(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
    this.message.set('');
  }
}
