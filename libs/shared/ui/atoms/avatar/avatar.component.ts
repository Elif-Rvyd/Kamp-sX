import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'kx-avatar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="avatar" [class.avatar-large]="size() === 'large'" aria-hidden="true">{{
    initials()
  }}</span>`,
  styleUrl: './avatar.component.css',
})
export class AvatarComponent {
  readonly initials = input.required<string>();
  readonly size = input<'small' | 'large'>('small');
}
