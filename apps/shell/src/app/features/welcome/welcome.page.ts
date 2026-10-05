import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HeroSectionComponent } from './sections/hero-section/hero-section.component';
import { AboutSectionComponent } from './sections/about-section/about-section.component';
import { CommunitiesSectionComponent } from './sections/communities-section/communities-section.component';
import { ClosingCtaSectionComponent } from './sections/closing-cta-section/closing-cta-section.component';
@Component({
  standalone: true,
  imports: [
    HeroSectionComponent,
    AboutSectionComponent,
    CommunitiesSectionComponent,
    ClosingCtaSectionComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<kx-hero-section /><kx-about-section /><kx-communities-section /><kx-closing-cta-section />`,
})
export class WelcomePage {}
