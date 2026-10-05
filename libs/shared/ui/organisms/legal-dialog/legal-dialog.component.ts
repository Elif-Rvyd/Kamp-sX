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
    <h2 [id]="dialogId + '-title'">{{ t('legal.title') }}</h2>
    <p [id]="dialogId + '-description'">{{ t(textKey()) }}</p>
    <button kxButton type="button" (click)="close()">{{ t('common.close') }}</button>
  </dialog>`,
})
export class LegalDialogComponent {
  private static instance = 0;
  readonly dialogId = `legal-${LegalDialogComponent.instance++}`;
  readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  readonly textKey = signal('legal.text');
  open(key: string) {
    this.textKey.set(key);
    this.dialog().nativeElement.showModal();
  }
  close() {
    this.dialog().nativeElement.close();
  }
}
