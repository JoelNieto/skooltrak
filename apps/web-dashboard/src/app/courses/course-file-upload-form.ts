import { markGroupDirty, Toast } from '@/ui';
import { Component, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Apollo } from 'apollo-angular';
import { from, switchMap } from 'rxjs';
import { CreateFileDocument, CreateFileUploadUrlDocument, ShareFileDocument } from '../graphql/generated/graphql';

type UploadResult = { created: boolean };

@Component({
  selector: 'app-course-file-upload-form',
  imports: [ReactiveFormsModule],
  template: `<form [formGroup]="form" (ngSubmit)="onSubmit()">
    <div class="flex flex-col gap-4">
      <div class="fieldset">
        <label for="file">Archivo</label>
        <input id="file" type="file" class="file-input file-input-primary w-full" (change)="onFileSelected($event)" />
        @if (selectedFile) {
          <p class="text-sm text-base-200 mt-1">{{ selectedFile.name }} · {{ formatBytes(selectedFile.size) }}</p>
        }
      </div>
      <div class="fieldset">
        <label for="permission">Permiso</label>
        <select id="permission" formControlName="permission" class="select select-primary">
          <option value="VIEW">Solo ver</option>
          <option value="EDIT">Puede editar</option>
        </select>
      </div>
    </div>
    <div class="mt-6 flex justify-end gap-2">
      <button class="btn btn-ghost" type="button" (click)="closeModal.emit(undefined)">Cancelar</button>
      <button class="btn btn-primary" type="submit">Subir</button>
    </div>
  </form>`,
})
export default class CourseFileUploadForm {
  public data = input.required<{ courseId: string }>();
  public closeModal = output<UploadResult | undefined>();
  private fb = inject(NonNullableFormBuilder);
  private apollo = inject(Apollo);
  private toast = inject(Toast);

  public selectedFile: File | null = null;

  public form = this.fb.group({
    permission: this.fb.control<'VIEW' | 'EDIT'>('VIEW', [Validators.required]),
  });

  onFileSelected(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    this.selectedFile = inputElement.files?.[0] ?? null;
  }

  onSubmit() {
    if (!this.selectedFile) {
      this.toast.showError('Selecciona un archivo para subir.');
      return;
    }

    if (this.form.invalid) {
      this.toast.showError('Formulario invalido');
      markGroupDirty(this.form);
      return;
    }

    const permission = this.form.getRawValue().permission;
    const mimeType = this.selectedFile.type || 'application/octet-stream';

    this.apollo
      .mutate({
        mutation: CreateFileUploadUrlDocument,
        variables: {
          createFileUploadInput: {
            courseId: this.data().courseId,
            fileName: this.selectedFile.name,
            mimeType,
          },
        },
      })
      .pipe(
        switchMap((result) => {
          const payload = result.data?.createFileUploadUrl ?? undefined;
          if (!payload) {
            throw new Error('No upload URL returned.');
          }
          return from(
            fetch(payload.uploadUrl, {
              method: 'PUT',
              headers: { 'Content-Type': mimeType },
              body: this.selectedFile,
            }).then((response) => {
              if (!response.ok) {
                throw new Error('Upload failed.');
              }
              return payload;
            }),
          );
        }),
        switchMap((payload) =>
          this.apollo.mutate({
            mutation: CreateFileDocument,
            variables: {
              createFileInput: {
                name: this.selectedFile?.name ?? '',
                mimeType,
                size: this.selectedFile?.size ?? 0,
                storageKey: payload.storageKey,
              },
            },
          }),
        ),
        switchMap((result) =>
          this.apollo.mutate({
            mutation: ShareFileDocument,
            variables: {
              shareFileInput: {
                fileId: result.data?.createFile?.id ?? '',
                targetType: 'COURSE',
                targetId: this.data().courseId,
                permission,
              },
            },
          }),
        ),
      )
      .subscribe({
        next: () => {
          this.toast.showSuccess('Archivo cargado correctamente');
          this.closeModal.emit({ created: true });
        },
        error: (error) => {
          console.error(error);
          this.toast.showError('Error al subir archivo');
        },
      });
  }

  formatBytes(bytes: number) {
    if (bytes === 0) {
      return '0 B';
    }
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const value = bytes / Math.pow(k, i);
    return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${sizes[i]}`;
  }
}
