"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { IssueDetail } from "@/features/issue/types";
import { orpcClient, orpcTanstackQueryUtils } from "@/lib/orpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, TagIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { IssueLabelSummary } from "../types";
import { LabelBadge } from "./label-badge";

interface IssueLabelsSectionProps {
  issue: IssueDetail;
}

/**
 * Shows an issue's labels and lets any workspace member toggle them.
 * The server replaces the full set, so each toggle sends the complete
 * selection and the activity log records the diff.
 */
export function IssueLabelsSection({ issue }: IssueLabelsSectionProps) {
  const queryClient = useQueryClient();
  // The parent keys this section by issue id, so state starts fresh
  // each time a different issue opens.
  const [labels, setLabels] = useState<IssueLabelSummary[]>(issue.labels);

  const { data: labelsData } = useQuery(
    orpcTanstackQueryUtils.label.listLabels.queryOptions({
      input: { workspaceId: issue.workspaceId },
    }),
  );

  const setLabelsMutation = useMutation({
    mutationFn: (labelIds: string[]) =>
      orpcClient.label.setIssueLabels({ issueId: issue.id, labelIds }),
    onSuccess: (result) => {
      setLabels(result.labels);
      queryClient.invalidateQueries({
        queryKey: orpcTanstackQueryUtils.issue.getAllIssues
          .queryOptions({ input: { projectId: issue.projectId } })
          .queryKey.slice(0, 2),
      });
      queryClient.invalidateQueries({
        queryKey: orpcTanstackQueryUtils.issue.getIssue.queryOptions({
          input: { issueId: issue.id },
        }).queryKey,
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update labels",
      );
    },
  });

  const selectedIds = new Set(labels.map((label) => label.id));

  const toggleLabel = (labelId: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) {
      next.add(labelId);
    } else {
      next.delete(labelId);
    }
    setLabelsMutation.mutate([...next]);
  };

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <h4 className="chart-label flex items-center gap-1.5">
          <TagIcon className="size-3.5" /> Labels
        </h4>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground h-7 gap-1.5 px-2 text-[12px]"
              disabled={setLabelsMutation.isPending}
            >
              {setLabelsMutation.isPending ? (
                <Loader2Icon className="size-3.5 animate-spin" />
              ) : (
                <TagIcon className="size-3.5" />
              )}
              Edit
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Labels</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {labelsData?.labels.length ? (
              labelsData.labels.map((label) => (
                <DropdownMenuCheckboxItem
                  key={label.id}
                  checked={selectedIds.has(label.id)}
                  disabled={setLabelsMutation.isPending}
                  onCheckedChange={(checked) =>
                    toggleLabel(label.id, checked === true)
                  }
                >
                  <span
                    className="size-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: label.color }}
                    aria-hidden
                  />
                  {label.name}
                </DropdownMenuCheckboxItem>
              ))
            ) : (
              <p className="text-muted-foreground px-2 py-3 text-xs">
                No labels yet. Create them in workspace settings.
              </p>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {labels.length ? (
        <div className="flex flex-wrap gap-1.5">
          {labels.map((label) => (
            <LabelBadge key={label.id} label={label} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm italic">No labels.</p>
      )}
    </div>
  );
}
