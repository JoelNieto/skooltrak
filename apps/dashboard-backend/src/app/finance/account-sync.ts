/**
 * Works out which family account each student of one school belongs to (FR-FIN-001.1,
 * BR-FIN-001.1). Pure, so the rules are testable without a database; AccountsService applies the
 * plan.
 *
 * - A student with no account joins the account of a sibling (a student sharing a guardian) in the
 *   same school, the lowest-numbered one when siblings are split; otherwise a new account is made.
 * - A student alone in an account with no charges (an account made before a guardian was linked)
 *   moves to a sibling's account, so linking a guardian later still groups the family. An account
 *   left empty is deleted.
 * - Accounts with several students, or with charges, are never merged here: only an admin moves
 *   students between them (BR-FIN-001.2).
 */

export interface SyncStudent {
  id: string;
  createdAt: Date;
  parentIds: string[];
}

export interface SyncAccount {
  id: string;
  number: number;
  chargeCount: number;
}

export interface SyncLink {
  studentId: string;
  accountId: string;
}

export interface SyncPlan {
  /** New accounts, keyed by a temporary id (`new:<n>`). */
  create: { tempId: string; number: number }[];
  /** Students to (re)assign; `accountId` may be a temporary id. */
  assign: { studentId: string; accountId: string; move: boolean }[];
  /** Accounts left without students. */
  remove: string[];
}

export function planAccountSync(students: SyncStudent[], accounts: SyncAccount[], links: SyncLink[]): SyncPlan {
  const ordered = [...students].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id));
  const numberOf = new Map(accounts.map((a) => [a.id, a.number]));
  const chargesOf = new Map(accounts.map((a) => [a.id, a.chargeCount]));
  const accountOf = new Map(links.map((l) => [l.studentId, l.accountId]));
  const members = new Map<string, Set<string>>();
  for (const a of accounts) members.set(a.id, new Set());
  for (const l of links) members.get(l.accountId)?.add(l.studentId);

  const byParent = new Map<string, string[]>();
  for (const s of ordered) for (const p of s.parentIds) byParent.set(p, [...(byParent.get(p) ?? []), s.id]);
  const parentsOf = new Map(ordered.map((s) => [s.id, s.parentIds]));
  const siblings = (id: string) => {
    const out = new Set<string>();
    for (const p of parentsOf.get(id) ?? []) for (const sib of byParent.get(p) ?? []) if (sib !== id) out.add(sib);
    return out;
  };
  const siblingAccounts = (id: string, exclude?: string) =>
    [...siblings(id)]
      .map((sib) => accountOf.get(sib))
      .filter((a): a is string => !!a && a !== exclude)
      .sort((a, b) => (numberOf.get(a) ?? 0) - (numberOf.get(b) ?? 0));

  const plan: SyncPlan = { create: [], assign: [], remove: [] };
  let next = Math.max(0, ...accounts.map((a) => a.number)) + 1;
  const put = (studentId: string, accountId: string, move: boolean) => {
    const prev = accountOf.get(studentId);
    if (prev) members.get(prev)?.delete(studentId);
    accountOf.set(studentId, accountId);
    if (!members.has(accountId)) members.set(accountId, new Set());
    members.get(accountId)!.add(studentId);
    plan.assign = plan.assign.filter((a) => a.studentId !== studentId);
    plan.assign.push({ studentId, accountId, move });
  };

  // Solo, charge-free accounts fold into a sibling's account.
  for (const s of ordered) {
    const own = accountOf.get(s.id);
    if (!own || members.get(own)?.size !== 1 || (chargesOf.get(own) ?? 0) > 0) continue;
    const target = siblingAccounts(s.id, own).find(
      (t) => (members.get(t)?.size ?? 0) > 1 || (numberOf.get(t) ?? 0) < (numberOf.get(own) ?? 0),
    );
    if (target) put(s.id, target, true);
  }

  // Students without an account join a sibling's, else get a new one.
  for (const s of ordered) {
    if (accountOf.has(s.id)) continue;
    const target = siblingAccounts(s.id)[0];
    if (target) {
      put(s.id, target, false);
    } else {
      const tempId = `new:${next}`;
      plan.create.push({ tempId, number: next });
      numberOf.set(tempId, next);
      chargesOf.set(tempId, 0);
      next += 1;
      put(s.id, tempId, false);
    }
  }

  for (const a of accounts) if ((members.get(a.id)?.size ?? 0) === 0 && (chargesOf.get(a.id) ?? 0) === 0) plan.remove.push(a.id);
  return plan;
}
