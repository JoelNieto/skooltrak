import { Component, input } from '@angular/core';

@Component({
  selector: 'lib-editor-menu',
  imports: [],
  template: `<div class="flex gap-2 flex-wrap">
    <div class="tooltip" data-tip="Negrita">
      <button
        type="button"
        class="btn btn-ghost btn-primary btn-sm"
        [class.btn-soft]="editor().isActive('bold')"
        (click)="editor().chain().focus().toggleBold().run()"
      >
        <span class="material-symbols-outlined">format_bold</span>
      </button>
    </div>
    <div class="tooltip" data-tip="Cursiva">
      <button
        type="button"
        class="btn btn-ghost btn-primary btn-sm"
        [class.btn-soft]="editor().isActive('italic')"
        (click)="editor().chain().focus().toggleItalic().run()"
      >
        <span class="material-symbols-outlined">format_italic</span>
      </button>
    </div>
    <div class="tooltip" data-tip="Tachado">
      <button
        type="button"
        class="btn btn-ghost btn-primary btn-sm"
        [class.btn-soft]="editor().isActive('strike')"
        (click)="editor().chain().focus().toggleStrike().run()"
      >
        <span class="material-symbols-outlined">format_strikethrough</span>
      </button>
    </div>
    <div class="tooltip" data-tip="Subrayado">
      <button
        type="button"
        class="btn btn-ghost btn-primary btn-sm"
        [class.btn-soft]="editor().isActive('underline')"
        (click)="editor().chain().focus().toggleUnderline().run()"
      >
        <span class="material-symbols-outlined">format_underlined</span>
      </button>
    </div>
    <div class="tooltip" data-tip="Destacado">
      <button
        type="button"
        class="btn btn-ghost btn-primary btn-sm "
        [class.btn-soft]="editor().isActive('highlight')"
        (click)="editor().chain().focus().toggleHighlight().run()"
      >
        <span class="material-symbols-outlined">highlight</span>
      </button>
    </div>
    <div class="tooltip" data-tip="Código">
      <button
        type="button"
        class="btn btn-ghost btn-primary btn-sm"
        [class.btn-soft]="editor().isActive('code')"
        (click)="editor().chain().focus().toggleCode().run()"
      >
        <span class="material-symbols-outlined">code</span>
      </button>
    </div>
    <div class="tooltip" data-tip="Lista desordenada">
      <button
        type="button"
        class="btn btn-ghost btn-primary btn-sm"
        [class.btn-soft]="editor().isActive('bulletList')"
        (click)="editor().chain().focus().toggleBulletList().run()"
      >
        <span class="material-symbols-outlined">format_list_bulleted</span>
      </button>
    </div>
    <div class="tooltip" data-tip="Lista ordenada">
      <button
        type="button"
        class="btn btn-ghost btn-primary btn-sm"
        [class.btn-soft]="editor().isActive('orderedList')"
        (click)="editor().chain().focus().toggleOrderedList().run()"
      >
        <span class="material-symbols-outlined">format_list_numbered</span>
      </button>
    </div>
    <div class="tooltip" data-tip="Encabezado 1">
      <button
        type="button"
        class="btn btn-ghost btn-primary btn-sm"
        [class.btn-soft]="editor().isActive('heading', { level: 1 })"
        (click)="editor().chain().focus().toggleHeading({ level: 1 }).run()"
      >
        <span class="material-symbols-outlined">format_h1</span>
      </button>
    </div>
    <div class="tooltip" data-tip="Encabezado 2">
      <button
        type="button"
        class="btn btn-ghost btn-primary btn-sm"
        [class.btn-soft]="editor().isActive('heading', { level: 2 })"
        (click)="editor().chain().focus().toggleHeading({ level: 2 }).run()"
      >
        <span class="material-symbols-outlined">format_h2</span>
      </button>
    </div>
    <div class="tooltip" data-tip="Encabezado 3">
      <button
        type="button"
        class="btn btn-ghost btn-primary btn-sm"
        [class.btn-soft]="editor().isActive('heading', { level: 3 })"
        (click)="editor().chain().focus().toggleHeading({ level: 3 }).run()"
      >
        <span class="material-symbols-outlined">format_h3</span>
      </button>
    </div>
    <div class="tooltip" data-tip="Encabezado 4">
      <button
        type="button"
        class="btn btn-ghost btn-primary btn-sm"
        [class.btn-soft]="editor().isActive('heading', { level: 4 })"
        (click)="editor().chain().focus().toggleHeading({ level: 4 }).run()"
      >
        <span class="material-symbols-outlined">format_h4</span>
      </button>
    </div>
    <div class="tooltip" data-tip="Encabezado 5">
      <button
        type="button"
        class="btn btn-ghost btn-primary btn-sm"
        [class.btn-soft]="editor().isActive('heading', { level: 5 })"
        (click)="editor().chain().focus().toggleHeading({ level: 5 }).run()"
      >
        <span class="material-symbols-outlined">format_h5</span>
      </button>
    </div>
    <div class="tooltip" data-tip="Cita">
      <button
        type="button"
        class="btn btn-ghost btn-primary btn-sm"
        [class.btn-soft]="editor().isActive('blockquote')"
        (click)="editor().chain().focus().toggleBlockquote().run()"
      >
        <span class="material-symbols-outlined">format_quote</span>
      </button>
    </div>
    <div class="divider divider-horizontal mx-0"></div>
    @if (editor().isActive('table')) {
    <div class="dropdown">
      <div
        tabindex="0"
        role="button"
        class="btn btn-ghost btn-primary btn-sm btn-soft"
      >
        <span class="material-symbols-outlined">grid_on</span>
        Tabla
        <span class="material-symbols-outlined text-xs">expand_more</span>
      </div>
      <ul
        tabindex="0"
        class="dropdown-content menu bg-base-100 rounded-box z-50 w-56 p-2 shadow-lg"
      >
        <li class="menu-title">Columnas</li>
        <li>
          <a (click)="editor().chain().focus().addColumnBefore().run()">
            <span class="material-symbols-outlined">arrow_back</span>
            Agregar antes
          </a>
        </li>
        <li>
          <a (click)="editor().chain().focus().addColumnAfter().run()">
            <span class="material-symbols-outlined">arrow_forward</span>
            Agregar después
          </a>
        </li>
        <li>
          <a
            class="text-error"
            (click)="editor().chain().focus().deleteColumn().run()"
          >
            <span class="material-symbols-outlined">remove</span>
            Eliminar columna
          </a>
        </li>
        <li class="menu-title">Filas</li>
        <li>
          <a (click)="editor().chain().focus().addRowBefore().run()">
            <span class="material-symbols-outlined">arrow_upward</span>
            Agregar antes
          </a>
        </li>
        <li>
          <a (click)="editor().chain().focus().addRowAfter().run()">
            <span class="material-symbols-outlined">arrow_downward</span>
            Agregar después
          </a>
        </li>
        <li>
          <a
            class="text-error"
            (click)="editor().chain().focus().deleteRow().run()"
          >
            <span class="material-symbols-outlined">remove</span>
            Eliminar fila
          </a>
        </li>
        <li class="menu-title">Celdas</li>
        <li>
          <a (click)="editor().chain().focus().mergeCells().run()">
            <span class="material-symbols-outlined">call_merge</span>
            Combinar celdas
          </a>
        </li>
        <li>
          <a (click)="editor().chain().focus().splitCell().run()">
            <span class="material-symbols-outlined">call_split</span>
            Dividir celda
          </a>
        </li>
        <div class="divider my-0"></div>
        <li>
          <a
            class="text-error"
            (click)="editor().chain().focus().deleteTable().run()"
          >
            <span class="material-symbols-outlined">delete</span>
            Eliminar tabla
          </a>
        </li>
      </ul>
    </div>
    } @else {
    <div class="tooltip" data-tip="Insertar tabla">
      <button
        type="button"
        class="btn btn-ghost btn-primary btn-sm"
        (click)="
          editor()
            .chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run()
        "
      >
        <span class="material-symbols-outlined">grid_on</span>
      </button>
    </div>
    }
  </div>`,
})
export class EditorMenu {
  public editor = input.required<any>();
}
