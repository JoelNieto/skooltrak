import { Modal } from '#/ui';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { map, of } from 'rxjs';
import GradeBucketForm from './grade-buckets-form';
@Component({
  selector: 'app-course-grade-buckets',
  imports: [],
  template: `
    <div class="flex justify-end">
      <button class="btn btn-primary" (click)="editBucket()">
        Agregar ponderacion
      </button>
    </div>
    <div class="overflow-x-auto">
      <table class="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Ponderacion</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          @for (bucket of bucketsResource.value(); track bucket.id) {
          <tr>
            <td>{{ bucket.name }}</td>
            <td>{{ bucket.weight }}%</td>
            <td>
              <button
                class="btn btn-primary btn-soft btn-xs"
                (click)="editBucket(bucket)"
              >
                Editar
              </button>
            </td>
          </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class CourseGradeBuckets {
  public courseId = input.required<string>();
  #http = inject(HttpClient);
  #modal = inject(Modal);

  public bucketsResource = rxResource({
    params: () => ({
      courseId: this.courseId(),
    }),
    stream: ({ params }) => {
      const { courseId } = params;
      if (!courseId) {
        return of(null);
      }
      return this.#http
        .get<any[]>(`/api/v1/grade-buckets/by-course/${courseId}`)
        .pipe(map((result) => result ?? []));
    },
  });

  editBucket(bucket?: { id: string; name: string; weight: number; courseId?: string }) {
    this.#modal
      .open(GradeBucketForm, {
        data: {
          courseId: this.courseId(),
          bucket,
        },
        size: 'small',
      })
      .closed.subscribe((res) => {
        if (res) {
          this.bucketsResource.reload();
        }
      });
  }
}
