import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
@Component({
  selector: 'kx-language-switcher',
  standalone: true,
  imports: [TranslocoDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div
    class="language-switcher"
    *transloco="let t"
    role="group"
    [attr.aria-label]="t('common.language.label')"
  >
    @for (language of ['tr', 'en']; track language) {
      <button
        type="button"
        [attr.lang]="language"
        [attr.aria-label]="t('common.language.' + language)"
        [attr.aria-pressed]="active() === language"
        [class.active]="active() === language"
        (click)="changed.emit(language)"
      >
        {{ t('common.languageCode.' + language) }}
      </button>
    }
  </div>`,
})
export class LanguageSwitcherComponent {
  readonly active = input('tr');
  readonly changed = output<string>();
}
