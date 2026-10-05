import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { LogoComponent, LegalDialogComponent } from '@kampusx/shared/ui';
@Component({
  selector: 'kx-footer',
  standalone: true,
  imports: [TranslocoDirective, RouterLink, LogoComponent, LegalDialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<footer class="site-footer page-container" *transloco="let t">
    <div class="footer-top">
      <div>
        <a routerLink="/" [attr.aria-label]="t('common.brand')"><kx-logo /></a>
      </div>
      <nav [attr.aria-label]="t('nav.about')">
        <a routerLink="/" fragment="hakkinda">{{ t('nav.about') }}</a
        ><button type="button" (click)="legal.open('legal.text')">{{ t('footer.privacy') }}</button
        ><button type="button" (click)="legal.open('legal.text')">{{ t('footer.terms') }}</button
        ><button type="button" (click)="legal.open('legal.cookies')">{{ t('footer.cookies') }}</button>
      </nav>
    </div>
    <div class="footer-bottom">
      <span>{{ t('footer.copyright', { year: year }) }}</span
      ><span>{{ t('footer.made') }}</span>
    </div>
    <kx-legal-dialog #legal />
  </footer>`,
})
export class FooterComponent {
  readonly year = new Date().getFullYear();
}
