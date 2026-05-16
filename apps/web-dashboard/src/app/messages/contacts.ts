import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { httpResource } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
export type Contact = {
  id: string;
  initials: string;
  avatar?: string;
  name: string;
  email: string;
  color?: string;
  role: { name: string };
  student?: { id: string };
  teacher?: { id: string };
};

export interface SelectedContact extends Contact {
  isValid: boolean;
}
@Component({
  selector: 'app-contacts',
  imports: [FormsModule],

  template: ` <div class="relative w-full min-h-12 bg-white px-3 py-2">
      <div class="flex flex-wrap gap-2 items-center">
        @for (contact of selectedContacts(); track contact.id) {
          <div
            [class]="contact.isValid ? 'badge-neutral' : 'badge-error'"
            class="badge badge-soft inline-flex items-center px-2 py-1 font-medium transition-all duration-200 hover:shadow-sm"
          >
            <span class="material-symbols-outlined text-base!">person</span>
            <span class="mr-1">{{ contact.name }}</span>
            <button
              type="button"
              (click)="removeContact(contact)"
              [class]="contact.isValid ? 'text-neutral' : 'text-error'"
              class="rounded-full flex items-center justify-center transition-colors cursor-pointer"
            >
              ×
            </button>
          </div>
        }
        <!-- Input field -->
        <div class="flex-1 min-w-[150px]">
          <input
            #inputElement
            type="text"
            [value]="inputValue()"
            (input)="onInputChange($event)"
            (keydown)="onKeyDown($event)"
            (blur)="onBlur()"
            placeholder="Agregar destinatario..."
            class="w-full h-8 outline-none bg-transparent text-gray-900 placeholder-gray-500"
          />
        </div>
      </div>

      <!-- Dropdown menu -->
      @if (showDropdown() && filteredContacts().length > 0) {
        <div
          class="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto"
        >
          @for (contact of filteredContacts(); track contact.id) {
            <div
              (mousedown)="selectContact(contact)"
              class="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
            >
              <div class="flex items-center">
                <!-- Avatar -->
                @if (contact.avatar) {
                  <div class="w-8 h-8 rounded-full bg-gray-300 mr-3 flex-shrink-0 overflow-hidden">
                    <img [src]="contact.avatar" [alt]="contact.name" class="w-full h-full object-cover" />
                  </div>
                } @else {
                  <div
                    class="w-8 h-8 rounded-full text-white mr-3 flex-shrink-0 flex items-center justify-center text-sm font-medium"
                    [style.background]="contact.color"
                  >
                    {{ contact.initials }}
                  </div>

                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium text-gray-900 truncate">
                      {{ contact.name }}
                    </div>
                    <div class="text-sm text-gray-500 truncate">
                      {{ contact.email }}
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>

    @if (lastAddedContact()) {
      <div class="mt-2 alert alert-warning alert-soft flex items-center justify-between">
        <span>
          Removido: <strong>{{ lastAddedContact()?.name }}</strong>
        </span>
        <button type="button" class="btn btn-ghost btn-xs" (click)="addLatestContact()">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
    }`,
  styles: `
    :host {
      min-width: 20rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Contacts {
  inputElement = viewChild.required<ElementRef<HTMLInputElement>>('inputElement');
  contactsResource = httpResource<Contact[]>(
    () => {
      const queryText = this.inputValue();
      if (!queryText) return undefined;
      return {
        url: '/api/v1/messages/contacts',
        params: { queryText },
      };
    },
    { defaultValue: [] },
  );
  availableContacts = input<Contact[]>([]);
  selectedContacts = model<SelectedContact[]>([]);
  contactsChange = output<SelectedContact[]>();
  inputValue = signal('');
  showDropdown = signal(false);
  lastAddedContact = signal<SelectedContact | null>(null);

  filteredContacts = computed(() => {
    const contacts = this.contactsResource.value();
    if (!this.inputValue() || !contacts) {
      return [];
    }

    return contacts.filter((contact) => !this.selectedContacts().some((selected) => selected.id === contact.id));
  });

  constructor() {
    effect(() => {
      if (this.filteredContacts().length > 0) {
        this.showDropdown.set(true);
      } else {
        this.showDropdown.set(false);
      }
    });
  }

  onInputChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;

    this.inputValue.set(value);
  }

  selectContact(contact: { id?: string; email?: string; [key: string]: unknown }): void {
    if (!contact?.id || !contact?.email) return;
    const selectedContact: SelectedContact = {
      ...contact,
      isValid: this.validateEmail(contact.email),
    } as SelectedContact;

    this.selectedContacts.update((prev) => [...prev, selectedContact]);
    this.inputValue.set('');
    this.showDropdown.set(false);
    this.contactsChange.emit(this.selectedContacts());
    this.focusInput();
  }

  addLatestContact() {
    this.selectedContacts.update((prev) => [...prev, this.lastAddedContact()!]);
    this.lastAddedContact.set(null);
    this.contactsChange.emit(this.selectedContacts());
  }

  removeContact(contact: SelectedContact): void {
    this.selectedContacts.update((prev) => prev.filter((c) => c.id !== contact.id));
    this.contactsChange.emit(this.selectedContacts());
    this.focusInput();
  }

  removeLastContact(): void {
    if (this.inputValue() === '' && this.selectedContacts().length > 0) {
      this.lastAddedContact.set(this.selectedContacts()[this.selectedContacts().length - 1]);
      this.selectedContacts.update((prev) => prev.slice(0, -1));
      this.contactsChange.emit(this.selectedContacts());
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Backspace':
        this.removeLastContact();
        break;
      case 'Enter':
        if (this.inputValue().trim() && this.filteredContacts().length === 0) {
          this.addCustomEmail();
          event.preventDefault();
        }
        break;
      case 'Escape':
        this.showDropdown.set(false);
        break;
      case 'ArrowDown':
        if (this.showDropdown()) {
          event.preventDefault();
        }
        break;
    }
  }

  addCustomEmail(): void {
    const email = this.inputValue().trim();
    if (email && this.validateEmail(email)) {
      const customContact: SelectedContact = {
        id: `custom-${Date.now()}`,
        name: email,
        initials: email.charAt(0).toUpperCase(),
        role: { name: 'Custom' },
        email: email,
        isValid: true,
      };

      this.selectedContacts.update((prev) => [...prev, customContact]);
      this.inputValue.set('');
      this.contactsChange.emit(this.selectedContacts());
      this.focusInput();
    }
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  focusInput(): void {
    setTimeout(() => {
      this.inputElement().nativeElement.focus();
    });
  }

  onBlur(): void {
    setTimeout(() => {
      this.showDropdown.set(false);
    }, 200);
  }
}
