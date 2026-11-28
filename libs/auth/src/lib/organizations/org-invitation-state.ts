import { createHash, randomBytes } from 'crypto';

/**
 * IAM-001 BR .5: what an organization invitation's link can do right now.
 * `EXPIRED` is derived from `expiresAt`; it is never stored.
 */
export type OrgInvitationState = 'VALID' | 'EXPIRED' | 'REVOKED' | 'SUPERSEDED' | 'ACCEPTED';

export function orgInvitationState(
  invitation: { status: string; expiresAt: Date },
  now: Date = new Date(),
): OrgInvitationState {
  switch (invitation.status) {
    case 'ACCEPTED':
      return 'ACCEPTED';
    case 'REVOKED':
      return 'REVOKED';
    case 'SUPERSEDED':
      return 'SUPERSEDED';
    default:
      return invitation.expiresAt.getTime() <= now.getTime() ? 'EXPIRED' : 'VALID';
  }
}

/** BR .4: a random single-use token (256 bits) and the SHA-256 hash that is stored. */
export function newInvitationToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, tokenHash: hashInvitationToken(token) };
}

export function hashInvitationToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}
