import { Injectable } from '@angular/core';
import { TranslocoLoader } from '@jsverse/transloco';
import { of } from 'rxjs';
import tr from '../../assets/i18n/tr.json';
import en from '../../assets/i18n/en.json';
/** Bundle both dictionaries locally: instant switching without any API/network request. */
@Injectable({ providedIn: 'root' })
export class LocalTranslocoLoader implements TranslocoLoader {
  getTranslation(lang: string) {
    return of(lang === 'tr' ? tr : en);
  }
}
