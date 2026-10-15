import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { ButtonComponent } from '../../atoms/button/button.component';
@Component({
  selector: 'kx-confirm-dialog',
  standalone: true,
  imports: [TranslocoDirective, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './confirm-dialog.component.css',
  template: `<dialog
    #dialog
    *transloco="let t"
    [attr.aria-labelledby]="dialogId() + '-title'"
    [attr.aria-describedby]="dialogId() + '-body'"
    (cancel)="cancel($event)"
  >
    <h2 [id]="dialogId() + '-title'">{{ t(titleKey()) }}</h2>
    <p [id]="dialogId() + '-body'">{{ t(bodyKey()) }}</p>
    <div class="actions">
      <button #keep kxButton type="button" emphasis="outline" (click)="finish(false)">
        {{ t(cancelKey()) }}</button
      ><button kxButton type="button" emphasis="outline" class="discard" (click)="finish(true)">
        {{ t(confirmKey()) }}
      </button>
    </div>
  </dialog>`,
})
export class ConfirmDialogComponent {
  readonly dialogId = input.required<string>();
  readonly titleKey = input.required<string>();
  readonly bodyKey = input.required<string>();
  readonly cancelKey = input.required<string>();
  readonly confirmKey = input.required<string>();
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly keep = viewChild.required<unknown, ElementRef<HTMLButtonElement>>('keep', {
    read: ElementRef,
  });
  private readonly document = inject(DOCUMENT);
  private resolver: ((value: boolean) => void) | undefined;
  private opener: HTMLElement | null = null;
  private overflow: string | undefined;
  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.resolver?.(false);
      this.resolver = undefined;
      this.restoreScroll();
      if (this.dialog().nativeElement.open) this.dialog().nativeElement.close();
    });
  }
  ask(): Promise<boolean> {
    if (this.resolver) return Promise.resolve(false);
    this.opener = this.document.activeElement as HTMLElement;
    this.dialog().nativeElement.showModal();
    this.overflow = this.document.documentElement.style.overflow;
    this.document.documentElement.style.overflow = 'hidden';
    this.keep().nativeElement.focus();
    return new Promise((resolve) => (this.resolver = resolve));
  }
  cancel(event: Event): void {
    event.preventDefault();
    this.finish(false);
  }
  finish(value: boolean): void {
    this.dialog().nativeElement.close();
    this.restoreScroll();
    const resolve = this.resolver;
    this.resolver = undefined;
    if (this.opener?.isConnected) this.opener.focus({ preventScroll: true });
    resolve?.(value);
  }
  private restoreScroll(): void {
    if (this.overflow !== undefined) this.document.documentElement.style.overflow = this.overflow;
    this.overflow = undefined;
  }
}
