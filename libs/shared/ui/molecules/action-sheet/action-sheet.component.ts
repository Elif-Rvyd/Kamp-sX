import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { ModalDrawerComponent } from '../../organisms/modal-drawer/modal-drawer.component';
import { IconComponent } from '../../atoms/icon/icon.component';
import type { ActionMenuItem } from '../action-menu/action-menu.component';
let next = 0;
@Component({
  selector: 'kx-action-sheet',
  standalone: true,
  imports: [TranslocoDirective, ModalDrawerComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-container *transloco="let t">
    <button
      type="button"
      class="sheet-trigger"
      [disabled]="disabled()"
      [attr.aria-label]="t(labelKey())"
      aria-haspopup="dialog"
      (click)="sheet.open()"
    >
      <kx-icon [name]="icon()" />
      @if (count() !== null) {
        <span>{{ count() }}</span>
      }
    </button>
    <kx-modal-drawer
      #sheet
      position="bottom"
      [drawerId]="id"
      [labelledBy]="id + '-title'"
      (changed)="changed($event)"
    >
      <div class="sheet">
        <div class="sheet-head">
          <h2 [id]="id + '-title'">{{ t(labelKey()) }}</h2>
          <button
            type="button"
            data-drawer-close
            [attr.aria-label]="t('common.close')"
            (click)="sheet.close()"
          >
            <kx-icon name="close" />
          </button>
        </div>
        <div role="menu" [attr.aria-label]="t(labelKey())" (keydown)="navigate($event)">
          @for (item of items(); track item.id) {
            <button type="button" role="menuitem" [disabled]="item.disabled" (click)="choose(item.id)">
              <kx-icon [name]="item.icon" />{{ t(item.labelKey) }}
            </button>
          }
        </div>
        <ng-content />
      </div>
    </kx-modal-drawer>
  </ng-container>`,
  styles: `
    :host {
      display: block;
    }
    .sheet-trigger {
      min-width: 44px;
      height: 52px;
      width: 100%;
      border: 0;
      background: transparent;
      color: var(--color-muted);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      gap: 3px;
      cursor: pointer;
    }
    .sheet-trigger span {
      font-size: 10px;
    }
    .sheet-trigger:disabled {
      opacity: 0.5;
      cursor: default;
    }
    .sheet {
      padding: 20px 20px max(24px, env(safe-area-inset-bottom));
    }
    .sheet-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 12px;
    }
    h2 {
      margin: 0;
      font-size: 1.125rem;
    }
    .sheet button {
      min-height: 48px;
      border: 0;
      border-radius: var(--radius-control);
      background: transparent;
      color: var(--color-text);
      font: inherit;
      cursor: pointer;
    }
    .sheet-head button {
      width: 48px;
    }
    .sheet [role='menuitem'] {
      display: flex;
      align-items: center;
      gap: 16px;
      width: 100%;
      text-align: start;
      padding: 12px;
    }
    .sheet button:hover {
      background: var(--color-surface-alt);
    }
  `,
})
export class ActionSheetComponent {
  readonly items = input.required<readonly ActionMenuItem[]>();
  readonly labelKey = input.required<string>();
  readonly icon = input('repeat');
  readonly count = input<number | null>(null);
  readonly disabled = input(false);
  readonly selected = output<string>();
  readonly id = 'action-sheet-' + ++next;
  private readonly drawer = viewChild.required(ModalDrawerComponent);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private pending = '';
  choose(id: string) {
    this.pending = id;
    this.drawer().close();
  }
  changed(open: boolean) {
    if (!open && this.pending) {
      const id = this.pending;
      this.pending = '';
      this.selected.emit(id);
    }
  }
  navigate(event: KeyboardEvent) {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const options = [
      ...this.element.nativeElement.querySelectorAll<HTMLButtonElement>('[role=menuitem]:not(:disabled)'),
    ];
    const index = options.indexOf(event.target as HTMLButtonElement);
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? options.length - 1
          : (index + (event.key === 'ArrowUp' ? -1 : 1) + options.length) % options.length;
    options[next]?.focus();
  }
}
