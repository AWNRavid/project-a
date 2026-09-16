// Thin wrapper around the Resend email API used by every email in the
// app. Server-only: the Resend client must never be bundled to the
// browser (it holds the API key).
import "server-only";

// Central type-safe env access (RESEND_API_KEY, EMAIL_FROM).
import { env } from "@/env";
// Pino logger scoped to the email module.
import { createLogger } from "@/lib/logger";
// The Resend SDK client for actually delivering emails.
import { Resend } from "resend";

// One client instance for the module lifetime (it only holds config).
const resend = new Resend(env.RESEND_API_KEY);

// Dedicated pino logger so email failures are filterable in logs.
const logger = createLogger("email");

// Payload the application passes to sendEmail: destination, headline,
// and the pre-built React (react-email) content.
export type SendEmailInput = {
  // Full recipient address, e.g. "budi@email.com".
  to: string;
  // Subject line shown in the recipient's inbox.
  subject: string;
  // React element produced by a react-email template; Resend renders
  // it to HTML (and text fallback) server-side.
  react: React.ReactNode;
};

/**
 * Sends one email through Resend and throws a descriptive error when
 * delivery fails, so callers (e.g. invite routes) can roll back any
 * side effects they created for this send.
 */
export async function sendEmail(input: SendEmailInput): Promise<void> {
  // Delegates to Resend's single-send endpoint.
  const { data, error } = await resend.emails.send({
    // Configured "From" identity (name + address in one string).
    from: env.EMAIL_FROM,
    // Recipient address.
    to: input.to,
    // Email subject line.
    subject: input.subject,
    // Pre-built React content — Resend renders it to HTML for us.
    react: input.react,
  });

  // Resend reports failures via `error` instead of throwing.
  if (error || !data) {
    // Log the raw provider error for debugging (without participants'
    // content).
    logger.error({ err: error, to: input.to }, "email.send.failed");
    // Bubble up so the caller can surface a user-facing error.
    throw new Error(error?.message ?? "Failed to send email");
  }

  // Successful delivery: log the Resend message id for tracing.
  logger.info(
    { to: input.to, subject: input.subject, id: data.id },
    "email.send.ok",
  );
}
