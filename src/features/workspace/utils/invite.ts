// Server-side helpers for workspace invites: token creation, invite
// link building, and expiry math. Never imported from client
// components (uses node crypto + env.APP_URL).
import { env } from "@/env";
import { INVITE_EXPIRY_DAYS } from "@/features/workspace/schemas";

// Node's crypto module for cryptographically secure token bytes.
import { randomBytes } from "node:crypto";

// 32 random bytes -> 64 hex chars; ~2^256 entropy (unmappable brute force).
const TOKEN_RANDOM_BYTES = 32;

/**
 * Generates the unguessable token used as the lookup key for an
 * invitation (e.g. inside the /invite/<token> URL). 32 random bytes
 * make enumeration/brute-force practical impossibility.
 */
export function createInviteToken(): string {
  // randomBytes is CSPRNG from Node; hex keeps it URL-safe.
  return randomBytes(TOKEN_RANDOM_BYTES).toString("hex");
}

/**
 * Builds the absolute URL a recipient clicks in their email. Absolute
 * (not relative) because email clients run outside the app origin.
 */
export function buildInviteUrl(token: string): string {
  // Resolves against the configured APP_URL (defaults to localhost).
  return new URL(`/invite/${token}`, env.APP_URL).toString();
}

/**
 * Computes when an invite created at `now` stops being usable.
 */
export function getInviteExpiry(now: Date = new Date()): Date {
  // Milliseconds per day * INVITE_EXPIRY_DAYS.
  return new Date(now.getTime() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
}

/**
 * True when the invite is no longer valid at `now` (or at the moment
 * it is checked). Inclusive comparison: expiry second counts as used.
 */
export function isInviteExpired(
  expiresAt: Date,
  now: Date = new Date(),
): boolean {
  return expiresAt.getTime() <= now.getTime();
}
