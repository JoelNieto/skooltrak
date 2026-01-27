import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';

export type UploadedFile = {
  file: File;
  preview?: string;
};

@Component({
  selector: 'app-assignment-dropzone',
  template: `
    <div
      class="border-2 border-dashed rounded-lg p-6 text-center transition-colors"
      [class.border-primary]="isDragOver()"
      [class.bg-primary/5]="isDragOver()"
      [class.border-base-300]="!isDragOver()"
      [class.hover:border-primary]="!isDragOver()"
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave($event)"
      (drop)="onDrop($event)"
    >
      @if (files().length === 0) {
        <div class="flex flex-col items-center gap-2">
          <span class="material-symbols-outlined text-4xl text-base-content/50">
            cloud_upload
          </span>
          <p class="text-base-content/70">
            Arrastra y suelta archivos aquí o
          </p>
          <label class="btn btn-primary btn-sm">
            <span class="material-symbols-outlined text-lg">attach_file</span>
            Seleccionar archivo
            <input
              type="file"
              class="hidden"
              [accept]="accept()"
              [multiple]="multiple()"
              (change)="onFileSelect($event)"
            />
          </label>
          @if (maxSize()) {
            <p class="text-xs text-base-content/50 mt-1">
              Tamaño máximo: {{ formatBytes(maxSize()!) }}
            </p>
          }
        </div>
      } @else {
        <div class="space-y-3">
          @for (uploadedFile of files(); track uploadedFile.file.name) {
            <div
              class="flex items-center justify-between p-3 bg-base-200 rounded-lg"
            >
              <div class="flex items-center gap-3">
                <span
                  class="material-symbols-outlined text-2xl"
                  [class.text-error]="uploadedFile.file.type.includes('pdf')"
                  [class.text-info]="
                    uploadedFile.file.type.includes('word') ||
                    uploadedFile.file.type.includes('document')
                  "
                  [class.text-success]="
                    uploadedFile.file.type.includes('image')
                  "
                  [class.text-warning]="
                    uploadedFile.file.type.includes('spreadsheet') ||
                    uploadedFile.file.type.includes('excel')
                  "
                >
                  {{ getFileIcon(uploadedFile.file.type) }}
                </span>
                <div class="text-left">
                  <p class="font-medium text-sm truncate max-w-xs">
                    {{ uploadedFile.file.name }}
                  </p>
                  <p class="text-xs text-base-content/50">
                    {{ formatBytes(uploadedFile.file.size) }}
                  </p>
                </div>
              </div>
              <button
                type="button"
                class="btn btn-ghost btn-sm btn-circle"
                (click)="removeFile(uploadedFile)"
              >
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
          }
          @if (multiple()) {
            <label class="btn btn-outline btn-sm">
              <span class="material-symbols-outlined text-lg">add</span>
              Agregar más archivos
              <input
                type="file"
                class="hidden"
                [accept]="accept()"
                [multiple]="multiple()"
                (change)="onFileSelect($event)"
              />
            </label>
          }
        </div>
      }
    </div>
    @if (error()) {
      <p class="text-error text-sm mt-2">{{ error() }}</p>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    this.files.update((current) =>
      current.filter((f) => f !== uploadedFile)
    );
    this.filesChange.emit(this.files());
  }

  clearFiles() {
    this.files.set([]);
    this.error.set(null);
    this.filesChange.emit([]);
  }

  getFileIcon(mimeType: string): string {
    if (mimeType.includes('pdf')) return 'picture_as_pdf';
    if (mimeType.includes('image')) return 'image';
    if (mimeType.includes('word') || mimeType.includes('document'))
      return 'description';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel'))
      return 'table_chart';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint'))
      return 'slideshow';
    if (mimeType.includes('zip') || mimeType.includes('rar'))
      return 'folder_zip';
    if (mimeType.includes('video')) return 'movie';
    if (mimeType.includes('audio')) return 'audio_file';
    return 'insert_drive_file';
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
