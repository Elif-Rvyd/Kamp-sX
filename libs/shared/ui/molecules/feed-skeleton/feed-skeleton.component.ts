import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'kx-feed-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `<div class="skeleton-card">
    <div class="skeleton-header">
      <span class="skeleton-avatar"></span>
      <div class="skeleton-identity">
        <span class="skeleton-line identity"></span><span class="skeleton-line meta"></span>
      </div>
    </div>
    <div class="skeleton-copy">
      <span class="skeleton-line"></span><span class="skeleton-line short"></span>
    </div>
    <div class="skeleton-media"></div>
    <div class="skeleton-actions">
      @for (item of [0, 1, 2, 3]; track item) {
        <span></span>
      }
    </div>
  </div>`,
  styleUrl: './feed-skeleton.component.css',
})
export class FeedSkeletonComponent {}
