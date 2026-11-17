import { Combobox, ComboboxPopup, ComboboxWidget } from '@angular/aria/combobox';
import { Listbox, Option } from '@angular/aria/listbox';
import { OverlayModule } from '@angular/cdk/overlay';
import {
  afterRenderEffect,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { UiControl } from './field';
import { Icon } from './icon';

export interface ComboboxOption {
  value: string;
  label: string;
}

/** Listbox value of the "Crear …" row; never emitted as the control's value. */
const CREATE = '\u0000ui-combobox-create';

/** Case- and accent-insensitive form of a label, so "matematicas" finds "Matemáticas". */
const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();

/**
 * Searchable single-select: type to filter a list of options, pick one with the mouse or the
 * arrow keys + Enter. The value is the option's `value` ('' when nothing is selected).
 *
 *   <ui-field label="Asignatura" [field]="form.subjectId">
 *     <ui-combobox [formField]="form.subjectId" [options]="subjectOptions()" placeholder="Buscar asignatura…" />
 *   </ui-field>
 *
 *   <!-- let the user add a missing option: handle (create), then set the value to the new id -->
 *   <ui-combobox [(value)]="subjectId" [options]="options()" creatable (create)="createSubject($event)" />
 *
 * Works with signal forms (`[formField]`, it is a FormValueControl), `[(value)]`, and inside
 * `ui-field` (label, hint/error and invalid state reach the inner input). Filtering is done here,
 * over the options given; pass all of them, not a server-filtered page.
 * Leaving the input with unfinished text puts back the selected option's label; clearing the
 * text (or the × button) clears the value.
 */
@Component({
  selector: 'ui-combobox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Combobox, ComboboxPopup, ComboboxWidget, Listbox, Option, OverlayModule, Icon],
  host: {
    class: 'ui-combobox',
    // The id belongs to the inner input (UiControl's `id` input); keep it off the host element.
    '[attr.id]': 'null',
  },
  template: `
    <div
      #origin
      class="ui-control input ui-combobox-field"
      [class.ui-combobox-invalid]="invalid()"
      [class.ui-combobox-disabled]="disabled()"
    >
      <ui-icon name="search" class="ui-combobox-icon" />
      <input
        #combobox="ngCombobox"
        ngCombobox
        class="ui-combobox-input"
        autocomplete="off"
        [attr.id]="controlId()"
        [attr.aria-label]="fieldContext ? null : ariaLabel() || null"
        [attr.aria-invalid]="invalid() || null"
        [attr.aria-describedby]="describedBy()"
        [placeholder]="placeholder()"
        [disabled]="disabled()"
        [(value)]="query"
        [(expanded)]="expanded"
        (click)="expanded.set(true)"
        (focusout)="onBlur()"
      />
      @if (query() && !disabled()) {
        <button
          type="button"
          class="ui-combobox-clear"
          aria-label="Borrar selección"
          (mousedown)="$event.preventDefault()"
          (click)="clear()"
        >
          <ui-icon name="x" />
        </button>
      }
    </div>
    <div aria-live="polite" class="cdk-visually-hidden">{{ status() }}</div>
    <ng-template
      [cdkConnectedOverlay]="{ origin, usePopover: 'inline', matchWidth: true }"
      [cdkConnectedOverlayOpen]="expanded()"
    >
      <ng-template ngComboboxPopup [combobox]="combobox">
        <!-- mousedown keeps focus in the input, so picking an option is not a blur -->
        <div class="ui-combobox-popup" (mousedown)="$event.preventDefault()">
          <div
            #listbox="ngListbox"
            ngListbox
            ngComboboxWidget
            focusMode="activedescendant"
            [tabindex]="-1"
            [activeDescendant]="listbox.activeDescendant()"
            [(value)]="highlighted"
            (click)="commit()"
            (keydown.enter)="commit()"
          >
            @for (option of filtered(); track option.value) {
              <div ngOption class="ui-combobox-option" [value]="option.value" [label]="option.label">
                <span class="ui-combobox-option-label">{{ option.label }}</span>
                @if (option.value === value()) {
                  <ui-icon name="check" class="ui-combobox-check" />
                }
              </div>
            }
            @if (canCreate()) {
              <div
                ngOption
                class="ui-combobox-option ui-combobox-create"
                [value]="CREATE"
                [label]="createLabel() + ' «' + query().trim() + '»'"
              >
                <ui-icon name="plus" />
                <span>
                  {{ createLabel() }} <span class="ui-combobox-create-text">«{{ query().trim() }}»</span>
                </span>
              </div>
            }
          </div>
          @if (filtered().length === 0 && !canCreate()) {
            <p class="ui-combobox-empty">{{ query().trim() ? emptyText() : hintText() }}</p>
          }
        </div>
      </ng-template>
    </ng-template>
  `,
  styles: `
    :host {
      display: block;
      position: relative;
      min-width: 0;
    }
    .ui-combobox-field {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .ui-combobox-field.ui-combobox-invalid {
      --input-color: var(--color-error);
    }
    .ui-combobox-disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .ui-combobox-icon {
      font-size: 1.125rem;
      color: var(--ui-ink-subtle);
    }
    .ui-combobox-input {
      flex: 1;
      min-width: 0;
      background: transparent;
      outline: none;
    }
    .ui-combobox-clear {
      display: inline-flex;
      border-radius: 9999px;
      padding: 0.125rem;
      color: var(--ui-ink-subtle);
      cursor: pointer;
      &:hover {
        color: var(--ui-ink-strong);
        background: var(--ui-surface-2);
      }
      ui-icon {
        font-size: 1.125rem;
      }
    }
    .ui-combobox-popup {
      box-sizing: border-box;
      width: 100%;
      margin-top: 0.25rem;
      max-height: 15rem;
      overflow: auto;
      padding: 0.25rem;
      border: 1px solid var(--ui-line);
      border-radius: var(--radius-field);
      background: var(--ui-surface-1);
      box-shadow: 0 10px 25px -5px rgb(0 0 0 / 0.15);
      font-size: 0.875rem;
      line-height: 1.25rem;
    }
    .ui-combobox-option {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.5rem 0.625rem;
      border-radius: 0.5rem;
      color: var(--ui-ink);
      cursor: pointer;
      &:hover,
      &[data-active='true'] {
        background: var(--ui-surface-2);
      }
    }
    .ui-combobox-option-label {
      flex: 1;
      min-width: 0;
    }
    .ui-combobox-check {
      font-size: 1.125rem;
      color: var(--color-primary);
    }
    .ui-combobox-create {
      color: var(--color-primary);
      ui-icon {
        font-size: 1.125rem;
      }
    }
    .ui-combobox-create-text {
      color: var(--ui-ink-strong);
    }
    .ui-combobox-empty {
      margin: 0;
      padding: 0.5rem 0.625rem;
      color: var(--ui-ink-muted);
    }
  `,
})
export class UiCombobox extends UiControl {
  /** Selected option's value; '' when nothing is selected. */
  readonly value = model('');
  readonly options = input<readonly ComboboxOption[]>([]);
  readonly placeholder = input('Buscar…');
  /** Accessible name when there is no ui-field label. */
  readonly ariaLabel = input<string>();
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Offers a "Crear «texto»" row when the text matches no option; picking it emits (create). */
  readonly creatable = input(false, { transform: booleanAttribute });
  readonly createLabel = input('Crear');
  readonly emptyText = input('Sin resultados');
  /** Shown in an open, empty list before anything is typed. */
  readonly hintText = input('Escribe para buscar');

  /** The text typed when "Crear" was picked. Create the option, then set the value to it. */
  readonly create = output<string>();
  /** Signal forms: marks the field touched. */
  readonly touch = output<void>();

  protected readonly CREATE = CREATE;
  protected readonly expanded = signal(false);

  private readonly selected = computed(() => this.options().find((o) => o.value === this.value()));
  /** Input text: follows the selected option's label; typing overwrites it until the next commit. */
  protected readonly query = linkedSignal(() => this.selected()?.label ?? '');
  /** Listbox selection, i.e. the highlighted option (moves with the arrow keys). */
  protected readonly highlighted = linkedSignal<string[]>(() => (this.value() ? [this.value()] : []));

  protected readonly filtered = computed(() => {
    const query = normalize(this.query());
    const options = this.options();
    // The input still shows the selected label: list everything so the user can switch.
    if (!query || this.query() === this.selected()?.label) return options;
    return options.filter((o) => normalize(o.label).includes(query));
  });

  protected readonly canCreate = computed(() => {
    const query = normalize(this.query());
    return this.creatable() && !!query && !this.options().some((o) => normalize(o.label) === query);
  });

  protected readonly status = computed(() =>
    this.expanded() && this.query().trim() && this.filtered().length === 0
      ? `${this.emptyText()} para «${this.query().trim()}»`
      : '',
  );

  private readonly input = viewChild.required<Combobox>('combobox');
  private readonly listbox = viewChild(Listbox);

  constructor() {
    super();
    afterRenderEffect(() => {
      if (this.expanded()) this.listbox()?.scrollActiveItemIntoView();
    });
  }

  /** Signal forms focuses the first invalid control on submit. */
  focus(options?: FocusOptions): void {
    this.input().element.focus(options);
  }

  protected commit(): void {
    const picked = this.highlighted()[0];
    if (picked === CREATE) {
      this.create.emit(this.query().trim());
    } else if (picked !== undefined) {
      this.value.set(picked);
      this.query.set(this.selected()?.label ?? '');
    }
    this.expanded.set(false);
    this.focus();
  }

  protected clear(): void {
    this.value.set('');
    this.query.set('');
    this.expanded.set(false);
    this.focus();
  }

  protected onBlur(): void {
    if (!this.query().trim()) this.value.set('');
    // Unfinished text goes back to the selected option's label.
    this.query.set(this.selected()?.label ?? '');
    this.touch.emit();
  }
}
