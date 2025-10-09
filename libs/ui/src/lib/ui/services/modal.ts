import {
  ApplicationRef,
  ComponentRef,
  createComponent,
  EnvironmentInjector,
  inject,
  Injectable,
  Injector,
  runInInjectionContext,
  Type,
} from '@angular/core';
import { Subject } from 'rxjs';
import { Modal as ModalComponent } from '../components/modal';

type ModalRef<T> = {
  closed: Subject<T>;
  close: (result?: T) => void;
};

// A minimal shape for Angular output emitters used here
type OutputLike = {
  subscribe?: (fn: (value: unknown) => void) => unknown;
};

function isOutputEmitterRef(value: unknown): value is OutputLike {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as { constructor?: { name?: string } };
  return v.constructor?.name === 'OutputEmitterRef';
}
@Injectable({
  providedIn: 'root',
})
export class Modal {
  private modalComponentRef: ComponentRef<ModalComponent> | null = null;
  private appRef = inject(ApplicationRef);
  private environmentInjector = inject(EnvironmentInjector);

  /**
   * Opens a modal
   *
   * @param component
   * @param options
   * @returns ModalRef<T>
   */
  open<T, C>(
    component: Type<C>,
    options: {
      data?: Record<string, unknown>;
      title?: string;
      showCloseButton?: boolean;
      injector?: Injector;
      size?: 'small' | 'medium' | 'large' | 'full';
      environmentInjector?: EnvironmentInjector;
    } = {}
  ): ModalRef<T> {
    return runInInjectionContext(this.environmentInjector, () => {
      this.close();
      const { injector, environmentInjector, data } = options;
      const resultSubject = new Subject<T>();
      const callerInjector = injector || inject(Injector);
      const envInjector = environmentInjector || this.environmentInjector;
      const defaultOptions = {
        title: '',
        showCloseButton: true,
        size: 'medium',
      };

      const finalOptions = { ...defaultOptions, ...options };
      const { title, showCloseButton } = finalOptions;

      const modalRef = createComponent(ModalComponent, {
        environmentInjector: envInjector,
      });
      this.modalComponentRef = modalRef;

      const contentComponentRef = modalRef.instance
        .contentContainer()
        .createComponent(component, {
          injector: callerInjector,
        });

      if (data) {
        contentComponentRef.setInput('data', data);
      }

      const instance = contentComponentRef.instance;
      const outputProperties = Object.entries(
        instance as Record<string, unknown>
      ).filter(([, value]) => isOutputEmitterRef(value));

      outputProperties.forEach(([key, outputRef]) => {
        const emitter = outputRef as OutputLike;
        emitter.subscribe?.((value: unknown) => {
          if (key === 'closeModal') {
            this.close(value);
          }
        });
      });

      modalRef.setInput('title', title ?? '');
      modalRef.setInput('size', finalOptions.size);
      modalRef.setInput('showCloseButton', showCloseButton);
      modalRef.instance.closed.subscribe((result: T) => {
        resultSubject.next(result);
        resultSubject.complete();
        this.cleanup();
      });

      this.appRef.attachView(modalRef.hostView);
      document.body.appendChild(modalRef.location.nativeElement);
      modalRef.instance.open();

      return {
        closed: resultSubject,
        close: (result?: unknown) =>
          this.modalComponentRef?.instance.close(result),
      };
    });
  }

  close(result?: unknown): void {
    if (this.modalComponentRef) {
      this.modalComponentRef.instance.close(result);
    }
    this.cleanup();
  }

  private cleanup() {
    if (this.modalComponentRef) {
      this.appRef.detachView(this.modalComponentRef.hostView);
      this.modalComponentRef.destroy();
      this.modalComponentRef = null;
    }
  }
}
