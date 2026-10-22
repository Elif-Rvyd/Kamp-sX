import { DOCUMENT } from '@angular/common';
import { Directive, ElementRef, effect, inject, input, untracked } from '@angular/core';
import { AuthService } from '../../core/auth.service';
import { PostViewsService } from '../../core/post-views.service';

/** A view requires at least half of the card to remain visible for one second in a visible tab. */
@Directive({ selector: '[kxPostView]', standalone: true })
export class PostViewDirective {
  readonly id = input.required<string>({ alias: 'kxPostView' });
  private readonly document = inject(DOCUMENT);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly auth = inject(AuthService);
  private readonly views = inject(PostViewsService);
  constructor() {
    effect((cleanup) => {
      const id = this.id(),
        epoch = this.auth.sessionEpoch(),
        owner = this.auth.session()?.user.id;
      if (!owner) return;
      untracked(() => this.views.load(id));
      let visible = false,
        done = false,
        timer: ReturnType<typeof setTimeout> | undefined;
      const update = () => {
        if (timer) clearTimeout(timer);
        timer = undefined;
        if (visible && !done && this.document.visibilityState === 'visible')
          timer = setTimeout(() => {
            if (epoch !== this.auth.sessionEpoch() || owner !== this.auth.session()?.user.id) return;
            done = true;
            this.views.viewed(id);
          }, 1000);
      };
      if (typeof IntersectionObserver === 'undefined') return;
      const observer = new IntersectionObserver(
        (entries) => {
          visible = entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.5);
          update();
        },
        { threshold: [0.5] },
      );
      observer.observe(this.element.nativeElement);
      this.document.addEventListener('visibilitychange', update);
      cleanup(() => {
        observer.disconnect();
        if (timer) clearTimeout(timer);
        this.document.removeEventListener('visibilitychange', update);
      });
    });
  }
}
