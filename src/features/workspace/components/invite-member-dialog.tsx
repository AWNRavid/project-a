// Client dialog for inviting a person (email + role) into the
// workspace. Server errors surface as toasts.
"use client";

// shadcn/ui Dialog primitives.
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
// shadcn/ui Form field set (built on react-hook-form).
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
// Text input for the invitee's email address.
import { Input } from "@/components/ui/input";
// Select dropdown used for the role field.
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// Email + role rules shared with the server route (both client-safe).
import {
  inviteEmailSchema,
  invitedRoleSchema,
  invitedRoles,
} from "@/features/workspace/schemas";
// Typed oRPC client + TanStack Query utils for cache invalidation.
import { orpcClient, orpcTanstackQueryUtils } from "@/lib/orpc/client";
// Zod resolver bridges the schema into react-hook-form.
import { zodResolver } from "@hookform/resolvers/zod";
// Mutations give pending state + error hooks in one object.
import { useMutation, useQueryClient } from "@tanstack/react-query";
// Icons: spinner + "invite member" trigger glyph.
import { Loader2, UserPlusIcon } from "lucide-react";
// Local UI state (dialog open/closed).
import { useState } from "react";
// Core form API (typed from the schema below).
import { useForm } from "react-hook-form";
// Toast notifications for success/error feedback.
import { toast } from "sonner";
// Schema composer for the dialog form.
import * as z from "zod";

// Prop shape: the dialog needs the workspace it should invite into.
type WorkspaceId = { workspaceId: string };

// Client mirror of the inviteMember route input: a valid email plus a
// bounded role (the server re-validates everything authoritatively).
const inviteFormSchema = z.object({
  email: inviteEmailSchema,
  role: invitedRoleSchema,
});

// TS type inferred from the schema so the form can never drift.
type InviteFormValues = z.infer<typeof inviteFormSchema>;

export function InviteMemberDialog({ workspaceId }: WorkspaceId) {
  // Controlled open state so success/submit — not Radix internals —
  // decides exactly when the dialog closes.
  const [open, setOpen] = useState(false);

  // Query client invalidates listInvites after a successful send.
  const queryClient = useQueryClient();

  // RHF instance wired to Zod: empty email to start, lowest-privilege
  // role ("member") selected by default.
  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      email: "",
      role: "member",
    },
  });

  // Sends the invite; on success it refreshes the pending list so the
  // new row appears immediately and closes the dialog.
  const inviteMemberMutation = useMutation({
    // Type-safe oRPC call carrying the form values + workspace target.
    mutationFn: (values: InviteFormValues) =>
      orpcClient.workspace.inviteMember({
        workspaceId,
        email: values.email,
        role: values.role,
      }),
    onSuccess: (invite) => {
      // Confirm to the inviter which address is now pending.
      toast.success(`Invitation sent to ${invite.email}`);
      // Fresh pending-invites list (listInvites query).
      queryClient.invalidateQueries({
        queryKey: orpcTanstackQueryUtils.workspace.listInvites
          .queryOptions({ input: { workspaceId } })
          .queryKey.slice(0, 3),
      });
      // Clear the form (for the next invite) and close the dialog.
      form.reset();
      setOpen(false);
    },
    onError: (error) => {
      // Server replies like "already a member" / "already pending"
      // are exactly what the inviting user needs to hear.
      toast.error(
        error instanceof Error ? error.message : "Failed to send invite",
      );
    },
  });

  // handleSubmit has already run Zod validation; only valid values
  // reach the mutation.
  const onSubmit = (values: InviteFormValues) => {
    inviteMemberMutation.mutate(values);
  };

  // Shorthand for the in-flight flag used by the submit button.
  const isPending = inviteMemberMutation.isPending;

  return (
    // Controlled dialog: open/close is owned by this component's state.
    <Dialog open={open} onOpenChange={setOpen}>
      {/* The only control that opens the dialog. */}
      <DialogTrigger asChild>
        <Button size="sm">
          {/* Icon of intent; the label names the action. */}
          <UserPlusIcon className="size-4" />
          Invite member
        </Button>
      </DialogTrigger>
      {/* Panel copy: title + one-line explanation. */}
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Invite member</DialogTitle>
          <DialogDescription>
            They receive an email link valid for 7 days.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          {/* Single submit handler; invalid values are stopped by
              handleSubmit before the mutation is reached. */}
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            {/* Email field: label + input + validation error spot. */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="colleague@company.com"
                      type="email"
                      className="w-full"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Role field: dropdown limited to invitable roles. */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    // Radix gives back a plain string; re-validate it
                    // against the shared enum before RHF stores it.
                    onValueChange={(value) => {
                      // safeParse keeps this conversion total — any
                      // unexpected value falls back to "member".
                      const result = invitedRoleSchema.safeParse(value);
                      field.onChange(result.success ? result.data : "member");
                    }}
                    // Controlled value mirrors the form state.
                    value={field.value}
                  >
                    <FormControl>
                      {/* The trigger button the user clicks. */}
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pick a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {/* One option per invitable role ("member" and
                          "admin"); owners are never invite targets. */}
                      {invitedRoles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {/* Capitalized dropdown option text. */}
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              {/* Cancel closes without sending (type button so the
                  form's submit handler never fires). */}
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              {/* Submit: disabled while the request is in flight. */}
              <Button type="submit" disabled={isPending}>
                {/* Spinner communicates the sending activity. */}
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {/* Label flips to progressive tense while pending. */}
                {isPending ? "Sending..." : "Send invite"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
