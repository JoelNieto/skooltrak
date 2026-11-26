import { ChargeSource } from '@generated/prisma';
import type { ChargeStatus } from '../charge-status';
import { FinancePaymentSummary } from './payments.entity';

/** Responses of `/v1/finance/*` (FIN-001). Amounts are numbers in the school's currency. */

export class FinanceRef {
  id: string;
  name: string;
}

export class FinanceAccountStudent {
  id: string;
  name: string;
  classGroup: FinanceRef | null;
}

export class FinanceGuardian {
  id: string;
  name: string;
  relationship: string;
}

/** FR-FIN-001.2 */
export class FinanceAccountSummary {
  id: string;
  /** Display number, e.g. `C-0142`. */
  number: string;
  /** "Familia González Ríos", from the first student's surnames. */
  name: string;
  students: FinanceAccountStudent[];
  guardians: FinanceGuardian[];
  /** Outstanding on every non-cancelled charge. */
  dueAmount: number;
  /** Outstanding on charges past their due date. */
  overdueAmount: number;
  /** Days since the oldest overdue charge fell due; null when nothing is overdue. */
  overdueDays: number | null;
  /** Saldo a favor (FR-FIN-001.17): overpayments not yet applied to charges. */
  creditAmount: number;
}

export class FinanceAccountList {
  items: FinanceAccountSummary[];
  total: number;
  page: number;
  take: number;
  currencyCode: string;
}

export class FinanceCharge {
  id: string;
  /** Null for account-level charges (store orders). */
  studentId: string | null;
  description: string;
  source: ChargeSource;
  year: number;
  /** `YYYY-MM-DD` */
  dueDate: string;
  grossAmount: number;
  discountAmount: number;
  netAmount: number;
  paidAmount: number;
  outstanding: number;
  /** Derived (BR-FIN-001.10). */
  status: ChargeStatus;
  cancelledAt: string | null;
  cancelReason: string | null;
}

/** FR-FIN-001.3 (read) and FR-FIN-001.12 */
export class FinanceAccountDetail extends FinanceAccountSummary {
  school: FinanceRef & { currencyCode: string };
  charges: FinanceCharge[];
  /** Newest first (FR-FIN-001.15). */
  payments: FinancePaymentSummary[];
}

/** A student picked for a charge or a generation (FIN-001-S02). */
export class FinanceStudentHit {
  id: string;
  name: string;
  classGroup: FinanceRef | null;
}
