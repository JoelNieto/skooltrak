import { Component, input } from '@angular/core';
import { Button } from './button';
import { Icon } from './icon';

@Component({
  selector: 'lib-editor-menu',
  imports: [Button, Icon],
  template: `<div class="flex gap-2 flex-wrap">
    <div class="tooltip" data-tip="Negrita">
      <button
        uiButton
        size="sm"
        iconOnly
        type="button"
        aria-label="Negrita"
        [variant]="editor().isActive('bold') ? 'secondary' : 'ghost'"
        [attr.aria-pressed]="editor().isActive('bold')"
        (click)="editor().chain().focus().toggleBold().run()"
      >
        <ui-icon name="bold" />
      </button>
    </div>
    <div class="tooltip" data-tip="Cursiva">
      <button
        uiButton
        size="sm"
        iconOnly
        type="button"
        aria-label="Cursiva"
        [variant]="editor().isActive('italic') ? 'secondary' : 'ghost'"
        [attr.aria-pressed]="editor().isActive('italic')"
        (click)="editor().chain().focus().toggleItalic().run()"
      >
        <ui-icon name="italic" />
      </button>
    </div>
    <div class="tooltip" data-tip="Tachado">
      <button
        uiButton
        size="sm"
        iconOnly
        type="button"
        aria-label="Tachado"
        [variant]="editor().isActive('strike') ? 'secondary' : 'ghost'"
        [attr.aria-pressed]="editor().isActive('strike')"
        (click)="editor().chain().focus().toggleStrike().run()"
      >
        <ui-icon name="strikethrough" />
      </button>
    </div>
    <div class="tooltip" data-tip="Subrayado">
      <button
        uiButton
        size="sm"
        iconOnly
        type="button"
        aria-label="Subrayado"
        [variant]="editor().isActive('underline') ? 'secondary' : 'ghost'"
        [attr.aria-pressed]="editor().isActive('underline')"
        (click)="editor().chain().focus().toggleUnderline().run()"
      >
        <ui-icon name="underline" />
      </button>
    </div>
    <div class="tooltip" data-tip="Destacado">
      <button
        uiButton
        size="sm"
        iconOnly
        type="button"
        aria-label="Destacado"
        [variant]="editor().isActive('highlight') ? 'secondary' : 'ghost'"
        [attr.aria-pressed]="editor().isActive('highlight')"
        (click)="editor().chain().focus().toggleHighlight().run()"
      >
        <ui-icon name="highlighter" />
      </button>
    </div>
    <div class="tooltip" data-tip="Código">
      <button
        uiButton
        size="sm"
        iconOnly
        type="button"
        aria-label="Código"
        [variant]="editor().isActive('code') ? 'secondary' : 'ghost'"
        [attr.aria-pressed]="editor().isActive('code')"
        (click)="editor().chain().focus().toggleCode().run()"
      >
        <ui-icon name="code" />
      </button>
    </div>
    <div class="tooltip" data-tip="Lista desordenada">
      <button
        uiButton
        size="sm"
        iconOnly
        type="button"
        aria-label="Lista desordenada"
        [variant]="editor().isActive('bulletList') ? 'secondary' : 'ghost'"
        [attr.aria-pressed]="editor().isActive('bulletList')"
        (click)="editor().chain().focus().toggleBulletList().run()"
      >
        <ui-icon name="list" />
      </button>
    </div>
    <div class="tooltip" data-tip="Lista ordenada">
      <button
        uiButton
        size="sm"
        iconOnly
        type="button"
        aria-label="Lista ordenada"
        [variant]="editor().isActive('orderedList') ? 'secondary' : 'ghost'"
        [attr.aria-pressed]="editor().isActive('orderedList')"
        (click)="editor().chain().focus().toggleOrderedList().run()"
      >
        <ui-icon name="list-ordered" />
      </button>
    </div>
    <div class="tooltip" data-tip="Encabezado 1">
      <button
        uiButton
        size="sm"
        iconOnly
        type="button"
        aria-label="Encabezado 1"
        [variant]="editor().isActive('heading', { level: 1 }) ? 'secondary' : 'ghost'"
        [attr.aria-pressed]="editor().isActive('heading', { level: 1 })"
        (click)="editor().chain().focus().toggleHeading({ level: 1 }).run()"
      >
        <ui-icon name="heading-1" />
      </button>
    </div>
    <div class="tooltip" data-tip="Encabezado 2">
      <button
        uiButton
        size="sm"
        iconOnly
        type="button"
        aria-label="Encabezado 2"
        [variant]="editor().isActive('heading', { level: 2 }) ? 'secondary' : 'ghost'"
        [attr.aria-pressed]="editor().isActive('heading', { level: 2 })"
        (click)="editor().chain().focus().toggleHeading({ level: 2 }).run()"
      >
        <ui-icon name="heading-2" />
      </button>
    </div>
    <div class="tooltip" data-tip="Encabezado 3">
      <button
        uiButton
        size="sm"
        iconOnly
        type="button"
        aria-label="Encabezado 3"
        [variant]="editor().isActive('heading', { level: 3 }) ? 'secondary' : 'ghost'"
        [attr.aria-pressed]="editor().isActive('heading', { level: 3 })"
        (click)="editor().chain().focus().toggleHeading({ level: 3 }).run()"
      >
        <ui-icon name="heading-3" />
      </button>
    </div>
    <div class="tooltip" data-tip="Encabezado 4">
      <button
        uiButton
        size="sm"
        iconOnly
        type="button"
        aria-label="Encabezado 4"
        [variant]="editor().isActive('heading', { level: 4 }) ? 'secondary' : 'ghost'"
        [attr.aria-pressed]="editor().isActive('heading', { level: 4 })"
        (click)="editor().chain().focus().toggleHeading({ level: 4 }).run()"
      >
        <ui-icon name="heading-4" />
      </button>
    </div>
    <div class="tooltip" data-tip="Encabezado 5">
      <button
        uiButton
        size="sm"
        iconOnly
        type="button"
        aria-label="Encabezado 5"
        [variant]="editor().isActive('heading', { level: 5 }) ? 'secondary' : 'ghost'"
        [attr.aria-pressed]="editor().isActive('heading', { level: 5 })"
        (click)="editor().chain().focus().toggleHeading({ level: 5 }).run()"
      >
        <ui-icon name="heading-5" />
      </button>
    </div>
    <div class="tooltip" data-tip="Cita">
      <button
        uiButton
        size="sm"
        iconOnly
        type="button"
        aria-label="Cita"
        [variant]="editor().isActive('blockquote') ? 'secondary' : 'ghost'"
        [attr.aria-pressed]="editor().isActive('blockquote')"
        (click)="editor().chain().focus().toggleBlockquote().run()"
      >
        <ui-icon name="quote" />
      </button>
    </div>
    <div class="divider divider-horizontal mx-0"></div>
    @if (editor().isActive('table')) {
      <div class="dropdown">
        <div tabindex="0" role="button" class="btn btn-ghost btn-primary btn-sm btn-soft">
          <ui-icon name="grid-3x3" />
          Tabla
          <ui-icon name="chevron-down" class="text-xs" />
        </div>
        <ul tabindex="0" class="dropdown-content menu bg-surface-1 rounded-box z-50 w-56 p-2 shadow-lg">
          <li class="menu-title">Columnas</li>
          <li>
            <button type="button" (click)="editor().chain().focus().addColumnBefore().run()">
              <ui-icon name="arrow-left" />
              Agregar antes
            </button>
          </li>
          <li>
            <button type="button" (click)="editor().chain().focus().addColumnAfter().run()">
              <ui-icon name="arrow-right" />
              Agregar después
            </button>
          </li>
          <li>
            <button type="button" class="text-error" (click)="editor().chain().focus().deleteColumn().run()">
              <ui-icon name="minus" />
              Eliminar columna
            </button>
          </li>
          <li class="menu-title">Filas</li>
          <li>
            <button type="button" (click)="editor().chain().focus().addRowBefore().run()">
              <ui-icon name="arrow-up" />
              Agregar antes
            </button>
          </li>
          <li>
            <button type="button" (click)="editor().chain().focus().addRowAfter().run()">
              <ui-icon name="arrow-down" />
              Agregar después
            </button>
          </li>
          <li>
            <button type="button" class="text-error" (click)="editor().chain().focus().deleteRow().run()">
              <ui-icon name="minus" />
              Eliminar fila
            </button>
          </li>
          <li class="menu-title">Celdas</li>
          <li>
            <button type="button" (click)="editor().chain().focus().mergeCells().run()">
              <ui-icon name="merge" />
              Combinar celdas
            </button>
          </li>
          <li>
            <button type="button" (click)="editor().chain().focus().splitCell().run()">
              <ui-icon name="split" />
              Dividir celda
            </button>
          </li>
          <div class="divider my-0"></div>
          <li>
            <button type="button" class="text-error" (click)="editor().chain().focus().deleteTable().run()">
              <ui-icon name="trash-2" />
              Eliminar tabla
            </button>
          </li>
        </ul>
      </div>
    } @else {
      <div class="tooltip" data-tip="Insertar tabla">
        <button
          uiButton
          variant="ghost"
          size="sm"
          type="button"
          (click)="editor().chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()"
        >
          <ui-icon name="grid-3x3" />
        </button>
      </div>
    }
  </div>`,
})
export class EditorMenu {
  public editor = input.required<any>();
}
