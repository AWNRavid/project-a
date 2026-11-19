"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { orpcClient, orpcTanstackQueryUtils } from "@/lib/orpc/client";
import { cn } from "@/lib/utils";
import {
  type QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Loader2Icon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DEFAULT_LABEL_COLOR, LABEL_COLORS } from "../label-colors";
import type { Label } from "../types";

interface LabelSettingsProps {
  workspaceId: string;
}

/**
 * oRPC keys start with the operation path array, so invalidating every
 * issue query needs a predicate rather than a string prefix.
 */
function invalidateIssueQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({
    predicate: (query) => {
      const [path] = query.queryKey;
      return Array.isArray(path) && path[0] === "issue";
    },
  });
}

/**
 * Workspace label manager: list, create, rename/recolor, delete.
 */
export function LabelSettings({ workspaceId }: LabelSettingsProps) {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);
  const [deletingLabel, setDeletingLabel] = useState<Label | null>(null);

  const labelsQueryKey = orpcTanstackQueryUtils.label.listLabels.queryOptions({
    input: { workspaceId },
  }).queryKey;

  const { data, isLoading } = useQuery(
    orpcTanstackQueryUtils.label.listLabels.queryOptions({
      input: { workspaceId },
    }),
  );

  const deleteMutation = useMutation({
    mutationFn: (labelId: string) => orpcClient.label.deleteLabel({ labelId }),
    onSuccess: () => {
      toast.success("Label deleted");
      setDeletingLabel(null);
      queryClient.invalidateQueries({ queryKey: labelsQueryKey });
      invalidateIssueQueries(queryClient);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete label",
      );
    },
  });

  return (
    <div className="border-border overflow-hidden rounded-[3px] border">
      <div className="border-border flex flex-row items-center justify-between gap-4 border-b px-5 py-4">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight">Labels</h2>
          <p className="text-muted-foreground mt-0.5 text-[12px]">
            Reusable tags shared by every project in this workspace.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setEditingLabel(null);
            setFormOpen(true);
          }}
        >
          <PlusIcon className="mr-1.5 size-3.5" />
          New label
        </Button>
      </div>

      <div className="p-5">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : data?.labels.length ? (
          <ul className="divide-border divide-y">
            {data.labels.map((label) => (
              <li
                key={label.id}
                className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: label.color }}
                    aria-hidden
                  />
                  <span className="truncate text-[13px] font-medium">
                    {label.name}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground size-7"
                    aria-label={`Edit ${label.name}`}
                    onClick={() => {
                      setEditingLabel(label);
                      setFormOpen(true);
                    }}
                  >
                    <PencilIcon className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive size-7"
                    aria-label={`Delete ${label.name}`}
                    onClick={() => setDeletingLabel(label)}
                  >
                    <Trash2Icon className="size-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">
            No labels yet. Create one to tag issues across the workspace.
          </p>
        )}
      </div>

      {formOpen && (
        <LabelFormDialog
          workspaceId={workspaceId}
          label={editingLabel}
          open
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) setEditingLabel(null);
          }}
        />
      )}

      <Dialog
        open={Boolean(deletingLabel)}
        onOpenChange={(open) => {
          if (!open) setDeletingLabel(null);
        }}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete label</DialogTitle>
            <DialogDescription>
              {deletingLabel
                ? `"${deletingLabel.name}" will be removed from every issue in this workspace.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingLabel(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (deletingLabel) deleteMutation.mutate(deletingLabel.id);
              }}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2Icon className="mr-2 size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete label"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface LabelFormDialogProps {
  workspaceId: string;
  label: Label | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function LabelFormDialog({
  workspaceId,
  label,
  open,
  onOpenChange,
}: LabelFormDialogProps) {
  const queryClient = useQueryClient();
  // Mounted only while open, so props seed the fields exactly once.
  const [name, setName] = useState(label?.name ?? "");
  const [color, setColor] = useState<string>(
    label?.color ?? DEFAULT_LABEL_COLOR,
  );

  const labelsQueryKey = orpcTanstackQueryUtils.label.listLabels.queryOptions({
    input: { workspaceId },
  }).queryKey;

  const saveMutation = useMutation({
    mutationFn: () =>
      label
        ? orpcClient.label.updateLabel({
            labelId: label.id,
            name: name.trim(),
            color,
          })
        : orpcClient.label.createLabel({
            workspaceId,
            name: name.trim(),
            color,
          }),
    onSuccess: () => {
      toast.success(label ? "Label updated" : "Label created");
      queryClient.invalidateQueries({ queryKey: labelsQueryKey });
      invalidateIssueQueries(queryClient);
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to save label",
      );
    },
  });

  const canSave = name.trim().length > 0 && !saveMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{label ? "Edit label" : "New label"}</DialogTitle>
          <DialogDescription>
            Labels are shared across every project in this workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="label-name" className="text-[13px] font-medium">
              Name
            </label>
            <Input
              id="label-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. bug, design, ops"
              maxLength={50}
            />
          </div>

          <div className="space-y-1.5">
            <span className="text-[13px] font-medium">Color</span>
            <div className="flex flex-wrap gap-2">
              {LABEL_COLORS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-label={option.name}
                  aria-pressed={color === option.value}
                  onClick={() => setColor(option.value)}
                  className={cn(
                    "size-6 rounded-[2px] border-2 transition-colors",
                    color === option.value
                      ? "border-foreground"
                      : "border-transparent",
                  )}
                  style={{ backgroundColor: option.value }}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saveMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!canSave}
            onClick={() => saveMutation.mutate()}
          >
            {saveMutation.isPending ? (
              <>
                <Loader2Icon className="mr-2 size-4 animate-spin" />
                Saving...
              </>
            ) : label ? (
              "Save changes"
            ) : (
              "Create label"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
