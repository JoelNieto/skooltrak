import { PageHeader, StatCard } from '#/ui';
import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ParentContext } from './parent-context.service';

interface GradeRow {
  id: string;
  subject: string;
  score: string;
  note: string;
}

@Component({
  selector: 'app-parent-child-progress',
  imports: [PageHeader, StatCard],
  template: `
    <lib-page-header
      title="Progreso del estudiante"
      [subtitle]="child() ? child()!.name + ' · ' + child()!.schoolName : 'Detalle de calificaciones'"
      actionLabel="Volver"
      actionIcon="arrow_back"
      (action)="back()"
    />

    @if (!child()) {
      <div class="mt-6 card border border-base-200 bg-base-100">
        <div class="card-body text-base-content/70">Selecciona un hijo desde el portal para ver su progreso.</div>
      </div>
    } @else {
      <div class="grid gap-4 md:grid-cols-3">
        <lib-stat-card label="Promedio" [value]="average()" helper="Último corte" />
        <lib-stat-card label="Materias" [value]="rows().length.toString()" helper="Cursos activos" />
        <lib-stat-card label="Escuela" [value]="child()!.schoolName" helper="Contexto del hijo" />
      </div>

      <div class="mt-6 card border border-base-200 bg-base-100">
        <div class="card-body">
          <h2 class="text-lg font-semibold text-base-content">Calificaciones por materia</h2>
          @if (loading()) {
            <div class="flex justify-center py-8">
              <span class="loading loading-spinner loading-md"></span>
            </div>
          } @else {
            <div class="overflow-x-auto">
              <table class="table">
                <thead>
                  <tr>
                    <th>Materia</th>
                    <th>Nota</th>
                    <th>Comentario</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of rows(); track item.id) {
                    <tr>
                      <td>{{ item.subject }}</td>
                      <td>{{ item.score }}</td>
                      <td class="text-sm text-base-content/70">{{ item.note }}</td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="3" class="text-base-content/70">Sin calificaciones publicadas.</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      </div>
    }
  `,
})
export default class ParentChildProgress implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private ctx = inject(ParentContext);

  public child = this.ctx.selectedChild;
  public loading = signal(true);
  public rows = signal<GradeRow[]>([]);
  public average = signal('—');

  ngOnInit() {
    const selected = this.ctx.selectedChild();
    if (!selected) {
      this.loading.set(false);
      return;
    }
    this.http.get<any[]>(`/api/v1/students/${selected.studentId}/grades`).subscribe({
      next: (courses) => {
        const rows: GradeRow[] = [];
        let total = 0;
        let count = 0;
        for (const course of courses ?? []) {
          const subject = course?.subject?.name ?? course?.name ?? 'Materia';
          const studentGrades = (course?.grades ?? [])
            .flatMap((g: any) => g?.studentGrades ?? [])
            .filter((sg: any) => sg?.studentId === selected.studentId);
          const scores = studentGrades.map((sg: any) => parseFloat(sg?.score)).filter((n: number) => !isNaN(n));
          if (scores.length > 0) {
            const avg = scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
            total += avg;
            count += 1;
            const note = studentGrades.find((sg: any) => sg?.comment)?.comment ?? '';
            rows.push({
              id: course.id,
              subject,
              score: avg.toFixed(1),
              note,
            });
          } else {
            rows.push({ id: course.id, subject, score: '—', note: '' });
          }
        }
        this.rows.set(rows);
        this.average.set(count > 0 ? (total / count).toFixed(1) : '—');
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  back() {
    this.router.navigate(['/parent/portal']);
  }
}
