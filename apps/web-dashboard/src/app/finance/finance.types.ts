import { BadgeTone } from '#/ui';

/** Responses of `/api/v1/finance/*` (dashboard-backend finance/entities/finance.entity.ts). */

export type ChargeStatus = 'PENDING' | 'PARTIAL' | 'OVERDUE' | 'PAID' | 'CANCELLED';
export type ChargeSource = 'FEE' | 'MANUAL' | 'LATE_FEE' | 'STORE_ORDER';

export interface FinanceRef {
  id: string;
  name: string;
}

export interface FinanceAccountSummary {
  id: string;
  number: string;
  name: string;
  students: { id: string; name: string; classGroup: FinanceRef | null }[];
  guardians: { id: string; name: string; relationship: string }[];
  dueAmount: number;
  overdueAmount: number;
  overdueDays: number | null;
  creditAmount: number;
}

export interface FinanceAccountList {
  items: FinanceAccountSummary[];
  total: number;
  page: number;
  take: number;
  currencyCode: string;
}

export interface FinanceCharge {
  id: string;
  studentId: string | null;
  description: string;
  source: ChargeSource;
  year: number;
  dueDate: string;
  grossAmount: number;
  discountAmount: number;
  netAmount: number;
  paidAmount: number;
  outstanding: number;
  status: ChargeStatus;
  cancelledAt: string | null;
  cancelReason: string | null;
}

export interface FinanceAccountDetail extends FinanceAccountSummary {
  school: FinanceRef & { currencyCode: string };
  charges: FinanceCharge[];
}

/** Charges of one account, grouped by student, store orders last (FR-FIN-001.3, .12). */
export interface ChargeGroup {
  key: string;
  title: string;
  charges: FinanceCharge[];
}

export function groupCharges(account: FinanceAccountDetail, options: { hideCancelled?: boolean } = {}): ChargeGroup[] {
  const charges = options.hideCancelled ? account.charges.filter((c) => c.status !== 'CANCELLED') : account.charges;
  const groups: ChargeGroup[] = account.students.map((s) => ({
    key: s.id,
    title: s.classGroup ? `${s.name} · ${s.classGroup.name}` : s.name,
    charges: charges.filter((c) => c.studentId === s.id),
  }));
  // Charges of a student who has since left the account, and account-level ones (store orders).
  const known = new Set(account.students.map((s) => s.id));
  const store = charges.filter((c) => !c.studentId || !known.has(c.studentId));
  if (store.length) groups.push({ key: 'account', title: 'Tienda y otros', charges: store });
  return groups.filter((g) => g.charges.length > 0);
}

const STATUS_LABEL: Record<ChargeStatus, string> = {
  PENDING: 'Pendiente',
  PARTIAL: 'Pagado en parte',
  OVERDUE: 'Vencido',
  PAID: 'Pagado',
  CANCELLED: 'Cancelado',
};

const STATUS_TONE: Record<ChargeStatus, BadgeTone> = {
  PENDING: 'neutral',
  PARTIAL: 'neutral',
  OVERDUE: 'warning',
  PAID: 'success',
  CANCELLED: 'neutral',
};

export function statusLabel(status: ChargeStatus): string {
  return STATUS_LABEL[status];
}

export function statusTone(status: ChargeStatus): BadgeTone {
  return STATUS_TONE[status];
}

/** "$1,180.00" in the school's currency. */
export function money(amount: number, currencyCode = 'USD'): string {
  return new Intl.NumberFormat('es-PA', { style: 'currency', currency: currencyCode, currencyDisplay: 'narrowSymbol' }).format(amount);
}

/** "5 dic 2026" from a `YYYY-MM-DD` date, without time-zone drift. */
export function shortDate(date: string): string {
  return new Intl.DateTimeFormat('es-PA', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${date}T00:00:00Z`),
  );
}

/** Today in the browser's time zone, as `YYYY-MM-DD` (the school's, for its families and staff). */
export function localToday(): string {
  return new Intl.DateTimeFormat('en-CA').format(new Date());
}

/** Whole days from a `YYYY-MM-DD` date to today. */
export function daysSince(date: string): number {
  return Math.round((Date.parse(`${localToday()}T00:00:00Z`) - Date.parse(`${date}T00:00:00Z`)) / 86_400_000);
}

export function overdueLabel(days: number | null): string {
  if (days == null) return '';
  return days === 1 ? '1 día' : `${days} días`;
}

// Fee catalog and charge generation (FIN-001-S02; finance/entities/fees.entity.ts)

export type FeeKind = 'ENROLLMENT' | 'TUITION' | 'OTHER';
export type FeeSchedule = 'ONE_TIME' | 'MONTHLY';

export interface FeeItem {
  id: string;
  name: string;
  kind: FeeKind;
  amount: number;
  schedule: FeeSchedule;
  dueMonth: number | null;
  startMonth: number | null;
  endMonth: number | null;
  dueDay: number;
  active: boolean;
  scheduleLabel: string;
  chargeCount: number;
}

export interface FeeItemList {
  items: FeeItem[];
  currencyCode: string;
}

export interface FeeAssignment {
  id: string;
  year: number;
  feeItem: FinanceRef;
  degree: FinanceRef | null;
  studyPlan: (FinanceRef & { degreeId: string }) | null;
  amountOverride: number | null;
  amount: number;
}

export interface FeeTargets {
  degrees: (FinanceRef & { studyPlans: (FinanceRef & { classGroups: FinanceRef[] })[] })[];
  currentYear: number;
  currencyCode: string;
}

export interface GenerationPreview {
  year: number;
  students: number;
  newCount: number;
  newTotal: number;
  existingCount: number;
  items: { feeItemId: string; name: string; installments: number; students: number; newCount: number; newTotal: number }[];
  studentLines: { id: string; name: string; classGroup: string | null; newCount: number; newTotal: number; existingCount: number }[];
  currencyCode: string;
}

export const FEE_KIND_LABEL: Record<FeeKind, string> = { ENROLLMENT: 'Matrícula', TUITION: 'Mensualidad', OTHER: 'Otro' };

export const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

/** The current school year and the next two, plus the previous one. */
export function yearOptions(currentYear: number): number[] {
  return [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];
}

/** The first message of an API error, or `fallback`. */
export function apiError(err: unknown, fallback: string): string {
  const message = (err as { error?: { message?: string | string[] } })?.error?.message;
  return (Array.isArray(message) ? message[0] : message) ?? fallback;
}
