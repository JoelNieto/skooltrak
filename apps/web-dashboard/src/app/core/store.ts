import { SchoolContext } from '#/shared';
import { effect, Injectable, computed, inject, signal } from '@angular/core';
import { Prisma } from '@generated/prisma';
import Auth from '../auth/auth';

type BaseSchool = Prisma.SchoolGetPayload<{ include: undefined }>;

export type CurrentSchool = Omit<BaseSchool, 'primaryColor' | 'secondaryColor' | 'tertiaryColor'> & {
  /** May be missing from some client-constructed objects until synced from API */
  slug?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  tertiaryColor?: string | null;
};

@Injectable({
  providedIn: 'root',
})
export default class Store {
  private auth = inject(Auth);
  private schoolContext = inject(SchoolContext);
  public currentSchool = signal<CurrentSchool | null>(null);

  public currentSchoolId = computed(() => this.currentSchool()?.id);
  public currentOrganizationId = computed(() => this.currentSchool()?.organizationId);

  public currentTeacher = computed(() => this.auth.user()?.teacher);
  public currentStudent = computed(() => this.auth.user()?.student);
  public currentStudentId = computed(() => this.currentStudent()?.id);
  public currentStudentGroupId = computed(() => this.currentStudent()?.classGroupId);

  constructor() {
    effect(() => {
      const school = this.currentSchool();
      this.schoolContext.currentSchoolId.set(school?.id ?? null);
      this.schoolContext.currentSchoolSlug.set(school?.slug ?? null);
      this.schoolContext.currentSchoolName.set(school?.name ?? null);
      /** Same as sidebar: `logo` is storage key; only `logoUrl` is a presigned URL from GraphQL. */
      this.schoolContext.currentSchoolLogoUrl.set(school?.logoUrl ?? null);
      if (school?.currencyCode) {
        this.schoolContext.currencyCode.set(school.currencyCode);
      }
    });
  }
}
