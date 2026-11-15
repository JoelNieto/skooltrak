import { StudentRecentGrade, StudentWorkItem } from './student-home.entity';
import { HomeRef } from './teacher-home.entity';

/** Responses of `GET /v1/home/parent/*` (HOM-001). */

export class ParentChild {
  studentId: string;
  name: string;
  /** The child's organization (federated parents span several). */
  organizationId: string;
  classGroup: HomeRef | null;
  school: HomeRef;
  alertCount: number;
}

/** FR-HOM-001.18 */
export class ParentChildren {
  firstName: string;
  /** Most alerts first, ties alphabetical (BR-HOM-001.9). */
  defaultStudentId: string | null;
  children: ParentChild[];
}

export type ParentAlertKind = 'ABSENCE' | 'OVERDUE_WORK' | 'BELOW_PASS' | 'CHARGE_OVERDUE' | 'CHARGE_DUE_SOON' | 'LATE';

export class ParentAlert {
  kind: ParentAlertKind;
  tone: 'danger' | 'warning';
  title: string;
  detail: string;
  action: { label: string; link: string };
}

export class ParentKpis {
  average: { value: number | null; max: number | null; delta: number | null; previousPeriodName: string | null };
  attendance: { rate: number | null; absences: number; late: number } | null;
  /** Pendiente + Vencida work. */
  pending: { total: number; overdue: number };
  /** All charges − all payments; omitted without VIEW_FINANCIALS (BR-HOM-001.16). */
  balance: { amount: number; overdue: number } | null;
}

/** FR-HOM-001.19 / .20 for one linked child. */
export class ParentChildHome {
  student: { id: string; name: string; firstName: string; classGroup: HomeRef | null; school: HomeRef };
  currencyCode: string;
  /** Danger first, then warning. */
  alerts: ParentAlert[];
  kpis: ParentKpis;
  /** FR-HOM-001.21: the child's work (S04 rules), read-only. */
  work: StudentWorkItem[];
  /** FR-HOM-001.21: latest 4 published grades. */
  recentGrades: StudentRecentGrade[];
  /** FR-HOM-001.23: latest threads with the child's teachers. */
  messages: ParentThread[];
}

export class ParentThread {
  id: string;
  title: string;
  senderName: string;
  /** ISO instant */
  lastMessageAt: string;
  preview: string;
  unread: boolean;
}

export type AccountStatus = 'AL_DIA' | 'PENDIENTE' | 'VENCIDO';

/** FR-HOM-001.22 (needs VIEW_FINANCIALS). */
export class ParentAccount {
  currencyCode: string;
  status: AccountStatus;
  balance: number;
  overdue: number;
  nextCharge: { description: string; outstanding: number; dueDate: string } | null;
  lastPayment: { amount: number; paidAt: string } | null;
}
