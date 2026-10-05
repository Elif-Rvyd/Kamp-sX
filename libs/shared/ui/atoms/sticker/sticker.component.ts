import { ChangeDetectionStrategy, Component, input } from '@angular/core';
@Component({
  selector: 'kx-sticker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: {
    class: 'kx-sticker',
    '[class.sticker-coral]': 'tone() === "coral"',
    '[class.sticker-round]': 'round()',
  },
})
export class StickerComponent {
  readonly tone = input<'yellow' | 'coral'>('yellow');
  readonly round = input(false);
}
