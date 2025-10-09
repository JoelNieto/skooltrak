import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  viewChild,
  ViewContainerRef,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { phosphorX } from '@ng-icons/phosphor-icons/regular';
@Component({
  selector: 'lib-modal',
  imports: [NgClass, NgIcon],
  viewProviders: [provideIcons({ phosphorX })],
  template: `<dialog #dialog class="modal">
    <div
      class="modal-content modal-box"
      [ngClass]="{
      'sm:w-1/3 sm:max-w-sm w-[90vw]': size() === 'small',
      'sm:w-2/3 sm:max-w-2xl w-[90vw]': size() === 'medium',
      'sm:w-11/12 sm:max-w-6xl w-[90vw]': size() === 'large',
      'sm:w-full sm:max-w-[90vw] w-[90vw]': size() === 'full',
    }"
    >
      <form method="dialog">
        @if(showCloseButton()) {
        <button class="btn btn-sm btn-circle btn-ghost absolute right-4 top-6">
          <ng-icon name="phosphorX" class="text-xl" />
        </button>
        }
      </form>
      <h3 class="text-lg font-bold">{{ title() }}</h3>
      <ng-container #content></ng-container>
    </div>
  </dialog>`,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Modal {
  public title = input<string>();
  public size = input<'small' | 'medium' | 'large' | 'full'>();
  public showCloseButton = input<boolean>();
  dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  contentContainer = viewChild.required('content', { read: ViewContainerRef });
  contentInputs = input<Record<string, unknown>>({});
  closed = output<any>();

  open() {
    this.dialog().nativeElement.showModal();
  }

  close(result?: any) {
    this.dialog().nativeElement.close();
    this.closed.emit(result);
  }
}
