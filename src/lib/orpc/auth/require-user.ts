import type { Auth } from "@/lib/auth";
import { ORPCError } from "@orpc/server";

type SessionUser = Auth["$Infer"]["Session"]["user"];

/**
 * Narrows the nullable user attached by the auth middleware into a
 * guaranteed user. The middleware already rejects unauthenticated
 * requests, so this is a defensive check that also satisfies the
 * type system without non-null assertions.
 */
export function requireUser(user: SessionUser | null | undefined): SessionUser {
  if (!user) {
    throw new ORPCError("UNAUTHORIZED", { message: "Unauthorized" });
  }
  return user;
}
