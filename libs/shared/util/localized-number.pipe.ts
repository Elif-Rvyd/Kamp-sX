import { inject, Pipe, PipeTransform } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
@Pipe({ name: 'kxNumber', standalone: true, pure: false })
export class LocalizedNumberPipe implements PipeTransform {
  private readonly i18n = inject(TranslocoService);
  transform(value: number | null | undefined): string {
    if (value === null || value === undefined) return '—';
    return new Intl.NumberFormat(this.i18n.getActiveLang() === 'tr' ? 'tr-TR' : 'en-US').format(value);
  }
}
