import { afterNextRender, Directive, ElementRef, inject, OnDestroy } from '@angular/core';
@Directive({ selector: '[kxReveal]', standalone: true })
export class RevealDirective implements OnDestroy {
  private observer?: IntersectionObserver;
  private readonly host = inject(ElementRef<HTMLElement>);
  constructor() {
    afterNextRender(() => {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window))
        return;
      const element = this.host.nativeElement;
      // Content is visible by default if JS/observer fails; only offscreen sections get animated.
      if (element.getBoundingClientRect().top < innerHeight) return;
      element.classList.add('reveal-pending');
      this.observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            element.classList.remove('reveal-pending');
            this.observer?.disconnect();
          }
        },
        { threshold: 0.08 },
      );
      this.observer.observe(element);
    });
  }
  ngOnDestroy() {
    this.observer?.disconnect();
  }
}
