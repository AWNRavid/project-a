// Client component: keeps local form/file state and calls the oRPC
// API from the browser.
"use client";

// shadcn/ui primitives for the card layout and form controls.
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
// Shared, client-safe Zod schemas (name + logo rules) so client
// validation matches the server.
import {
  workspaceLogoSchema,
  workspaceNameSchema,
} from "@/features/workspace/schemas";
// Typed oRPC client for the create call, plus TanStack Query utils
// for cache invalidation.
import { orpcClient, orpcTanstackQueryUtils } from "@/lib/orpc/client";
// React Hook Form with a Zod resolver for validated form state.
import { zodResolver } from "@hookform/resolvers/zod";
// Mutation wrapper for the create call with loading/error state.
import { useMutation, useQueryClient } from "@tanstack/react-query";
// Icons and next/image for the logo preview (unoptimized for blob URLs).
import { ImagePlusIcon, Loader2, XIcon } from "lucide-react";
import Image from "next/image";
// Next.js router for the post-create redirect.
import { useRouter } from "next/navigation";
// React hooks for refs, local state, and cleanup.
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
// Toast notifications for user feedback.
import { toast } from "sonner";
// Zod for composing the form schema.
import * as z from "zod";

// Only the name is a real form field; the logo is kept as separate
// local state because file inputs do not fit React Hook Form's value
// model.
const createWorkspaceFormSchema = z.object({
  name: workspaceNameSchema,
});

// TS type inferred from the schema so form and rules can never drift.
type CreateWorkspaceFormValues = z.infer<typeof createWorkspaceFormSchema>;

// Mirrors SUPPORTED_LOGO_IMAGE_TYPES as a comma list for the native
// file picker filter.
const LOGO_INPUT_ACCEPT = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
].join(",");

// Onboarding form: collects a workspace name + optional logo, then
// creates the workspace via oRPC.
export function CreateWorkspaceForm() {
  // Router + query client for the redirect and cache invalidation
  // after creation.
  const router = useRouter();
  const queryClient = useQueryClient();

  // Ref to the hidden file input so the round "avatar" button can open
  // the native picker.
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pending logo: the selected File (sent on submit) and its blob:
  // preview URL (rendered in the avatar).
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);

  // Form instance wired to Zod; errors surface through FormMessage
  // below.
  const form = useForm<CreateWorkspaceFormValues>({
    resolver: zodResolver(createWorkspaceFormSchema),
    defaultValues: {
      name: "",
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
  // (size/type) BEFORE accepting it, then swaps the preview (revoking
  // the old object URL). Invalid files are rejected early with a
  // toast.
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
  };

  // Clears the pending logo and resets the hidden input so
  // re-selecting the same file still fires onChange.
  const removeLogo = () => {
    if (logoPreviewUrl) {
      URL.revokeObjectURL(logoPreviewUrl);
    }
    setLogoFile(null);
    setLogoPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Sends the create request through the type-safe oRPC client (the
  // logo File travels in the same payload). On success: invalidate all
  // listWorkspaces queries so the sidebar picks up the new workspace,
  // then redirect to the dashboard. On failure: show the server
  // message (e.g. slug conflict) as a toast.
  const createWorkspaceMutation = useMutation({
    mutationFn: (values: CreateWorkspaceFormValues) =>
      orpcClient.workspace.createWorkspace({
        name: values.name,
        logo: logoFile ?? undefined,
      }),
    onSuccess: () => {
      toast.success("Workspace created");
      queryClient.invalidateQueries({
        queryKey: orpcTanstackQueryUtils.workspace.listWorkspaces
          .queryOptions({ input: {} })
          .queryKey.slice(0, 2),
      });
      router.push("/dashboard");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to create workspace",
      );
    },
  });

  // handleSubmit has already run Zod validation; only valid values
  // reach the mutation.
  const onSubmit = (values: CreateWorkspaceFormValues) => {
    createWorkspaceMutation.mutate(values);
  };

  // Shorthand for disabling the submit button and showing the spinner.
  const isPending = createWorkspaceMutation.isPending;

  return (
    // One panel on the onboarding chart: logo, name, create.
    <div className="w-full max-w-[420px]">
      <div className="border-border bg-card overflow-hidden rounded-[3px] border">
        <div className="border-border border-b px-6 py-5">
          <h1 className="text-[20px] leading-tight font-semibold tracking-tight">
            Create your workspace
          </h1>
          <p className="text-muted-foreground mt-1 text-[13px] leading-relaxed">
            A workspace holds your team, projects and issues. You will be its
            owner.
          </p>
        </div>

        {/* shadcn Form provider shares the RHF instance; handleSubmit
            runs validation before onSubmit. */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 p-6">
            {/* Logo uploader: the square button opens the hidden file
                input via ref. */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Choose workspace logo"
                className="group border-border bg-muted/40 hover:border-primary/50 relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-[2px] border border-dashed transition-colors"
              >
                {/* Blob preview; unoptimized skips the next/image
                    pipeline (blob/MinIO URLs need no optimization). */}
                {logoPreviewUrl ? (
                  <Image
                    src={logoPreviewUrl}
                    alt="Workspace logo preview"
                    width={56}
                    height={56}
                    unoptimized
                    className="size-full object-cover"
                  />
                ) : (
                  <ImagePlusIcon className="text-muted-foreground group-hover:text-primary size-5 transition-colors" />
                )}
              </button>
              <div className="min-w-0 text-[13px]">
                <div className="flex items-center gap-2">
                  <p className="font-medium">Workspace logo</p>
                  {/* Visible only while a logo is pending; removes it
                      before submit. */}
                  {logoFile && (
                    <button
                      type="button"
                      onClick={removeLogo}
                      aria-label="Remove workspace logo"
                      className="bg-muted text-muted-foreground hover:bg-accent hover:text-foreground inline-flex size-5 items-center justify-center rounded-[2px] transition-colors"
                    >
                      <XIcon className="size-3" />
                    </button>
                  )}
                </div>
                <p className="text-muted-foreground mt-0.5 text-[11px]">
                  Optional. PNG, JPEG, WebP, GIF or SVG up to 2MB.
                </p>
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
                  <FormLabel className="text-[12px]">Workspace name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Acme Inc" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Disabled while the request is in flight; spinner +
                progress label while pending. */}
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? "Creating workspace..." : "Create workspace"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
