import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TabStripComponent } from '@kampusx/shared/ui';
import { DISCOVER_FEEDS } from '../mock-data';

@Component({
  selector: 'kx-dashboard-discover-tabs',
  standalone: true,
  imports: [TabStripComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<kx-tab-strip
    [items]="feeds"
    [active]="active()"
    baseId="dashboard-discover"
    labelKey="dashboard.discoverLabel"
    (selected)="selected.emit($event)"
  />`,
})
export class DashboardDiscoverTabsComponent {
  readonly feeds = DISCOVER_FEEDS;
  readonly active = input(0);
  readonly selected = output<number>();
}
