import { ChangeDetectionStrategy, Component } from '@angular/core';
@Component({
  selector: 'kx-logo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<img src="assets/logo.svg" width="38" height="38" alt="" /><span
      >Kampüs<span class="brand-x">X</span></span
    >`,
  host: { class: 'brand' },
})
export class LogoComponent {}
