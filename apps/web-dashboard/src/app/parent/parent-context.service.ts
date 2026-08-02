import { Service, signal } from '@angular/core';

export interface LinkedChild {
  studentId: string;
  name: string;
  schoolId: string;
  schoolName: string;
  organizationId: string;
  classGroupName?: string | null;
}

/**
 * Holds the parent's currently selected child so downstream parent features
 * (progress, finances, communication) can scope data to that child's school/organization
 * in the federated (cross-organization) model.
 */
@Service()
export class ParentContext {
  public readonly selectedChild = signal<LinkedChild | null>(null);

  select(child: LinkedChild) {
    this.selectedChild.set(child);
  }
}
