// React Email template for workspace invitations. Server-side only
// (rendered by Resend through the `react` send option).
import "server-only";

// React Email v6 primitives (the components the deprecated
// @react-email/components package used to export).
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Text,
} from "react-email";

// Everything the template needs, passed by the invite route.
export type WorkspaceInviteEmailProps = {
  // Display name of the person who sent the invite.
  inviterName: string;
  // Name of the workspace being joined.
  workspaceName: string;
  // Absolute URL to the /invite/<token> page.
  inviteUrl: string;
  // When the invite stops working, rendered as YYYY-MM-DD UTC.
  expiresAt: Date;
};

// Fixed-width date format so the server locale never leaks into the
// rendered email copy.
function formatExpiry(expiresAt: Date): string {
  return expiresAt.toISOString().slice(0, 10);
}

/**
 * Email shown when someone invites a person into a workspace. Keep it
 * simple: one message, one clear action button, one fallback link.
 */
export function WorkspaceInviteEmail({
  inviterName,
  workspaceName,
  inviteUrl,
  expiresAt,
}: WorkspaceInviteEmailProps) {
  return (
    // Root wrapper every email client needs.
    <Html lang="en">
      {/* Snippet shown in inbox list previews. */}
      <Preview>
        {inviterName} invited you to join {workspaceName}
      </Preview>
      <Head />
      <Body style={body}>
        <Container style={container}>
          {/* Invite headline: who and which workspace (template string
              keeps the quotes out of raw text for JSX lint). */}
          <Heading style={heading}>
            {`Join "${workspaceName}" on Trackr`}
          </Heading>
          {/* Short human context for the invite. */}
          <Text style={paragraph}>
            {`${inviterName} has invited you to the "${workspaceName}" workspace.`}
          </Text>
          {/* Primary action: accepts the invite via the invite page. */}
          <Button style={button} href={inviteUrl}>
            Join workspace
          </Button>
          {/* Fallback copy-paste link for clients that strip buttons. */}
          <Text style={muted}>
            Or paste this link into your browser: {inviteUrl}
          </Text>
          <Hr style={hr} />
          {/* Expiry notice so recipients know to act soon. */}
          <Text style={muted}>
            This invitation expires on {formatExpiry(expiresAt)} (UTC).
          </Text>
          {/* Courtesy line to keep the inbox safe. */}
          <Text style={muted}>
            {`If you were not expecting this email, you can safely ignore it.`}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Shared inline styles: emails cannot rely on external CSS, so every
// element carries its own.
const body = {
  backgroundColor: "#f6f7fb", // near-white page background
  margin: 0 as const, // reset all default body margins
  padding: "24px 0", // breathing room around the card
  fontFamily: "Inter, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif", // neutral stack
};

// Centered ~480px card — the largest width that renders in every client.
const container = {
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  margin: "0 auto", // horizontal centering
  padding: "40px 32px",
  maxWidth: "480px",
};

// Email headline style — large enough to read without images.
const heading = {
  fontSize: "22px",
  lineHeight: "30px",
  color: "#111827",
  margin: "0 0 16px",
};

/* Regular body copy. */
const paragraph = {
  fontSize: "15px",
  lineHeight: "22px",
  color: "#1f2937",
  margin: "0 0 20px",
};

/* Primary CTA. */
const button = {
  backgroundColor: "#3b82f6",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: "600",
  padding: "12px 24px",
  textDecoration: "none",
};

/* De-emphasized supporting copy. */
const muted = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "#6b7280",
  margin: "12px 0",
};

/* Slim divider before the footer notes. */
const hr = {
  borderColor: "#e5e7eb",
  margin: "28px 0",
};
