import { Button, UiCheckbox, UiChoice } from '#/ui';
import { DatePipe } from '@angular/common';
import { Component, computed, input, OnInit, output, signal } from '@angular/core';

export interface PublishableColumn {
  id: string;
  title: string;
  date: string;
  /** Changed in this session: ticked by default (FR-ASM-001.7). */
  changed: boolean;
}

/**
 * Which draft columns to publish (FR-ASM-001.7). Publishing makes them visible to students and
 * parents and notifies them. Closes with the chosen ids, or `false` when cancelled.
 */
@Component({
  selector: 'app-gradebook-publish-dialog',
  imports: [Button, DatePipe, UiCheckbox, UiChoice],
  template: `
    <div class="flex flex-col gap-4">
      <p class="text-sm text-ink">
        Los estudiantes y sus familias verán las calificaciones elegidas y recibirán un aviso. Después, cada cambio a una nota
        publicada pedirá un motivo.
      </p>
      <fieldset class="flex flex-col gap-2">
        <legend class="mb-1 text-sm font-semibold text-ink-strong">Borradores de este periodo</legend>
        @for (column of data().columns; track column.id) {
          <ui-choice [label]="column.title + ' · ' + (column.date | date: 'dd/MM' : 'UTC')">
            <input type="checkbox" uiCheckbox [checked]="chosen().has(column.id)" (change)="toggle(column.id)" />
          </ui-choice>
        }
      </fieldset>
      <div class="flex justify-end gap-2">
        <button uiButton variant="ghost" type="button" (click)="closeModal.emit(false)">Cancelar</button>
        <button uiButton variant="primary" type="button" [disabled]="!count()" (click)="closeModal.emit([...chosen()])">
          {{ count() === 1 ? 'Publicar 1 calificación' : 'Publicar ' + count() + ' calificaciones' }}
        </button>
      </div>
    </div>
  `,
})
export default class PublishDialog implements OnInit {
  public readonly data = input.required<{ columns: PublishableColumn[] }>();
  public readonly closeModal = output<string[] | false>();
  protected readonly chosen = signal<ReadonlySet<string>>(new Set());
  protected readonly count = computed(() => this.chosen().size);

  ngOnInit(): void {
    this.chosen.set(new Set(this.data().columns.filter((c) => c.changed).map((c) => c.id)));
  }

  protected toggle(id: string): void {
    const next = new Set(this.chosen());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.chosen.set(next);
  }
}
