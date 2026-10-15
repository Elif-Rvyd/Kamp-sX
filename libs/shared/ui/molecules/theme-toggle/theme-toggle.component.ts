import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { IconComponent } from '../../atoms/icon/icon.component';
import { ToggleComponent } from '../../atoms/toggle/toggle.component';
@Component({
  selector: 'kx-theme-toggle',
  standalone: true,
  imports: [TranslocoDirective, IconComponent, ToggleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<button
    kxToggle
    [class.touch-control]="touch()"
    type="button"
    *transloco="let t"
    [pressed]="dark()"
    (toggled)="changed.emit()"
    [attr.aria-label]="t(dark() ? 'common.lightTheme' : 'common.darkTheme')"
    [title]="t(dark() ? 'common.lightTheme' : 'common.darkTheme')"
  >
    <kx-icon [name]="dark() ? 'light_mode' : 'dark_mode'" />
  </button>`,
  styles: `
    .touch-control {
      min-width: 44px;
      min-height: 44px;
    }
  `,
})
export class ThemeToggleComponent {
  readonly touch = input(false);
  readonly dark = input(false);
  readonly changed = output<void>();
}
