import { OverlayModule } from '@angular/cdk/overlay';
import { httpResource } from '@angular/common/http';
import { Component, effect, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

type StudentSearchItem = {
  id: string;
  name: string;
  classGroup?: { name: string } | null;
};

@Component({
  selector: 'app-student-search',
  imports: [FormsModule, OverlayModule],
  template: `
    <div class="relative flex flex-col" #origin>
      <div class="flex relative items-center input input-primary w-full max-w-md">
        @if (selectedStudent(); as s) {
          <span class="badge badge-primary gap-2">
            {{ s.name }}
            <button
              type="button"
              class="btn btn-ghost btn-xs btn-square"
              aria-label="Quitar selección"
              (click)="clearSelection()"
            >
              <span class="material-symbols-outlined text-sm">close</span>
            </button>
          </span>
        } @else {
          <span class="material-symbols-outlined text-base-content/50">search</span>
          <input
            #input
            autocomplete="off"
            placeholder="Buscar alumno por nombre o documento..."
            class="w-full"
            [ngModel]="query()"
            (ngModelChange)="onQuery($event)"
            (focus)="opened.set(true)"
            (focusout)="opened.set(false)"
          />
        }
      </div>
      <ng-template
        [cdkConnectedOverlay]="{ origin, usePopover: 'inline', matchWidth: true }"
        [cdkConnectedOverlayOpen]="opened() && !selectedStudent()"
      >
        <div
          class="popup bg-base-100 border border-base-300 rounded-box w-full shadow-lg mt-1 max-h-64 overflow-auto z-50"
        >
          @if (results.isLoading()) {
            <div class="p-3 text-base-content/50">Buscando...</div>
          } @else if (debouncedQuery().trim().length >= 2 && results.value().length === 0) {
            <div class="p-3 text-base-content/50">Sin resultados</div>
          } @else if (debouncedQuery().trim().length < 2) {
            <div class="p-3 text-base-content/50">Escribe al menos 2 caracteres</div>
          }
          @for (s of results.value(); track s.id) {
            <button
              type="button"
              class="w-full text-left p-3 cursor-pointer hover:bg-base-200 flex items-center justify-between gap-2"
              (mousedown)="$event.preventDefault()"
              (click)="choose(s)"
            >
              <span class="font-medium">{{ s.name }}</span>
              @if (s.classGroup?.name) {
                <span class="text-xs text-base-content/50">{{ s.classGroup.name }}</span>
              }
            </button>
          }
        </div>
      </ng-template>
    </div>
  `,
})
export default class StudentSearch {
  public selected = output<{ id: string; name: string }>();

  public query = signal('');
  public debouncedQuery = signal('');
  public opened = signal(false);
  public selectedStudent = signal<StudentSearchItem | null>(null);

  private input = viewChild<HTMLInputElement>('input');
  #debounceTimer: ReturnType<typeof setTimeout> | null = null;

  public results = httpResource<StudentSearchItem[]>(
    () => {
      const q = this.debouncedQuery().trim();
      if (q.length < 2) return undefined;
      return { url: '/api/v1/students', params: { search: q, take: 10 } };
    },
    { defaultValue: [] },
  );

  constructor() {
    effect(() => {
      const q = this.query();
      if (this.#debounceTimer) clearTimeout(this.#debounceTimer);
      this.#debounceTimer = setTimeout(() => this.debouncedQuery.set(q), 300);
    });
  }

  public onQuery(value: string) {
    this.query.set(value);
  }

  public choose(student: StudentSearchItem) {
    this.selectedStudent.set(student);
    this.query.set('');
    this.debouncedQuery.set('');
    this.opened.set(false);
    this.selected.emit({ id: student.id, name: student.name });
  }

  public clearSelection() {
    this.selectedStudent.set(null);
    this.query.set('');
    this.debouncedQuery.set('');
    this.selected.emit({ id: '', name: '' });
    this.input()?.focus();
  }
}
