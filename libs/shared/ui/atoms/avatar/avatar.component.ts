import { ChangeDetectionStrategy, Component, effect, input, signal } from '@angular/core';

@Component({
  selector: 'kx-avatar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span
    class="avatar"
    [class.avatar-large]="size() === 'large'"
    [class.avatar-profile]="size() === 'profile'"
    aria-hidden="true"
  >
    @if (src() && !imageFailed()) {
      <img [src]="src()" alt="" width="96" height="96" (error)="imageFailed.set(true)" />
    } @else {
      {{ initials() }}
    }
  </span>`,
  styleUrl: './avatar.component.css',
})
export class AvatarComponent {
  readonly initials = input.required<string>();
  readonly size = input<'small' | 'large' | 'profile'>('small');
  readonly src = input<string>();
  readonly imageFailed = signal(false);
  constructor() {
    effect(() => {
      this.src();
      this.imageFailed.set(false);
    });
  }
}
