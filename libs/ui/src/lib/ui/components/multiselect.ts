import {
  Component,
  ElementRef,
  forwardRef,
  input,
  OnDestroy,
  OnInit,
  output,
  viewChild,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';

type MultiSelectOption = {
  value: string | number;
  label: string;
  disabled?: boolean;
};

@Component({
  selector: 'lib-multiselect',
  imports: [ReactiveFormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MultiSelect),
      multi: true,
    },
  ],
  template: `<div class="relative" #dropdown>
    <!-- Selected Pills Display -->
    <div
      class="min-h-12 p-2 border border-base-300 rounded-lg bg-base-100 cursor-pointer"
      (click)="toggleDropdown()"
      (keydown.enter)="toggleDropdown()"
      (keydown.space)="$event.preventDefault(); toggleDropdown()"
      [class.border-primary]="isOpen"
      role="combobox"
      [attr.aria-expanded]="isOpen"
      [attr.aria-haspopup]="'listbox'"
      [attr.aria-labelledby]="'multiselect-label'"
      [attr.aria-controls]="'multiselect-options'"
      tabindex="0"
      #dropdownTrigger
    >
      <!-- Selected Pills -->
      <div class="flex flex-wrap gap-1 mb-1">
        @for (value of selectedValues; track value) { @let option =
        getOptionByValue(value); @if (pillVariant() === 'badge') {
        <div class="flex items-center gap-1">
          <div class="badge badge-primary gap-1 px-3 py-2">
            {{ option?.label || value }}
            <button
              class="btn btn-xs btn-circle btn-ghost"
              (click)="removeSelection(value, $event)"
              (keydown.enter)="removeSelection(value, $event)"
              (keydown.space)="
                $event.preventDefault(); removeSelection(value, $event)
              "
              [attr.aria-label]="'Remove ' + (option?.label || value)"
              type="button"
            >
              <span aria-hidden="true">✕</span>
            </button>
          </div>
        </div>
        } @else {
        <div class="flex items-center gap-1">
          <div class="badge badge-outline gap-1 px-3 py-2">
            {{ option?.label || value }}
            <button
              class="btn btn-xs btn-circle btn-ghost"
              (click)="removeSelection(value, $event)"
              (keydown.enter)="removeSelection(value, $event)"
              (keydown.space)="
                $event.preventDefault(); removeSelection(value, $event)
              "
              [attr.aria-label]="'Remove ' + (option?.label || value)"
              type="button"
            >
              <span aria-hidden="true">✕</span>
            </button>
          </div>
        </div>
        } }
      </div>

      <!-- Placeholder/Input Area -->
      <div class="flex items-center justify-between">
        @if (selectedValues.length === 0) {
        <span id="multiselect-label" class="text-base-content/50 text-sm">{{
          placeholder()
        }}</span>
        }
        <button
          class="btn btn-sm btn-ghost btn-circle ml-auto"
          [attr.aria-label]="isOpen ? 'Close dropdown' : 'Open dropdown'"
          type="button"
        >
          <span aria-hidden="true">{{ isOpen ? '▲' : '▼' }}</span>
        </button>
      </div>
    </div>

    <!-- Dropdown Menu -->
    @if (isOpen) {
    <div
      class="absolute z-50 mt-1 w-full"
      [class]="dropdownPosition() === 'top' ? 'bottom-full mb-1' : 'top-full'"
      (keydown)="onKeyDown($event)"
      tabindex="-1"
      role="listbox"
      aria-labelledby="multiselect-label"
      [attr.aria-expanded]="isOpen"
      [attr.aria-hidden]="!isOpen"
    >
      <div
        class="card card-compact bg-base-100 border border-base-300 shadow-xl max-h-96 overflow-hidden"
        id="multiselect-options"
        role="listbox"
        [attr.aria-multiselectable]="true"
      >
        <!-- Filter Input -->
        @if (showFilter()) {
        <div class="card-body p-3 border-b border-base-300">
          <div class="form-control">
            <input
              type="text"
              #filterInput
              [formControl]="filterControl"
              [placeholder]="filterPlaceholder()"
              class="input input-sm input-bordered w-full"
            />
          </div>
        </div>
        }

        <!-- Options List -->
        <div class="overflow-y-auto max-h-64">
          @if (filteredOptions.length === 0) {
          <div class="p-4 text-center text-base-content/50">
            No options found
          </div>
          } @else {
          <ul class="menu menu-compact w-full p-0">
            @for (option of filteredOptions; track option.value) {
            <li>
              <label
                class="cursor-pointer hover:bg-base-200 py-3 px-4 flex items-center"
                [class]="option.disabled ? 'opacity-50 cursor-not-allowed' : ''"
                [attr.aria-disabled]="option.disabled"
              >
                <input
                  type="checkbox"
                  class="checkbox checkbox-primary checkbox-sm"
                  [checked]="isSelected(option.value)"
                  [disabled]="
                    option.disabled ||
                    (maxSelections() &&
                      selectedValues.length >= maxSelections()! &&
                      !isSelected(option.value))
                  "
                  [id]="'option-' + option.value"
                  [attr.aria-label]="
                    option.label + (isSelected(option.value) ? ' selected' : '')
                  "
                  (change)="toggleSelection(option.value)"
                  (click)="$event.stopPropagation()"
                />

                <span
                  class="label-text ml-2"
                  [attr.for]="'option-' + option.value"
                  >{{ option.label }}</span
                >

                @if (maxSelections() && selectedValues.length >=
                maxSelections()! && !isSelected(option.value)) {
                <span class="badge badge-ghost badge-sm ml-auto">Max</span>
                }
              </label>
            </li>
            }
          </ul>
          }
        </div>

        <!-- Footer with Clear/Selected Count -->
        <div
          class="card-actions justify-between items-center p-3 border-t border-base-300"
        >
          <div class="text-sm text-base-content/70">
            {{ selectedValues.length }} selected @if (maxSelections()) { /
            {{ maxSelections() }} max }
          </div>
          @if (selectedValues.length > 0) {
          <button
            class="btn btn-xs btn-ghost"
            (click)="clearAll()"
            [attr.aria-label]="
              'Clear all ' + selectedValues.length + ' selected items'
            "
            tabindex="0"
          >
            Clear all
          </button>
          }
        </div>
      </div>
    </div>
    }
  </div>`,
  styles: `
    :host {
      display: block;
    }

    /* Custom scrollbar for dropdown */
    .dropdown-scrollbar::-webkit-scrollbar {
      width: 6px;
    }

    .dropdown-scrollbar::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 3px;
    }

    .dropdown-scrollbar::-webkit-scrollbar-thumb {
      background: #888;
      border-radius: 3px;
    }

    .dropdown-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #555;
    }
  `,
})
export class MultiSelect implements ControlValueAccessor, OnInit, OnDestroy {
  readonly options = input<MultiSelectOption[]>([]);
  readonly placeholder = input('Select options...');
  readonly filterPlaceholder = input('Filter options...');
  readonly showFilter = input(true);
  readonly maxSelections = input<number>();
  readonly pillVariant = input<'badge' | 'tag'>('badge');
  readonly dropdownPosition = input<'bottom' | 'top'>('bottom');

  selectionChange = output<(string | number)[]>();

  readonly dropdownRef = viewChild<ElementRef>('dropdown');
  readonly dropdownTrigger = viewChild<ElementRef>('dropdownTrigger');
  readonly filterInput = viewChild<ElementRef>('filterInput');

  selectedValues: (string | number)[] = [];
  filteredOptions: MultiSelectOption[] = [];
  filterControl = new FormControl('');
  isOpen = false;

  private destroy$ = new Subject<void>();
  private onChange: (value: any) => void = () => {
    /* empty */
  };
  private onTouched: () => void = () => {
    /* empty */
  };

  ngOnInit() {
    this.filteredOptions = [...this.options()];

    this.filterControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((filterText) => {
        this.applyFilter(filterText || '');
      });

    // Close dropdown when clicking outside
    document.addEventListener('click', this.handleClickOutside.bind(this));
  }

  getOptionByValue(value: string | number): MultiSelectOption | undefined {
    return this.options().find((opt) => opt.value === value);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    document.removeEventListener('click', this.handleClickOutside.bind(this));
  }

  writeValue(value: (string | number)[]): void {
    this.selectedValues = value || [];
    this.filteredOptions = [...this.options()];
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    // Implement if needed
  }

  toggleSelection(value: string | number): void {
    const index = this.selectedValues.indexOf(value);

    if (index > -1) {
      this.selectedValues.splice(index, 1);
    } else {
      const maxSelections = this.maxSelections();
      if (maxSelections && this.selectedValues.length >= maxSelections) {
        return;
      }
      this.selectedValues.push(value);
    }

    this.onChange(this.selectedValues);
    this.onTouched();
    this.selectionChange.emit(this.selectedValues);
  }

  removeSelection(value: string | number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    const index = this.selectedValues.indexOf(value);
    if (index > -1) {
      this.selectedValues.splice(index, 1);
      this.onChange(this.selectedValues);
      this.onTouched();
      this.selectionChange.emit(this.selectedValues);
    }
  }

  clearAll(): void {
    this.selectedValues = [];
    this.onChange(this.selectedValues);
    this.onTouched();
    this.selectionChange.emit(this.selectedValues);
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      if (this.showFilter() && this.filterInput()) {
        // Small timeout to ensure the input is rendered
        setTimeout(() => this.filterInput()?.nativeElement.focus(), 0);
      }
    } else {
      // Return focus to the trigger when closing
      setTimeout(() => this.dropdownTrigger()?.nativeElement.focus(), 0);
    }
  }

  closeDropdown(): void {
    this.isOpen = false;
    this.filterControl.setValue('');
  }

  applyFilter(filterText: string): void {
    if (!filterText.trim()) {
      this.filteredOptions = [...this.options()];
      return;
    }

    const searchTerm = filterText.toLowerCase();
    this.filteredOptions = this.options().filter(
      (option) =>
        option.label.toLowerCase().includes(searchTerm) ||
        option.value.toString().toLowerCase().includes(searchTerm)
    );
  }

  getSelectedLabels(): string[] {
    return this.selectedValues.map((value) => {
      const option = this.options().find((opt) => opt.value === value);
      return option ? option.label : String(value);
    });
  }

  isSelected(value: string | number): boolean {
    return this.selectedValues.includes(value);
  }

  private handleClickOutside(event: MouseEvent): void {
    const dropdownRef = this.dropdownRef();
    if (dropdownRef && !dropdownRef.nativeElement.contains(event.target)) {
      this.closeDropdown();
    }
  }

  // Keyboard navigation support
  onKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Escape':
        this.closeDropdown();
        break;
      case 'Tab':
        this.closeDropdown();
        break;
    }
  }
}
