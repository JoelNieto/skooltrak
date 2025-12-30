import { Injectable, computed, inject, signal } from '@angular/core';
import { Prisma } from '@generated/prisma';
import Auth from '../auth/auth';

@Injectable({
  providedIn: 'root',
})
export default class Store {
  private auth = inject(Auth);
  public currentSchool = signal<Prisma.SchoolGetPayload<{
    include: undefined;
  }> | null>(null);

  public currentSchoolId = computed(() => this.currentSchool()?.id);
  public currentOrganizationId = computed(
    () => this.currentSchool()?.organizationId
  );

  public currentTeacher = computed(() => this.auth.user()?.teacher);
  public currentStudent = computed(() => this.auth.user()?.student);
}
