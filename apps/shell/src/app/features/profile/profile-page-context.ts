import { DOCUMENT } from '@angular/common';
import { DestroyRef, effect, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { AuthService } from '../../core/auth.service';
export function bindProfilePage(titleKey: string): void {
  const auth = inject(AuthService),
    router = inject(Router),
    document = inject(DOCUMENT),
    i18n = inject(TranslocoService),
    destroyRef = inject(DestroyRef);
  const epoch = auth.sessionEpoch();
  effect(() => {
    if (auth.initialized() && (!auth.session() || auth.sessionEpoch() !== epoch))
      void router.navigateByUrl('/auth/login', { replaceUrl: true });
  });
  i18n
    .selectTranslate(titleKey)
    .pipe(takeUntilDestroyed(destroyRef))
    .subscribe((title) => (document.title = title));
  destroyRef.onDestroy(() => (document.title = i18n.translate('common.title')));
}
