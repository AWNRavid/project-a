// Client component: editing happens in local state and only hits the
// oRPC API when the user saves.
"use client";

// shadcn/ui primitives for the settings card and form controls.
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
// Shared, client-safe logo validation so the client check matches
// the server route.
import { workspaceLogoSchema } from "@/features/workspace/schemas";
// Typed oRPC client for the update call, plus TanStack Query utils
// for cache invalidation.
import { orpcClient, orpcTanstackQueryUtils } from "@/lib/orpc/client";
// Type-only import: derives the workspace prop type from the router
// without pulling server code into the client bundle.
import type { Router } from "@/lib/orpc/router";
// React Hook Form with a Zod resolver for validated form state.
import { zodResolver } from "@hookform/resolvers/zod";
// Type-only import: extracts route output types without runtime cost.
import type { InferRouterOutputs } from "@orpc/server";
// Mutation wrapper for the update call with loading/error state.
import { useMutation, useQueryClient } from "@tanstack/react-query";
// Icons and next/image for the logo preview (unoptimized for blob/MinIO URLs).
import { ImagePlusIcon, Loader2, XIcon } from "lucide-react";
import Image from "next/image";
// React hooks for refs, local state, and cleanup.
import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
// Toast notifications for user feedback.
import { toast } from "sonner";
// Zod for composing the form schema.
import * as z from "zod";

// Server type for one workspace, extracted from the listWorkspaces
// route output so the prop shape can never drift from the backend.
type ListWorkspacesResponse =
  InferRouterOutputs<Router>["workspace"]["listWorkspaces"];
type ActiveWorkspace = ListWorkspacesResponse["workspaces"][number];

// Only the name is a real form field, mirroring the create form; the
// logo is managed as separate pending state (see below).
const updateWorkspaceFormSchema = z.object({
  name: z.string().trim().min(1, "Workspace name is required"),
});

// TS type inferred from the schema so form and rules can never drift.
type UpdateWorkspaceFormValues = z.infer<typeof updateWorkspaceFormSchema>;

// Mirrors SUPPORTED_LOGO_IMAGE_TYPES as a comma list for the native
// file picker filter.
const LOGO_INPUT_ACCEPT = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
].join(",");

// Edit form for the active workspace's name and logo. The logo is
// edited via "pending" state and only pushed to the server on save,
// so unsaved changes stay reversible on the client.
export function WorkspaceSettingsForm({
  workspace,
}: {
  // The workspace being edited (the user's first membership).
  workspace: ActiveWorkspace;
}) {
  // Query client invalidates workspace queries after a successful save.
  const queryClient = useQueryClient();
  // Ref to the hidden file input so the round "avatar" button can open
  // the native picker.
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Three-way pending logo state: a newly picked file (logoFile) beats
  // an explicit removal request (removeLogo); with neither pending the
  // stored logo is shown.
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);

  // Form instance seeded with the current name; wired to Zod so
  // invalid submissions never reach the mutation.
  const form = useForm<UpdateWorkspaceFormValues>({
    resolver: zodResolver(updateWorkspaceFormSchema),
    defaultValues: {
      name: workspace.name,
    },
  });

  // Revoke the current object URL whenever it is replaced or unmounted
  // so preview images never leak memory.
  useEffect(() => {
    return () => {
      if (logoPreviewUrl) {
        URL.revokeObjectURL(logoPreviewUrl);
      }
    };
  }, [logoPreviewUrl]);

  // Validates the picked file against the shared logo schema
  // (size/type) BEFORE accepting it, keeps it as pending state, and
  // cancels any pending removal. Invalid files are rejected early
  // with a toast.
  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const result = workspaceLogoSchema.safeParse(file);
    if (!result.success) {
      toast.error(result.error.issues[0]?.message ?? "Invalid logo file");
      return;
    }

    if (logoPreviewUrl) {
      URL.revokeObjectURL(logoPreviewUrl);
    }
    setLogoFile(file);
    setLogoPreviewUrl(URL.createObjectURL(file));
    setRemoveLogo(false);
  };

  // Marks the logo as pending removal (the preview disappears); the
  // stored logo is only gone from storage after a successful save.
  const removeLogoPreview = () => {
    if (logoPreviewUrl) {
      URL.revokeObjectURL(logoPreviewUrl);
    }
    setLogoFile(null);
    setLogoPreviewUrl(null);
    setRemoveLogo(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Discards all pending logo changes (new file and/or removal),
  // returning the preview to the stored logo.
  const resetPendingLogo = () => {
    if (logoPreviewUrl) {
      URL.revokeObjectURL(logoPreviewUrl);
    }
    setLogoFile(null);
    setLogoPreviewUrl(null);
    setRemoveLogo(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // The name is always sent (the form requires it); the logo pieces
  // are only added to the payload when pending, producing exactly the
  // partial updates the server schema expects.
  const updateWorkspaceMutation = useMutation({
    mutationFn: (values: UpdateWorkspaceFormValues) =>
      orpcClient.workspace.updateWorkspace({
        workspaceId: workspace.id,
        name: values.name,
        ...(logoFile ? { logo: logoFile } : {}),
        ...(removeLogo ? { removeLogo: true } : {}),
      }),
    onSuccess: () => {
      toast.success("Workspace updated");
      // Pending logo state is now server state — clear it and refresh
      // every listWorkspaces query (sidebar header included).
      resetPendingLogo();
      queryClient.invalidateQueries({
        queryKey: orpcTanstackQueryUtils.workspace.listWorkspaces
          .queryOptions({ input: {} })
          .queryKey.slice(0, 2),
      });
    },
    onError: (error) => {
      // Surface the server message (e.g. FORBIDDEN) as a toast; the
      // local pending state is kept so the user can retry/adjust.
      toast.error(
        error instanceof Error ? error.message : "Failed to update workspace",
      );
    },
  });

  // handleSubmit has already run Zod validation; only valid values
  // reach the mutation.
  const onSubmit = (values: UpdateWorkspaceFormValues) => {
    updateWorkspaceMutation.mutate(values);
  };

  // Save is disabled while the request is in flight or when nothing
  // changed (name untouched AND no pending logo change).
  const isPending = updateWorkspaceMutation.isPending;
  const hasPendingLogoChanges = logoFile !== null || removeLogo;
  // useWatch (instead of form.watch) keeps React Compiler happy.
  const watchedName = useWatch({ control: form.control, name: "name" });
  const isDirty =
    (watchedName ?? "") !== workspace.name || hasPendingLogoChanges;

  // What the preview shows: the freshly picked file, nothing (pending
  // removal), or the stored logo.
  const displayedLogoUrl = logoFile
    ? logoPreviewUrl
    : removeLogo
      ? null
      : workspace.logoUrl;

  return (
    // Settings card: header copy plus the name/logo form.
    <Card>
      <CardHeader>
        <CardTitle>Workspace settings</CardTitle>
        <CardDescription>
          Update your workspace name and logo. Changes are visible to all
          members.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* shadcn Form provider shares the RHF instance; handleSubmit
            runs validation before onSubmit. */}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex max-w-md flex-col gap-6"
          >
            {/* Logo uploader: the round button opens the hidden file
                input via ref and previews the pending logo. */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Choose workspace logo"
                className="bg-muted/50 hover:border-primary/50 hover:bg-muted relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-dashed transition-colors"
              >
                {/* Preview of the three-way logo state; unoptimized
                    skips the next/image pipeline (blob/MinIO URLs need
                    no optimization). */}
                {displayedLogoUrl ? (
                  <Image
                    src={displayedLogoUrl}
                    alt={`${workspace.name} logo`}
                    width={64}
                    height={64}
                    unoptimized
                    className="size-full object-cover"
                  />
                ) : (
                  <ImagePlusIcon className="text-muted-foreground size-6" />
                )}
              </button>
              <div className="min-w-0 text-sm">
                <div className="flex items-center gap-2">
                  <p className="font-medium">Workspace logo</p>
                  {/* Appears while a logo change is pending; discards
                      it back to the stored state. */}
                  {hasPendingLogoChanges && (
                    <button
                      type="button"
                      onClick={resetPendingLogo}
                      className="text-muted-foreground hover:text-foreground text-xs underline underline-offset-2 transition-colors"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <p className="text-muted-foreground mt-0.5">
                  PNG, JPEG, WebP, GIF, or SVG up to 2MB.
                </p>
                {/* Marks the currently displayed logo for removal. */}
                {displayedLogoUrl && (
                  <button
                    type="button"
                    onClick={removeLogoPreview}
                    className="text-muted-foreground hover:text-destructive mt-1 inline-flex items-center gap-1 text-xs transition-colors"
                  >
                    <XIcon className="size-3" />
                    Remove logo
                  </button>
                )}
              </div>
            </div>
            {/* Hidden native file input triggered by the visible
                button; accept filters formats in the OS picker. */}
            <input
              ref={fileInputRef}
              type="file"
              accept={LOGO_INPUT_ACCEPT}
              className="hidden"
              onChange={handleLogoChange}
            />

            {/* Workspace name field: label, input bound to RHF via
                field props, validation message. */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Workspace name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Acme Inc" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Disabled while saving or when nothing has changed;
                spinner + progress label while pending. */}
            <div>
              <Button
                type="submit"
                disabled={isPending || !isDirty}
                className="min-w-32"
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isPending ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
