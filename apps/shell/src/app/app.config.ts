import { ApplicationConfig, isDevMode } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideTransloco } from '@jsverse/transloco';
import { routes } from './app.routes';
import { LocalTranslocoLoader } from './core/transloco-loader';
export const appConfig: ApplicationConfig = {
  providers: [
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
