import { ChangeDetectionStrategy, Component, ElementRef, input, output, viewChildren } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';

export interface TabStripItem {
  id: string;
  labelKey: string;
}

@Component({
  selector: 'kx-tab-strip',
  standalone: true,
  imports: [TranslocoDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="tab-strip" *transloco="let t" role="tablist" [attr.aria-label]="t(labelKey())">
    @for (item of items(); track item.id; let index = $index) {
      <button
        #tab
        type="button"
        role="tab"
        class="tab"
        [id]="baseId() + '-tab-' + item.id"
        [attr.aria-controls]="baseId() + '-panel-' + item.id"
        [attr.aria-selected]="active() === index"
        [tabIndex]="active() === index ? 0 : -1"
        (click)="selected.emit(index)"
        (keydown)="onKeydown($event, index)"
      >
        {{ t(item.labelKey) }}
      </button>
    }
    <span
      class="indicator"
      aria-hidden="true"
      [style.width.%]="100 / items().length"
      [style.transform]="'translateX(' + active() * 100 + '%)'"
    ></span>
  </div>`,
  styleUrl: './tab-strip.component.css',
})
export class TabStripComponent {
  readonly items = input.required<readonly TabStripItem[]>();
  readonly active = input(0);
  readonly baseId = input.required<string>();
  readonly labelKey = input.required<string>();
  readonly selected = output<number>();
  private readonly tabs = viewChildren<ElementRef<HTMLButtonElement>>('tab');

  onKeydown(event: KeyboardEvent, index: number): void {
    const count = this.items().length;
    if (!count || event.altKey || event.ctrlKey || event.metaKey) return;
    let next: number;
    switch (event.key) {
      case 'ArrowRight':
        next = (index + 1) % count;
        break;
      case 'ArrowLeft':
        next = (index - 1 + count) % count;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = count - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    this.selected.emit(next);
    this.tabs()[next]?.nativeElement.focus({ preventScroll: true });
  }
}
