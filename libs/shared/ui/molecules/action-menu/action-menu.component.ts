import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { IconComponent } from '../../atoms/icon/icon.component';
export interface ActionMenuItem {
  id: string;
  labelKey: string;
  icon: string;
  danger?: boolean;
  disabled?: boolean;
}
let nextMenuId = 0;
/** Shared anchored action menu. Selection restores the trigger before a feature opens its dialog. */
@Component({
  selector: 'kx-action-menu',
  standalone: true,
  imports: [TranslocoDirective, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:click)': 'outside($event)' },
  template: `<ng-container *transloco="let t">
    <button
      #trigger
      type="button"
      class="menu-trigger"
      aria-haspopup="menu"
      [attr.aria-expanded]="opened()"
      [attr.aria-controls]="id"
      [attr.aria-label]="t(labelKey())"
      [title]="t(labelKey())"
      [disabled]="disabled()"
      (click)="toggle($event)"
      (keydown.arrowdown)="open($event)"
    >
      <kx-icon name="more_horiz" />
    </button>
    @if (opened()) {
      <div
        class="action-menu"
        role="menu"
        [id]="id"
        [attr.aria-label]="t(labelKey())"
        (keydown)="navigate($event)"
      >
        @for (item of items(); track item.id) {
          <button
            type="button"
            role="menuitem"
            [class.danger]="item.danger"
            [disabled]="item.disabled"
            tabindex="-1"
            (click)="choose(item.id, $event)"
          >
            <kx-icon [name]="item.icon" /><span>{{ t(item.labelKey) }}</span>
          </button>
        }
      </div>
    }
  </ng-container>`,
  styleUrl: './action-menu.component.css',
})
export class ActionMenuComponent {
  readonly items = input.required<readonly ActionMenuItem[]>();
  readonly labelKey = input('social.menu.label');
  readonly disabled = input(false);
  readonly selected = output<string>();
  readonly opened = signal(false);
  readonly id = `kx-actions-${++nextMenuId}`;
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly document = inject(DOCUMENT);
  private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  toggle(event: Event): void {
    event.stopPropagation();
    this.opened() ? this.close() : this.open(event);
  }
  open(event: Event): void {
    event.preventDefault();
    if (this.disabled()) return;
    this.opened.set(true);
    afterNextRender(() => this.options()[0]?.focus(), { injector: this.injector });
  }
  close(restore = false): void {
    this.opened.set(false);
    if (restore) this.trigger().nativeElement.focus();
  }
  outside(event: Event): void {
    if (this.opened() && !this.element.nativeElement.contains(event.target as Node)) this.close();
  }
  choose(id: string, event: Event): void {
    event.stopPropagation();
    this.close(true);
    this.selected.emit(id);
  }
  private options(): HTMLButtonElement[] {
    return [
      ...this.element.nativeElement.querySelectorAll<HTMLButtonElement>('[role=menuitem]:not(:disabled)'),
    ];
  }
  navigate(event: KeyboardEvent): void {
    const items = this.options(),
      index = items.indexOf(this.document.activeElement as HTMLButtonElement);
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.close(true);
    } else if (event.key === 'Tab') this.close();
    else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      items[
        event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? items.length - 1
            : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length
      ]?.focus();
    }
  }
}
