import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { RouterLink } from '@angular/router';
import { profileInitials } from '@kampusx/shared/util';
import { AvatarComponent } from '../../atoms/avatar/avatar.component';
import { ButtonComponent } from '../../atoms/button/button.component';

export type FollowPersonAction = 'follow' | 'cancel' | 'unfollow' | 'accept' | 'reject' | 'remove';
export interface FollowPersonView {
  userId: string;
  fullName: string;
  username: string;
  avatarUrl?: string;
  university: string;
  department: string;
  status: 'none' | 'pending' | 'accepted';
}

@Component({
  selector: 'kx-follow-person',
  standalone: true,
  imports: [RouterLink, TranslocoDirective, AvatarComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<article class="person" *transloco="let t" [attr.aria-busy]="busy()">
    <a
      [routerLink]="'/people/' + person().userId"
      [attr.aria-label]="t('social.openProfile', { name: person().fullName || person().username })"
    >
      <kx-avatar [initials]="initials()" [src]="person().avatarUrl" />
    </a>
    <a class="identity" [routerLink]="'/people/' + person().userId">
      <strong>{{ person().fullName || person().username || t('follows.unnamed') }}</strong>
      @if (person().username) {
        <span>{{ '@' + person().username }}</span>
      }
      @if (person().university) {
        <p>{{ person().university }}</p>
      }
      @if (person().department) {
        <p>{{ person().department }}</p>
      }
    </a>
    <div
      class="actions"
      [attr.aria-label]="
        t('follows.personActions', { name: person().fullName || person().username || t('follows.unnamed') })
      "
      role="group"
    >
      @if (incoming()) {
        <button
          kxButton
          type="button"
          [disabled]="disabled()"
          [busy]="busy() && activeAction() === 'accept'"
          (click)="acted.emit('accept')"
        >
          {{ t('follows.actions.accept') }}
        </button>
        <button
          kxButton
          type="button"
          emphasis="outline"
          [disabled]="disabled()"
          [busy]="busy() && activeAction() === 'reject'"
          (click)="acted.emit('reject')"
        >
          {{ t('follows.actions.reject') }}
        </button>
      } @else {
        <button
          kxButton
          type="button"
          [emphasis]="person().status === 'none' ? 'solid' : 'outline'"
          [disabled]="disabled()"
          [busy]="busy() && activeAction() !== 'remove'"
          (click)="acted.emit(toggleAction())"
        >
          {{ t('follows.actions.' + toggleAction()) }}
        </button>
        @if (removable()) {
          <button
            kxButton
            type="button"
            emphasis="ghost"
            [disabled]="disabled()"
            [busy]="busy() && activeAction() === 'remove'"
            (click)="acted.emit('remove')"
          >
            {{ t('follows.actions.remove') }}
          </button>
        }
      }
    </div>
  </article>`,
  styles: `
    :host {
      display: block;
    }
    .person {
      display: grid;
      grid-template-columns: 44px minmax(0, 1fr);
      gap: 12px;
      padding: 20px;
      border-bottom: 1px solid var(--color-border);
      min-height: 120px;
    }
    .identity {
      color: inherit;
      text-decoration: none;
      min-width: 0;
      display: grid;
      align-content: start;
      gap: 3px;
    }
    strong {
      color: var(--color-text);
      font-size: 15px;
      overflow-wrap: anywhere;
    }
    .identity span,
    p {
      color: var(--color-muted);
      font-size: 12px;
      line-height: 1.5;
      overflow-wrap: anywhere;
      margin: 0;
    }
    .actions {
      grid-column: 2;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }
    .actions button {
      font-size: 12px;
      min-height: 44px;
    }
    @media (min-width: 900px) {
      .person {
        grid-template-columns: 44px minmax(0, 1fr) auto;
      }
      .actions {
        grid-column: 3;
      }
    }
  `,
})
export class FollowPersonComponent {
  readonly person = input.required<FollowPersonView>();
  readonly incoming = input(false);
  readonly removable = input(false);
  readonly busy = input(false);
  readonly disabled = input(false);
  readonly activeAction = input<FollowPersonAction | null>(null);
  readonly acted = output<FollowPersonAction>();
  readonly initials = computed(() => profileInitials(this.person().fullName || this.person().username));
  readonly toggleAction = computed(() =>
    this.person().status === 'accepted'
      ? 'unfollow'
      : this.person().status === 'pending'
        ? 'cancel'
        : 'follow',
  );
}
