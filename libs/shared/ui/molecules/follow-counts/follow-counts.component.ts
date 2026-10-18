import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { RouterLink } from '@angular/router';
import { LocalizedNumberPipe } from '@kampusx/shared/util';
import { ButtonComponent } from '../../atoms/button/button.component';

@Component({
  selector: 'kx-follow-counts',
  standalone: true,
  imports: [TranslocoDirective, LocalizedNumberPipe, ButtonComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-container *transloco="let t">
    <div
      class="counts"
      [attr.aria-busy]="loading()"
      [attr.aria-label]="t('follows.label')"
      role="group"
      aria-live="polite"
      aria-atomic="true"
    >
      @if (followingLink()) {
        <a [routerLink]="followingLink()"
          ><strong>{{ following() === null ? '—' : (following()! | kxNumber) }}</strong>
          {{ t('profile.following') }}</a
        >
      } @else {
        <span
          ><strong>{{ following() === null ? '—' : (following()! | kxNumber) }}</strong>
          {{ t('profile.following') }}</span
        >
      }
      @if (followersLink()) {
        <a [routerLink]="followersLink()"
          ><strong>{{ followers() === null ? '—' : (followers()! | kxNumber) }}</strong>
          {{ t('profile.followers') }}</a
        >
      } @else {
        <span
          ><strong>{{ followers() === null ? '—' : (followers()! | kxNumber) }}</strong>
          {{ t('profile.followers') }}</span
        >
      }
    </div>
    @if (errorKey()) {
      <div class="counts-status">
        <p role="status">{{ t(errorKey()) }}</p>
        <button kxButton type="button" emphasis="ghost" [disabled]="loading()" (click)="retried.emit()">
          {{ t('media.retry') }}
        </button>
      </div>
    }
  </ng-container>`,
  styles: `
    :host {
      display: block;
    }
    .counts {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 18px;
      font-size: 13px;
      color: var(--color-muted);
    }
    strong {
      font-weight: 800;
      color: var(--color-text);
      font-variant-numeric: tabular-nums;
    }
    .counts a {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      min-height: 44px;
      color: inherit;
      text-decoration: none;
    }
    .counts a:hover {
      text-decoration: underline;
    }
    .counts-status {
      margin-top: 8px;
      font-size: 11px;
      line-height: 1.6;
      color: var(--color-muted);
    }
    .counts-status p {
      margin: 0;
    }
    .counts-status button {
      padding-inline: 0;
      font-size: 12px;
    }
  `,
})
export class FollowCountsComponent {
  readonly following = input<number | null>(null);
  readonly followers = input<number | null>(null);
  readonly loading = input(false);
  readonly errorKey = input('');
  readonly retried = output<void>();
  readonly followingLink = input('');
  readonly followersLink = input('');
}
