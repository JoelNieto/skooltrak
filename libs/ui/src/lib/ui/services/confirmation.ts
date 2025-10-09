import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ConfirmationDialog } from '../components/confirmation-dialog';
import { DialogData } from '../types/dialog.type';
import { Modal } from './modal';

@Injectable({
  providedIn: 'root',
})
export class Confirmation {
  private modalService = inject(Modal);

  /**
   * Opens a confirmation dialog
   *
   * @param options DialogData
   * @returns Observable<boolean>
   */
  public confirm(options: DialogData): Observable<boolean> {
    return new Observable<boolean>((subscriber) => {
      const modalRef = this.modalService.open<boolean, ConfirmationDialog>(
        ConfirmationDialog,
        {
          title: options.title,
          size: 'small',
          showCloseButton: false,
          data: options,
        }
      );

      modalRef.closed.subscribe((result) => {
        subscriber.next(result);
        subscriber.complete();
      });
    });
  }
}
