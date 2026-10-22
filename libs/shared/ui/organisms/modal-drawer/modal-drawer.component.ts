import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { horizontalSwipe, swipePoint, type SwipePoint } from '@kampusx/shared/util';

@Component({
  selector: 'kx-modal-drawer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<dialog
    #dialog
    class="modal-drawer"
    [class.bottom-sheet]="position() === 'bottom'"
    [class.closing]="closing()"
    [id]="drawerId()"
    [attr.aria-labelledby]="labelledBy()"
    [attr.aria-describedby]="describedBy()"
    (cancel)="onCancel($event)"
    (click)="onBackdrop($event)"
    (keydown)="onKeydown($event)"
    (transitionend)="onTransitionEnd($event)"
    (pointerdown)="onPointerDown($event)"
    (pointerup)="onPointerUp($event)"
    (pointercancel)="cancelSwipe()"
  >
    <div class="drawer-body"><ng-content /></div>
  </dialog>`,
  styleUrl: './modal-drawer.component.css',
})
export class ModalDrawerComponent {
  readonly drawerId = input.required<string>();
  readonly position = input<'side' | 'bottom'>('side');
  readonly labelledBy = input.required<string>();
  readonly describedBy = input<string | null>(null);
  readonly changed = output<boolean>();
  readonly closing = signal(false);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private opener: HTMLElement | null = null;
  private savedOverflow: { html: string; body: string } | null = null;
  private closeTimer: ReturnType<typeof setTimeout> | null = null;
  private swipe: SwipePoint | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.clearTimer();
      this.restoreScroll();
      if (this.dialog().nativeElement.open) this.dialog().nativeElement.close();
      this.opener?.isConnected && this.opener.focus({ preventScroll: true });
    });
  }

  open(): void {
    const element = this.dialog().nativeElement;
    if (element.open && !this.closing()) return;
    this.clearTimer();
    this.closing.set(false);
    if (!element.open) {
      this.opener = this.document.activeElement as HTMLElement | null;
      this.savedOverflow = {
        html: this.document.documentElement.style.overflow,
        body: this.document.body.style.overflow,
      };
      element.showModal();
      this.document.documentElement.style.overflow = 'hidden';
      this.document.body.style.overflow = 'hidden';
      element.querySelector<HTMLElement>('[data-drawer-close]')?.focus({ preventScroll: true });
    }
    this.changed.emit(true);
  }

  close(): void {
    if (!this.dialog().nativeElement.open || this.closing()) return;
    this.swipe = null;
    if (this.document.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.finishClose();
      return;
    }
    this.closing.set(true);
    // Fallback also handles a transition interrupted by viewport or theme changes.
    this.closeTimer = setTimeout(() => this.finishClose(), 300);
  }

  onCancel(event: Event): void {
    event.preventDefault();
    this.close();
  }

  onBackdrop(event: MouseEvent): void {
    if (event.target !== this.dialog().nativeElement) return;
    const bounds = this.dialog().nativeElement.getBoundingClientRect();
    if (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    )
      this.close();
  }

  onTransitionEnd(event: TransitionEvent): void {
    if (event.target === this.dialog().nativeElement && event.propertyName === 'transform' && this.closing())
      this.finishClose();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
    const focusable = [
      ...this.dialog().nativeElement.querySelectorAll<HTMLElement>(
        'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
      ),
    ].filter((element) => element.getClientRects().length > 0 && !element.closest('[inert]'));
    if (!focusable.length) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && this.document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && this.document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  onPointerDown(event: PointerEvent): void {
    if (!event.isPrimary) {
      this.swipe = null;
      return;
    }
    if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
    this.swipe = swipePoint(event);
    this.dialog().nativeElement.setPointerCapture(event.pointerId);
  }
  onPointerUp(event: PointerEvent): void {
    const direction = horizontalSwipe(this.swipe, swipePoint(event));
    this.swipe = null;
    if (direction === 1) this.close();
  }
  cancelSwipe(): void {
    this.swipe = null;
  }

  private finishClose(): void {
    this.clearTimer();
    this.dialog().nativeElement.close();
    this.closing.set(false);
    this.restoreScroll();
    if (this.opener?.isConnected) this.opener.focus({ preventScroll: true });
    this.opener = null;
    this.changed.emit(false);
  }
  private clearTimer(): void {
    if (this.closeTimer) clearTimeout(this.closeTimer);
    this.closeTimer = null;
  }
  private restoreScroll(): void {
    if (!this.savedOverflow) return;
    this.document.documentElement.style.overflow = this.savedOverflow.html;
    this.document.body.style.overflow = this.savedOverflow.body;
    this.savedOverflow = null;
  }
}
