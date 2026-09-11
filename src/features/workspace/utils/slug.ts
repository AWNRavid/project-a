// Postgres has no hard limit on the slug column, but shorter slugs
// are friendlier in URLs; names are truncated to fit.
const MAX_SLUG_LENGTH = 64;
// Length of the random suffix appended to the base slug for fallbacks.
const SUFFIX_LENGTH = 6;
// Total slug attempts per creation: the natural base + this many
// suffixed candidates before giving up.
const MAX_CANDIDATES = 5;
// Used when a name produces an empty slug (e.g. "!!!"). The random
// suffix then still makes it unique.
const FALLBACK_BASE = "workspace";
// URL-safe lowercase alphabet for the collision suffixes.
const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

/**
 * Converts a workspace name into a URL-friendly slug (e.g.
 * "Acme Inc!" -> "acme-inc"). Diacritics are stripped so
 * "Société Générale" becomes "societe-generale".
 */
export function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, "");

  return slug.length > 0 ? slug : FALLBACK_BASE;
}

/**
 * Generates a random lowercase alphanumeric suffix for slug
 * collision fallbacks.
 */
export function createRandomSuffix(length = SUFFIX_LENGTH): string {
  const randomBytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(
    randomBytes,
    (byte) => ALPHABET[byte % ALPHABET.length],
  ).join("");
}

/**
 * Builds the candidate slugs to try when creating a workspace: the
 * natural slug first, then suffixed fallbacks for collisions.
 */
export function buildSlugCandidates(name: string): string[] {
  const base = slugify(name);
  const candidates = new Set<string>([base]);

  while (candidates.size < MAX_CANDIDATES) {
    candidates.add(`${base}-${createRandomSuffix()}`);
  }

  return [...candidates];
}
