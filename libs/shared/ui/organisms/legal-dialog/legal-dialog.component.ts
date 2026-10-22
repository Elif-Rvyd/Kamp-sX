import { ChangeDetectionStrategy, Component, ElementRef, signal, viewChild } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { IconComponent } from '../../atoms/icon/icon.component';
import { ButtonComponent } from '../../atoms/button/button.component';
@Component({
  selector: 'kx-legal-dialog',
  standalone: true,
  imports: [TranslocoDirective, IconComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<dialog
    #dialog
    class="legal-dialog"
    *transloco="let t"
    [attr.aria-labelledby]="dialogId + '-title'"
    [attr.aria-describedby]="dialogId + '-description'"
  >
    <div class="dialog-top">
      <kx-icon name="info" /><button
        class="icon-button"
        type="button"
        [attr.aria-label]="t('common.close')"
        (click)="close()"
      >
        <kx-icon name="close" />
      </button>
    </div>
    <h2 [id]="dialogId + '-title'">{{ t(titleKey()) }}</h2>
    <p [id]="dialogId + '-description'" class="legal-body">{{ t(textKey()) }}</p>
    <button kxButton type="button" (click)="close()">{{ t('common.close') }}</button>
  </dialog>`,
  styles: `
    .legal-body {
      white-space: pre-line;
      line-height: 1.8;
      overflow-wrap: anywhere;
    }
    .legal-dialog {
      max-height: 85dvh;
      overflow-y: auto;
      overscroll-behavior: contain;
    }
    h2 {
      margin-block: 16px;
    }
    .legal-body + button {
      margin-top: 20px;
    }
  `,
})
export class LegalDialogComponent {
  private static instance = 0;
  readonly dialogId = `legal-${LegalDialogComponent.instance++}`;
  readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  readonly textKey = signal('legal.text');
  readonly titleKey = signal('legal.title');
  open(key: string, titleKey?: string) {
    this.titleKey.set(
      titleKey ??
        (key === 'legal.terms'
          ? 'legal.termsTitle'
          : key === 'legal.privacy'
            ? 'legal.privacyTitle'
            : key === 'legal.cookies'
              ? 'legal.cookiesTitle'
              : 'legal.title'),
    );
    this.textKey.set(key);
    this.dialog().nativeElement.showModal();
  }
  close() {
    this.dialog().nativeElement.close();
  }
}
