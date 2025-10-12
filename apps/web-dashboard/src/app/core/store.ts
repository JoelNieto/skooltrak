import { Injectable, computed, signal } from '@angular/core';
import { Prisma } from '@prisma/client';

@Injectable({
  providedIn: 'root',
})
export class Store {
  public currentSchool = signal<Prisma.SchoolGetPayload<{
    include: undefined;
  }> | null>(null);

  public currentSchoolId = computed(() => this.currentSchool()?.id);
}
