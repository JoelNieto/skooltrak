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
 *   <ui-field label="Género" [field]="studentForm.gender" optional>
 *     <select uiSelect [formField]="studentForm.gender">…</select>
 *   </ui-field>
 *
 *   <!-- checkbox / toggle / radio: control and label on one line -->
 *   <ui-choice label="Publicada" [field]="gradeForm.published">
 *     <input type="checkbox" uiCheckbox [formField]="gradeForm.published" />
 *   </ui-choice>
 *   <ui-choice label="Permitir respuestas" hint="Los padres pueden contestar">
 *     <input type="checkbox" uiToggle [(ngModel)]="repliesAllowed" />
 *   </ui-choice>
 *
 *   <!-- ngModel / reactive forms / server errors -->
 *   <ui-field label="Buscar" [error]="searchError()">
 *     <input uiInput [(ngModel)]="query" />
 *   </ui-field>
 *
 * `ui-field` (label above) and `ui-choice` (label beside) render the label (linked to the
 * control), a required marker, and either the hint or the first error. With a signal-forms
 * `[field]`, the error appears once the field is touched; an `[error]` string shows as soon as it
 * is set. The control inside receives `id`, `aria-invalid` and `aria-describedby` automatically; an
 * explicit `id` on the control is respected.
 *
 * Control directives also work on their own (a table's row checkbox, a filter input): they style
 * the element and skip the wiring when there is no enclosing field.
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

/** State shared by ui-field and ui-choice: ids, required marker, hint/error and invalid state. */
@Directive()
abstract class UiFieldBase implements UiFieldContext {
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

const MESSAGE_STYLES = `
  .ui-field-required {
    color: var(--color-error);
    margin-left: 0.125rem;
  }
  .ui-field-optional {
    color: var(--ui-ink-subtle);
    font-weight: 400;
    margin-left: 0.25rem;
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
`;

/** Label above the control: text inputs, selects, textareas, editors. */
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
        } @else if (optional()) {
          <span class="ui-field-optional">(opcional)</span>
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
      font-weight: 600; /* type-label */
      color: var(--ui-ink-strong);
    }
    ${MESSAGE_STYLES}
  `,
})
export class UiField extends UiFieldBase {
  /** Marks the field "(opcional)" next to the label (ignored when the field is required). */
  readonly optional = input(false, { transform: booleanAttribute });
}

/** Label beside the control: checkbox, toggle, radio. Hint and error sit under the label. */
@Component({
  selector: 'ui-choice',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: UI_FIELD, useExisting: forwardRef(() => UiChoice) }],
  host: { class: 'ui-choice' },
  template: `
    <ng-content />
    <div class="ui-choice-text">
      @if (label()) {
        <label class="ui-choice-label" [attr.for]="controlId()">
          {{ label() }}
          @if (isRequired()) {
            <span class="ui-field-required" aria-hidden="true">*</span>
          }
        </label>
      }
      @if (invalid()) {
        <p class="ui-field-error" [id]="errorId" aria-live="polite">{{ errorMessage() }}</p>
      } @else if (hint()) {
        <p class="ui-field-hint" [id]="hintId">{{ hint() }}</p>
      }
    </div>
  `,
  styles: `
    :host {
      display: flex;
      align-items: flex-start;
      gap: 0.625rem;
      min-width: 0;
    }
    .ui-choice-text {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
      min-width: 0;
      /* centre the first line of text on the control (controls are 1.25rem–1.5rem tall) */
      padding-top: 0.125rem;
    }
    .ui-choice-label {
      font-size: 0.875rem;
      line-height: 1.25rem;
      font-weight: 600; /* type-label */
      color: var(--ui-ink-strong);
      cursor: pointer;
    }
    ${MESSAGE_STYLES}
  `,
})
export class UiChoice extends UiFieldBase {}

/**
 * Shared wiring between a control and its enclosing ui-field / ui-choice: `controlId()`,
 * `invalid()` and `describedBy()`. The control directives below extend it; a custom control
 * component (e.g. ui-combobox) extends it too and binds them to its inner native element.
 */
@Directive()
export abstract class UiControl {
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

/** Control height: `md` (default) for forms; `sm`/`xs` for filters and dense table rows. */
export type UiControlSize = 'xs' | 'sm' | 'md' | 'lg';

/**
 * Text input or textarea: `<input uiInput …>` · `<textarea uiInput …>`.
 * `size` sets the height; `ghost` drops the border and fill (inline editing, a message subject line).
 */
@Directive({
  selector: 'input[uiInput], textarea[uiInput]',
  host: {
    class: 'ui-control',
    '[attr.id]': 'controlId()',
    '[attr.aria-invalid]': 'invalid() || null',
    '[attr.aria-describedby]': 'describedBy()',
    '[class.input]': '!isTextarea',
    '[class.textarea]': 'isTextarea',
    '[class.input-xs]': "!isTextarea && size() === 'xs'",
    '[class.input-sm]': "!isTextarea && size() === 'sm'",
    '[class.input-lg]': "!isTextarea && size() === 'lg'",
    '[class.textarea-xs]': "isTextarea && size() === 'xs'",
    '[class.textarea-sm]': "isTextarea && size() === 'sm'",
    '[class.textarea-lg]': "isTextarea && size() === 'lg'",
    '[class.input-ghost]': '!isTextarea && ghost()',
    '[class.textarea-ghost]': 'isTextarea && ghost()',
  },
})
export class UiInput extends UiControl {
  protected readonly isTextarea = inject(ElementRef).nativeElement.tagName === 'TEXTAREA';
  readonly size = input<UiControlSize>('md');
  readonly ghost = input(false, { transform: booleanAttribute });
}

/** Native select: `<select uiSelect …>`. */
@Directive({
  selector: 'select[uiSelect]',
  host: {
    class: 'ui-control select',
    '[attr.id]': 'controlId()',
    '[attr.aria-invalid]': 'invalid() || null',
    '[attr.aria-describedby]': 'describedBy()',
    '[class.select-xs]': "size() === 'xs'",
    '[class.select-sm]': "size() === 'sm'",
    '[class.select-lg]': "size() === 'lg'",
  },
})
export class UiSelect extends UiControl {
  readonly size = input<UiControlSize>('md');
}

/**
 * A text box with an icon or other content beside the input, e.g. a search box:
 *
 *   <label uiInputGroup>
 *     <span class="material-symbols-outlined" aria-hidden="true">search</span>
 *     <input type="search" placeholder="Buscar…" aria-label="Buscar" [(ngModel)]="query" />
 *   </label>
 *
 * The wrapper carries the border and focus ring; the inner `<input>` stays unstyled (no uiInput).
 */
@Directive({
  selector: 'label[uiInputGroup], div[uiInputGroup]',
  host: {
    class: 'ui-control ui-input-group input',
    '[class.input-xs]': "size() === 'xs'",
    '[class.input-sm]': "size() === 'sm'",
    '[class.input-lg]': "size() === 'lg'",
  },
})
export class UiInputGroup {
  readonly size = input<UiControlSize>('md');
}

/**
 * Colour of a checked checkbox / toggle / radio. `action` (default) follows the school's primary
 * colour; the status tones are for controls whose value carries meaning (e.g. a habit rating).
 */
export type UiChoiceTone = 'action' | 'success' | 'warning' | 'danger' | 'neutral';
export type UiChoiceSize = 'sm' | 'md';

/** Shared inputs for the choice controls. */
@Directive()
abstract class UiChoiceControl extends UiControl {
  readonly tone = input<UiChoiceTone>('action');
  readonly size = input<UiChoiceSize>('md');
}

/** `<input type="checkbox" uiCheckbox …>`. Supports `[indeterminate]` like any native checkbox. */
@Directive({
  selector: 'input[uiCheckbox]',
  // Host bindings are written out per directive: Angular's compiler needs literal host metadata.
  host: {
    class: 'ui-choice-control checkbox',
    '[attr.id]': 'controlId()',
    '[attr.aria-invalid]': 'invalid() || null',
    '[attr.aria-describedby]': 'describedBy()',
    '[class.checkbox-primary]': "tone() === 'action'",
    '[class.checkbox-success]': "tone() === 'success'",
    '[class.checkbox-warning]': "tone() === 'warning'",
    '[class.checkbox-error]': "tone() === 'danger'",
    '[class.checkbox-sm]': "size() === 'sm'",
  },
})
export class UiCheckbox extends UiChoiceControl {}

/** On/off switch for settings that apply immediately: `<input type="checkbox" uiToggle …>`. */
@Directive({
  selector: 'input[uiToggle]',
  host: {
    class: 'ui-choice-control toggle',
    '[attr.id]': 'controlId()',
    '[attr.aria-invalid]': 'invalid() || null',
    '[attr.aria-describedby]': 'describedBy()',
    '[class.toggle-primary]': "tone() === 'action'",
    '[class.toggle-success]': "tone() === 'success'",
    '[class.toggle-warning]': "tone() === 'warning'",
    '[class.toggle-error]': "tone() === 'danger'",
    '[class.toggle-sm]': "size() === 'sm'",
  },
})
export class UiToggle extends UiChoiceControl {}

/** `<input type="radio" uiRadio name="…" value="…">`. Group radios with a shared `name`. */
@Directive({
  selector: 'input[uiRadio]',
  host: {
    class: 'ui-choice-control radio',
    '[attr.id]': 'controlId()',
    '[attr.aria-invalid]': 'invalid() || null',
    '[attr.aria-describedby]': 'describedBy()',
    '[class.radio-primary]': "tone() === 'action'",
    '[class.radio-success]': "tone() === 'success'",
    '[class.radio-warning]': "tone() === 'warning'",
    '[class.radio-error]': "tone() === 'danger'",
    '[class.radio-sm]': "size() === 'sm'",
  },
})
export class UiRadio extends UiChoiceControl {}
