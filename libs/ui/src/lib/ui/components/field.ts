import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  Directive,
  effect,
  ElementRef,
  forwardRef,
  inject,
  InjectionToken,
  input,
  Signal,
  signal,
} from '@angular/core';

/**
 * Form field primitives.
 *
 *   <ui-field label="Nombre" [field]="studentForm.firstName" hint="Como aparece en la cédula">
 *     <input uiInput [formField]="studentForm.firstName" />
 *   </ui-field>
 *
 *   <ui-field label="Género" [field]="studentForm.gender">
 *     <select uiSelect [formField]="studentForm.gender">…</select>
 *   </ui-field>
 *
 *   <!-- ngModel / reactive forms / server errors -->
 *   <ui-field label="Buscar" [error]="searchError()">
 *     <input uiInput [(ngModel)]="query" />
 *   </ui-field>
 *
 * `ui-field` renders the label (linked to the control), a required marker, and either the hint or
 * the first error. With a signal-forms `[field]`, the error appears once the field is touched; an
 * `[error]` string shows as soon as it is set. The control inside receives `id`, `aria-invalid`
 * and `aria-describedby` automatically; an explicit `id` on the control is respected.
 */

/** The part of a signal-forms FieldState the wrapper reads (a FieldTree returns one when called). */
export interface UiFieldState {
  touched(): boolean;
  invalid(): boolean;
  required(): boolean;
  errors(): readonly { message?: string; kind?: string }[];
}

interface UiFieldContext {
  readonly controlId: Signal<string>;
  readonly describedBy: Signal<string | null>;
  readonly invalid: Signal<boolean>;
  useControlId(id: string): void;
}

const UI_FIELD = new InjectionToken<UiFieldContext>('UI_FIELD');

let nextFieldId = 0;

@Component({
  selector: 'ui-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: UI_FIELD, useExisting: forwardRef(() => UiField) }],
  host: { class: 'ui-field' },
  template: `
    @if (label()) {
      <label class="ui-field-label" [attr.for]="controlId()">
        {{ label() }}
        @if (isRequired()) {
          <span class="ui-field-required" aria-hidden="true">*</span>
        }
      </label>
    }
    <ng-content />
    @if (invalid()) {
      <p class="ui-field-error" [id]="errorId" aria-live="polite">{{ errorMessage() }}</p>
    } @else if (hint()) {
      <p class="ui-field-hint" [id]="hintId">{{ hint() }}</p>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
      min-width: 0;
    }
    .ui-field-label {
      font-size: 0.875rem;
      line-height: 1.25rem;
      font-weight: 500;
      color: var(--ui-ink-strong);
    }
    .ui-field-required {
      color: var(--color-error);
      margin-left: 0.125rem;
    }
    .ui-field-hint,
    .ui-field-error {
      font-size: 0.75rem;
      line-height: 1rem;
      margin: 0;
    }
    .ui-field-hint {
      color: var(--ui-ink-muted);
    }
    .ui-field-error {
      color: var(--color-error);
    }
  `,
})
export class UiField implements UiFieldContext {
  readonly label = input<string>();
  readonly hint = input<string>();
  /** A signal-forms field (`form.email`): drives the required marker and touched/invalid errors. */
  readonly field = input<() => UiFieldState>();
  /** Error text for forms without signal-forms state. Shown whenever it is non-empty. */
  readonly error = input<string | null | undefined>();
  /** Shows the required marker when there is no signal-forms field to read it from. */
  readonly required = input(false, { transform: booleanAttribute });

  private readonly id = `ui-field-${nextFieldId++}`;
  readonly hintId = `${this.id}-hint`;
  readonly errorId = `${this.id}-error`;
  private readonly controlIdState = signal(`${this.id}-control`);
  readonly controlId = this.controlIdState.asReadonly();

  private readonly state = computed(() => this.field()?.());

  readonly invalid = computed(() => {
    if (this.error()) return true;
    const state = this.state();
    return !!state && state.touched() && state.invalid();
  });

  readonly errorMessage = computed(
    () =>
      this.error() ||
      this.state()
        ?.errors()
        .find((e) => e.message)?.message ||
      'Revisa este campo',
  );

  readonly isRequired = computed(() => this.required() || !!this.state()?.required());

  readonly describedBy = computed(() => (this.invalid() ? this.errorId : this.hint() ? this.hintId : null));

  useControlId(id: string): void {
    this.controlIdState.set(id);
  }
}

/** Shared wiring between a control directive and its enclosing ui-field. */
@Directive()
abstract class UiControl {
  protected readonly fieldContext = inject(UI_FIELD, { optional: true });
  /** Keeps an explicit `id` on the control; otherwise the field's generated id is used. */
  readonly id = input<string>();

  readonly controlId = computed(() => this.id() ?? this.fieldContext?.controlId() ?? null);
  readonly invalid = computed(() => this.fieldContext?.invalid() ?? false);
  readonly describedBy = computed(() => this.fieldContext?.describedBy() ?? null);

  constructor() {
    effect(() => {
      const id = this.id();
      if (id) this.fieldContext?.useControlId(id);
    });
  }
}

/** Text input or textarea: `<input uiInput …>` · `<textarea uiInput …>`. */
@Directive({
  selector: 'input[uiInput], textarea[uiInput]',
  host: {
    class: 'ui-control',
    '[attr.id]': 'controlId()',
    '[attr.aria-invalid]': 'invalid() || null',
    '[attr.aria-describedby]': 'describedBy()',
    '[class.input]': '!isTextarea',
    '[class.textarea]': 'isTextarea',
  },
})
export class UiInput extends UiControl {
  protected readonly isTextarea = inject(ElementRef).nativeElement.tagName === 'TEXTAREA';
}

/** Native select: `<select uiSelect …>`. */
@Directive({
  selector: 'select[uiSelect]',
  host: {
    class: 'ui-control select',
    '[attr.id]': 'controlId()',
    '[attr.aria-invalid]': 'invalid() || null',
    '[attr.aria-describedby]': 'describedBy()',
  },
})
export class UiSelect extends UiControl {}
