import { ApplicationConfig, inject, isDevMode, provideAppInitializer } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideTransloco } from '@jsverse/transloco';
import { routes } from './app.routes';
import { LocalTranslocoLoader } from './core/transloco-loader';
import { AuthService } from './core/auth.service';
export const appConfig: ApplicationConfig = {
  providers: [
    // Register listeners before the router loads an auth callback page.
    provideAppInitializer(() => inject(AuthService).ready),
    provideRouter(
      routes,
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }),
    ),
    provideTransloco({
      config: {
        availableLangs: ['tr', 'en'],
        defaultLang: 'tr',
        fallbackLang: 'tr',
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: LocalTranslocoLoader,
    }),
  ],
};
