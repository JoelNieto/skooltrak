import { Component, computed, input, output, signal } from '@angular/core';
import { Button, Icon, UiIconName } from '#/ui';

export type UploadedFile = {
  file: File;
  preview?: string;
};

@Component({
  selector: 'app-assignment-dropzone',
  imports: [Button, Icon],
  template: `
    <div
      class="border-2 border-dashed rounded-lg p-6 text-center transition-colors"
      [class.border-primary]="isDragOver()"
      [class.bg-action-subtle]="isDragOver()"
      [class.border-line]="!isDragOver()"
      [class.hover:border-primary]="!isDragOver()"
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave($event)"
      (drop)="onDrop($event)"
    >
      @if (files().length === 0) {
        <div class="flex flex-col items-center gap-2">
          <ui-icon name="cloud-upload" class="text-4xl text-ink-subtle" />
          <p class="text-ink-muted">Arrastra y suelta archivos aquí o</p>
          <button uiButton variant="primary" size="sm" type="button" (click)="fileInput.click()">
            <ui-icon name="paperclip" class="text-lg" />
            Seleccionar archivo
          </button>
          <input
            #fileInput
            type="file"
            class="hidden"
            [accept]="accept()"
            [multiple]="multiple()"
            (change)="onFileSelect($event)"
          />
          @if (maxSize()) {
            <p class="text-xs text-ink-subtle mt-1">Tamaño máximo: {{ formatBytes(maxSize()!) }}</p>
          }
        </div>
      } @else {
        <div class="space-y-3">
          @for (uploadedFile of files(); track uploadedFile.file.name) {
            <div class="flex items-center justify-between p-3 bg-surface-0 rounded-lg">
              <div class="flex items-center gap-3">
                <ui-icon
                  [name]="getFileIcon(uploadedFile.file.type)"
                  class="text-2xl"
                  [class.text-error]="uploadedFile.file.type.includes('pdf')"
                  [class.text-info]="
                    uploadedFile.file.type.includes('word') || uploadedFile.file.type.includes('document')
                  "
                  [class.text-success]="uploadedFile.file.type.includes('image')"
                  [class.text-warning]="
                    uploadedFile.file.type.includes('spreadsheet') || uploadedFile.file.type.includes('excel')
                  "
                />
                <div class="text-left">
                  <p class="font-medium text-sm truncate max-w-xs">
                    {{ uploadedFile.file.name }}
                  </p>
                  <p class="text-xs text-ink-subtle">
                    {{ formatBytes(uploadedFile.file.size) }}
                  </p>
                </div>
              </div>
              <button uiButton variant="ghost" size="sm" iconOnly type="button" (click)="removeFile(uploadedFile)">
                <ui-icon name="x" />
              </button>
            </div>
          }
          @if (multiple()) {
            <button uiButton variant="secondary" size="sm" type="button" (click)="moreFilesInput.click()">
              <ui-icon name="plus" class="text-lg" />
              Agregar más archivos
            </button>
            <input
              #moreFilesInput
              type="file"
              class="hidden"
              [accept]="accept()"
              [multiple]="multiple()"
              (change)="onFileSelect($event)"
            />
          }
        </div>
      }
    </div>
    @if (error()) {
      <p class="text-error text-sm mt-2">{{ error() }}</p>
    }
  `,
})
export default class AssignmentDropzone {
  accept = input<string>('');
  multiple = input<boolean>(false);
  maxSize = input<number | null>(null); // in bytes

  filesChange = output<UploadedFile[]>();
  fileError = output<string>();

  files = signal<UploadedFile[]>([]);
  isDragOver = signal(false);
  error = signal<string | null>(null);

  currentFile = computed(() => this.files()[0]?.file ?? null);

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    const droppedFiles = event.dataTransfer?.files;
    if (droppedFiles) {
      this.handleFiles(Array.from(droppedFiles));
    }
  }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.handleFiles(Array.from(input.files));
      input.value = ''; // Reset input to allow selecting the same file again
    }
  }

  private handleFiles(newFiles: File[]) {
    this.error.set(null);

    // Validate file sizes
    const maxSizeBytes = this.maxSize();
    if (maxSizeBytes) {
      const oversizedFiles = newFiles.filter((f) => f.size > maxSizeBytes);
      if (oversizedFiles.length > 0) {
        const errorMsg = `Archivo demasiado grande: ${oversizedFiles.map((f) => f.name).join(', ')}. Máximo permitido: ${this.formatBytes(maxSizeBytes)}`;
        this.error.set(errorMsg);
        this.fileError.emit(errorMsg);
        return;
      }
    }

    // Validate file types if accept is specified
    const acceptTypes = this.accept();
    if (acceptTypes) {
      const acceptedMimes = acceptTypes.split(',').map((t) => t.trim());
      const invalidFiles = newFiles.filter((f) => {
        return !acceptedMimes.some((accepted) => {
          if (accepted.startsWith('.')) {
            return f.name.toLowerCase().endsWith(accepted.toLowerCase());
          }
          if (accepted.endsWith('/*')) {
            return f.type.startsWith(accepted.replace('/*', '/'));
          }
          return f.type === accepted;
        });
      });
      if (invalidFiles.length > 0) {
        const errorMsg = `Tipo de archivo no permitido: ${invalidFiles.map((f) => f.name).join(', ')}`;
        this.error.set(errorMsg);
        this.fileError.emit(errorMsg);
        return;
      }
    }

    const uploadedFiles: UploadedFile[] = newFiles.map((file) => ({ file }));

    if (this.multiple()) {
      this.files.update((current) => [...current, ...uploadedFiles]);
    } else {
      this.files.set(uploadedFiles.slice(0, 1));
    }

    this.filesChange.emit(this.files());
  }

  removeFile(uploadedFile: UploadedFile) {
    this.files.update((current) => current.filter((f) => f !== uploadedFile));
    this.filesChange.emit(this.files());
  }

  clearFiles() {
    this.files.set([]);
    this.error.set(null);
    this.filesChange.emit([]);
  }

  getFileIcon(mimeType: string): UiIconName {
    if (mimeType.includes('pdf')) return 'file-text';
    if (mimeType.includes('image')) return 'image';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'file-text';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'sheet';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return 'file-archive';
    if (mimeType.includes('video')) return 'file-video';
    if (mimeType.includes('audio')) return 'file-audio';
    return 'file';
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const value = bytes / Math.pow(k, i);
    return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${sizes[i]}`;
  }
}
