"use client";

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
import {
  workspaceLogoSchema,
  workspaceNameSchema,
} from "@/features/workspace/schemas";
import { orpcClient, orpcTanstackQueryUtils } from "@/lib/orpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImagePlusIcon, Loader2, XIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

const createWorkspaceFormSchema = z.object({
  name: workspaceNameSchema,
});

type CreateWorkspaceFormValues = z.infer<typeof createWorkspaceFormSchema>;

const LOGO_INPUT_ACCEPT = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
].join(",");

export function CreateWorkspaceForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);

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

  const onSubmit = (values: CreateWorkspaceFormValues) => {
    createWorkspaceMutation.mutate(values);
  };

  const isPending = createWorkspaceMutation.isPending;

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-white/10 bg-[#111827] p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <p className="animate-fade-in-up mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            Get started
          </p>
          <h1
            className="text-2xl font-bold tracking-tight text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Create your workspace
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            A workspace is where your team, projects, and issues live.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Choose workspace logo"
                className="group relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-dashed border-white/20 bg-white/5 transition-colors hover:border-blue-500/50 hover:bg-blue-500/10"
              >
                {logoPreviewUrl ? (
                  <Image
                    src={logoPreviewUrl}
                    alt="Workspace logo preview"
                    width={64}
                    height={64}
                    unoptimized
                    className="size-full object-cover"
                  />
                ) : (
                  <ImagePlusIcon className="size-6 text-slate-400 transition-colors group-hover:text-blue-400" />
                )}
              </button>
              <div className="min-w-0 text-sm">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-200">Workspace logo</p>
                  {logoFile && (
                    <button
                      type="button"
                      onClick={removeLogo}
                      aria-label="Remove workspace logo"
                      className="inline-flex size-5 items-center justify-center rounded-full bg-white/10 text-slate-300 transition-colors hover:bg-white/20 hover:text-white"
                    >
                      <XIcon className="size-3" />
                    </button>
                  )}
                </div>
                <p className="mt-0.5 text-slate-500">
                  Optional. PNG, JPEG, WebP, GIF, or SVG up to 2MB.
                </p>
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
                  <FormLabel className="text-slate-200">
                    Workspace name
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Acme Inc"
                      className="border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus-visible:border-blue-500/50"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full bg-blue-500 text-white hover:bg-blue-600"
              disabled={isPending}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? "Creating workspace..." : "Create workspace"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
