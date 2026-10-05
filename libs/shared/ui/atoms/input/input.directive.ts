import { Directive } from '@angular/core';
@Directive({ selector: 'input[kxInput]', standalone: true, host: { class: 'kx-input' } })
export class InputDirective {}
