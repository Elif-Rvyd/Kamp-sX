import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MessagesStore } from './messages.store';
@Component({
  standalone: true,
  imports: [RouterOutlet],
  providers: [MessagesStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<router-outlet />',
})
export class MessagesLayoutComponent {}
