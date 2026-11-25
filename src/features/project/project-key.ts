import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ", 4);

export const MAX_KEY_ATTEMPTS = 3;

/** Builds a short, readable project key, e.g. "MOB-4F2A". */
export function projectKey(title: string): string {
  const cleanTitle = title.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const prefix = cleanTitle.slice(0, 3).padEnd(3, "X");
  return `${prefix}-${nanoid()}`;
}

/** Postgres unique-violation code, thrown when two requests pick the same key. */
export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}
