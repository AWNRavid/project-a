"use client";

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
import { workspaceLogoSchema } from "@/features/workspace/schemas";
import { orpcClient, orpcTanstackQueryUtils } from "@/lib/orpc/client";
import type { Router } from "@/lib/orpc/router";
import { zodResolver } from "@hookform/resolvers/zod";
import type { InferRouterOutputs } from "@orpc/server";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImagePlusIcon, Loader2, XIcon } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

type ListWorkspacesResponse =
  InferRouterOutputs<Router>["workspace"]["listWorkspaces"];
type ActiveWorkspace = ListWorkspacesResponse["workspaces"][number];

const updateWorkspaceFormSchema = z.object({
  name: z.string().trim().min(1, "Workspace name is required"),
});

type UpdateWorkspaceFormValues = z.infer<typeof updateWorkspaceFormSchema>;

const LOGO_INPUT_ACCEPT = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
].join(",");

export function WorkspaceSettingsForm({
  workspace,
}: {
  workspace: ActiveWorkspace;
}) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);

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
      resetPendingLogo();
      queryClient.invalidateQueries({
        queryKey: orpcTanstackQueryUtils.workspace.listWorkspaces
          .queryOptions({ input: {} })
          .queryKey.slice(0, 2),
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update workspace",
      );
    },
  });

  const onSubmit = (values: UpdateWorkspaceFormValues) => {
    updateWorkspaceMutation.mutate(values);
  };

  const isPending = updateWorkspaceMutation.isPending;
  const hasPendingLogoChanges = logoFile !== null || removeLogo;
  // useWatch (instead of form.watch) keeps React Compiler happy.
  const watchedName = useWatch({ control: form.control, name: "name" });
  const isDirty =
    (watchedName ?? "") !== workspace.name || hasPendingLogoChanges;

  const displayedLogoUrl = logoFile
    ? logoPreviewUrl
    : removeLogo
      ? null
      : workspace.logoUrl;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workspace settings</CardTitle>
        <CardDescription>
          Update your workspace name and logo. Changes are visible to all
          members.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex max-w-md flex-col gap-6"
          >
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Choose workspace logo"
                className="bg-muted/50 hover:border-primary/50 hover:bg-muted relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-dashed transition-colors"
              >
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
            <input
              ref={fileInputRef}
              type="file"
              accept={LOGO_INPUT_ACCEPT}
              className="hidden"
              onChange={handleLogoChange}
            />

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
