import { PaymentMethod, PaymentStatus } from '@generated/prisma';
import { ApiProperty } from '@nestjs/swagger';

/** Responses of the payment endpoints (FIN-001-S03). Amounts in the school's currency. */

export class FinancePaymentAccount {
  id: string;
  /** `C-0042` */
  number: string;
  name: string;
}

/** A payment in a list (account detail, Pagos tab, Estado de cuenta). */
export class FinancePaymentSummary {
  id: string;
  /** `R-000123`; null while a card payment is pending (S04). */
  receiptNumber: string | null;
  @ApiProperty({ enum: PaymentMethod, enumName: 'PaymentMethod' })
  method: PaymentMethod;
  @ApiProperty({ enum: PaymentStatus, enumName: 'PaymentStatus' })
  status: PaymentStatus;
  amount: number;
  /** `YYYY-MM-DD` */
  receivedAt: string;
  reference: string | null;
  /** Saldo a favor the payment generated. */
  creditAmount: number;
  account: FinancePaymentAccount;
}

export class FinancePaymentList {
  items: FinancePaymentSummary[];
  total: number;
  page: number;
  take: number;
  currencyCode: string;
}

export class ReceiptSchool {
  id: string;
  name: string;
  logo: string;
  currencyCode: string;
}

export class ReceiptLine {
  chargeId: string;
  /** Null for account-level charges (store orders). */
  student: string | null;
  description: string;
  amount: number;
}

/** FR-FIN-001.15 */
export class PaymentReceipt extends FinancePaymentSummary {
  school: ReceiptSchool;
  /** The account's guardians; offline payments have no paying user. */
  payers: string[];
  note: string | null;
  cardBrand: string | null;
  cardLast4: string | null;
  lines: ReceiptLine[];
  /** ISO timestamp the payment was registered. */
  createdAt: string;
  createdBy: string | null;
  voidedAt: string | null;
  voidReason: string | null;
}

/** FR-FIN-001.13: a checkout ends with a receipt or a decline message. */
export class CheckoutResult {
  @ApiProperty({ enum: ['COMPLETED', 'DECLINED'] })
  status: 'COMPLETED' | 'DECLINED';
  /** Why the card was declined. */
  message?: string;
  receipt?: PaymentReceipt;
}
