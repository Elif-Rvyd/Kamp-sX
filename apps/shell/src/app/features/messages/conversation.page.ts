import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import {
  ButtonComponent,
  ConfirmDialogComponent,
  FormFieldComponent,
  MessageBubbleComponent,
} from '@kampusx/shared/ui';
import { AuthService } from '../../core/auth.service';
import { LanguageService } from '../../core/language.service';
import { bindProfilePage } from '../profile/profile-page-context';
import { SocialPageFrameComponent } from '../social/social-page-frame.component';
import { MessagesStore } from './messages.store';
import { MessagingConnectionComponent } from './messaging-connection.component';
import { SharedMessagePostComponent } from './shared-message-post.component';
@Component({
  standalone: true,
  imports: [
    TranslocoDirective,
    RouterLink,
    ReactiveFormsModule,
    ButtonComponent,
    ConfirmDialogComponent,
    FormFieldComponent,
    MessageBubbleComponent,
    SocialPageFrameComponent,
    MessagingConnectionComponent,
    SharedMessagePostComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['../social/social-pages.css', './messages.css'],
  template: `<kx-social-page-frame titleKey="messaging.conversation" back="/messages"
    ><ng-container *transloco="let t">
      <kx-messaging-connection />
      @if (peer(); as row) {
        <div class="chat-person">
          <a [routerLink]="'/people/' + row.peer_id"
            ><strong>{{ row.peer_full_name || row.peer_username || t('messaging.student') }}</strong
            ><span>{{ '@' + (row.peer_username || '') }}</span></a
          >
        </div>
      }
      @if (store.error()) {
        <div class="status error-text" role="alert">
          {{ t(store.error()) }}
          <button kxButton type="button" emphasis="ghost" (click)="store.refresh()">
            {{ t('media.retry') }}
          </button>
        </div>
      }
      @if (store.loading() && !peer()) {
        <p class="status" role="status">{{ t('messaging.loading') }}</p>
      }
      @if (store.unavailable() && !store.loading()) {
        <div class="empty" role="status">
          <h2>{{ t('messaging.unavailableTitle') }}</h2>
          <p>{{ t('messaging.errors.unavailable') }}</p>
        </div>
      }
      @if (peer()) {
        <div
          #history
          class="chat-history"
          role="log"
          tabindex="0"
          [attr.aria-label]="t('messaging.history')"
          aria-live="polite"
          aria-relevant="additions text"
          [attr.aria-busy]="store.loading()"
        >
          @if (store.hasOlder()) {
            <div class="older">
              <button
                kxButton
                type="button"
                emphasis="ghost"
                [busy]="store.olderLoading()"
                [disabled]="store.loading()"
                (click)="older()"
              >
                {{ t('messaging.older') }}
              </button>
            </div>
          }
          @for (message of store.messages(); track message.id; let i = $index) {
            @if (i === 0 || day(message.created_at) !== day(store.messages()[i - 1].created_at)) {
              <p class="date-separator">{{ date(message.created_at) }}</p>
            }
            <kx-message-bubble
              [content]="message.content"
              [createdAt]="message.created_at"
              [timeLabel]="time(message.created_at)"
              [dateLabel]="date(message.created_at)"
              [own]="message.sender_id === auth.session()?.user?.id"
              [deleted]="!!message.deleted_at"
              [shared]="!!message.shared_post_id"
              [busy]="!!store.deleting()"
              (removeRequested)="remove(message.id)"
            >
              @if (message.shared_post_id && !message.deleted_at) {
                <kx-shared-message-post
                  [postId]="message.shared_post_id"
                  [refresh]="store.contentRevision()"
                />
              }
            </kx-message-bubble>
          } @empty {
            @if (!store.loading()) {
              <p class="empty" role="status">{{ t('messaging.noMessages') }}</p>
            }
          }
        </div>
        @if (store.readError()) {
          <p class="status" role="status">{{ t('messaging.readError') }}</p>
        }
        <div class="chat-composer">
          @if (!peer()?.can_send) {
            <p class="status" role="status">
              {{ t('messaging.readOnly') }}
              <button kxButton type="button" emphasis="ghost" (click)="store.refresh()">
                {{ t('media.retry') }}
              </button>
            </p>
          }
          @if (store.mutationError()) {
            <p class="error-text" role="alert">{{ t(store.mutationError()) }}</p>
          }
          @if (store.uncertain()) {
            <button kxButton type="button" emphasis="ghost" (click)="discardUncertain()">
              {{ t('messaging.newDraft') }}
            </button>
          }
          <form
            novalidate
            (submit)="send($event)"
            (compositionstart)="composing = true"
            (compositionend)="composing = false"
            (keydown)="shortcut($event)"
          >
            <kx-form-field
              fieldId="dm-content"
              labelKey="messaging.write"
              placeholderKey="messaging.write"
              icon="chat"
              [control]="content"
              [multiline]="true"
              [maxLength]="2000"
            />
            <button
              kxButton
              type="submit"
              [busy]="store.sending()"
              [disabled]="!peer()?.can_send || store.uncertain() || store.loading()"
            >
              {{ t('messaging.send') }}
            </button>
          </form>
        </div>
      }
      <kx-confirm-dialog
        #deleteDialog
        dialogId="delete-message"
        titleKey="messaging.deleteTitle"
        bodyKey="messaging.deleteBody"
        cancelKey="social.cancel"
        confirmKey="messaging.delete"
      />
      <kx-confirm-dialog
        #discard
        dialogId="discard-message"
        titleKey="messaging.discardTitle"
        bodyKey="messaging.discardBody"
        cancelKey="social.cancel"
        confirmKey="messaging.discard"
      /> </ng-container
  ></kx-social-page-frame>`,
})
export class ConversationPage {
  readonly store = inject(MessagesStore);
  readonly auth = inject(AuthService);
  private readonly language = inject(LanguageService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private readonly history = viewChild<ElementRef<HTMLDivElement>>('history');
  private readonly discard = viewChild.required<ConfirmDialogComponent>('discard');
  private readonly deleteDialog = viewChild.required<ConfirmDialogComponent>('deleteDialog');
  readonly content = new FormControl('', { nonNullable: true });
  readonly peer = computed(() =>
    this.store.inbox().find((row) => row.conversation_id === this.store.active()),
  );
  private lastMessage = '';
  composing = false;
  constructor() {
    bindProfilePage('messaging.conversation');
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.content.reset('');
      this.lastMessage = '';
      this.store.select(params.get('id') ?? '');
    });
    effect(() => {
      this.auth.sessionEpoch();
      this.content.reset('');
    });
    effect(() => {
      const disabled =
        !this.peer()?.can_send || this.store.sending() || this.store.uncertain() || !!this.store.error();
      disabled ? this.content.disable({ emitEvent: false }) : this.content.enable({ emitEvent: false });
    });
    effect(() => {
      const last = this.store.messages().at(-1)?.id ?? '',
        element = this.history()?.nativeElement;
      const atBottom = !element || element.scrollHeight - element.scrollTop - element.clientHeight < 80;
      const follow = !this.lastMessage || (last !== this.lastMessage && atBottom);
      this.lastMessage = last;
      if (follow && last)
        afterNextRender(
          () => {
            const target = this.history()?.nativeElement;
            if (target && !this.destroy.destroyed) target.scrollTop = target.scrollHeight;
          },
          { injector: this.injector },
        );
    });
  }
  day(value: string) {
    return new Date(value).toLocaleDateString('en-CA');
  }
  date(value: string) {
    return new Intl.DateTimeFormat(this.language.language(), { dateStyle: 'long' }).format(new Date(value));
  }
  time(value: string) {
    return new Intl.DateTimeFormat(this.language.language(), { hour: '2-digit', minute: '2-digit' }).format(
      new Date(value),
    );
  }
  async older() {
    const element = this.history()?.nativeElement,
      top = element?.scrollTop ?? 0,
      height = element?.scrollHeight ?? 0;
    await this.store.older();
    this.document.defaultView?.requestAnimationFrame(() => {
      if (element && !this.destroy.destroyed) element.scrollTop = top + element.scrollHeight - height;
    });
  }
  async remove(id: string) {
    const epoch = this.auth.sessionEpoch(),
      conv = this.store.active();
    if (
      (await this.deleteDialog().ask()) &&
      !this.destroy.destroyed &&
      epoch === this.auth.sessionEpoch() &&
      conv === this.store.active()
    )
      await this.store.remove(id);
  }
  async send(event: Event) {
    event.preventDefault();
    if (this.composing || this.content.disabled || this.store.sending()) return;
    if (!this.content.value.trim()) {
      this.store.mutationError.set('messaging.errors.content');
      return;
    }
    const value = this.content.value,
      conv = this.store.active(),
      epoch = this.auth.sessionEpoch();
    if (
      (await this.store.send(value)) &&
      !this.destroy.destroyed &&
      epoch === this.auth.sessionEpoch() &&
      conv === this.store.active()
    ) {
      this.content.reset('');
      this.document.getElementById('dm-content')?.focus();
    }
  }
  shortcut(event: KeyboardEvent) {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey) && !event.isComposing)
      void this.send(event);
  }
  async discardUncertain() {
    const conv = this.store.active(),
      epoch = this.auth.sessionEpoch();
    if (
      (await this.discard().ask()) &&
      !this.destroy.destroyed &&
      conv === this.store.active() &&
      epoch === this.auth.sessionEpoch()
    ) {
      this.content.reset('');
      this.store.uncertain.set(false);
      this.store.mutationError.set('');
    }
  }
  canLeave(): boolean | Promise<boolean> {
    if (!this.auth.session() || !this.content.value.trim()) return true;
    return this.store.sending() ? false : this.discard().ask();
  }
  @HostListener('window:beforeunload', ['$event']) beforeUnload(event: BeforeUnloadEvent) {
    if (this.auth.session() && this.content.value.trim()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }
}
