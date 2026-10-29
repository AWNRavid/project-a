"use client";

import { SortableHeader } from "@/components/table/sortable-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { fuzzyFilter } from "@/lib/table/fuzzy-filter";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  CalendarIcon,
  CheckCircleIcon,
  EyeIcon,
  FilterXIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { IssueDetail, IssuePriority, IssueStatus } from "../types";
import { CreateIssueDialog } from "./create-issue-dialog";
import { DeleteIssueDialog } from "./delete-issue-dialog";
import { EditIssueDialog } from "./edit-issue-dialog";
import { IssueDetailDialog } from "./issue-detail-dialog";
import { IssuePriorityBadge } from "./issue-priority-badge";
import { IssueStatusBadge } from "./issue-status-badge";

interface WorkspaceMemberSummary {
  userId: string;
  name: string;
  email: string;
  image: string | null;
}

interface IssueTableProps {
  projectId: string;
  workspaceId?: string;
  issues: IssueDetail[];
  isLoading: boolean;
  members?: WorkspaceMemberSummary[];
}

/**
 * Data table visualizing, sorting, and filtering project issues using TanStack Table.
 */
export function IssueTable({
  projectId,
  workspaceId,
  issues,
  isLoading,
  members = [],
}: IssueTableProps) {
  // Filtering states
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 250);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");

  // Sorting state
  const [sorting, setSorting] = useState<SortingState>([
    { id: "number", desc: false },
  ]);

  // Pagination state
  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);

  // Dialog management
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedIssueForDetail, setSelectedIssueForDetail] =
    useState<IssueDetail | null>(null);
  const [selectedIssueForEdit, setSelectedIssueForEdit] =
    useState<IssueDetail | null>(null);
  const [selectedIssueForDelete, setSelectedIssueForDelete] =
    useState<IssueDetail | null>(null);

  // Filtered dataset
  const filteredData = useMemo(() => {
    return issues.filter((issue) => {
      // 1. Text Search across title, description, and identifier
      if (debouncedSearch) {
        const query = debouncedSearch.toLowerCase();
        const identifier = `${issue.projectKey}-${issue.number}`.toLowerCase();
        const matchesTitle = issue.title.toLowerCase().includes(query);
        const matchesDescription = Boolean(
          issue.description?.toLowerCase().includes(query),
        );
        const matchesIdentifier = identifier.includes(query);

        if (!matchesTitle && !matchesDescription && !matchesIdentifier) {
          return false;
        }
      }

      // 2. Status filter
      if (statusFilter !== "all" && issue.status !== statusFilter) {
        return false;
      }

      // 3. Priority filter
      if (priorityFilter !== "all" && issue.priority !== priorityFilter) {
        return false;
      }

      // 4. Assignee filter
      if (assigneeFilter !== "all") {
        if (assigneeFilter === "unassigned") {
          if (issue.assigneeId !== null) return false;
        } else if (issue.assigneeId !== assigneeFilter) {
          return false;
        }
      }

      return true;
    });
  }, [issues, debouncedSearch, statusFilter, priorityFilter, assigneeFilter]);

  const hasActiveFilters =
    search.trim() !== "" ||
    statusFilter !== "all" ||
    priorityFilter !== "all" ||
    assigneeFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setAssigneeFilter("all");
  };

  const columns = useMemo<ColumnDef<IssueDetail>[]>(
    () => [
      {
        accessorKey: "number",
        id: "number",
        header: ({ column }) => (
          <SortableHeader column={column}>Key</SortableHeader>
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground font-mono text-xs font-semibold uppercase">
            {row.original.projectKey}-{row.original.number}
          </span>
        ),
        sortingFn: (rowA, rowB) => rowA.original.number - rowB.original.number,
      },
      {
        accessorKey: "title",
        id: "title",
        header: ({ column }) => (
          <SortableHeader column={column}>Title</SortableHeader>
        ),
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => setSelectedIssueForDetail(row.original)}
            className="group flex max-w-[340px] flex-col text-left"
          >
            <span className="group-hover:text-primary truncate text-sm font-medium text-slate-900 group-hover:underline dark:text-slate-100">
              {row.original.title}
            </span>
            {row.original.description && (
              <span className="text-muted-foreground truncate text-xs">
                {row.original.description}
              </span>
            )}
          </button>
        ),
      },
      {
        accessorKey: "status",
        id: "status",
        header: ({ column }) => (
          <SortableHeader column={column}>Status</SortableHeader>
        ),
        cell: ({ row }) => (
          <IssueStatusBadge status={row.original.status as IssueStatus} />
        ),
      },
      {
        accessorKey: "priority",
        id: "priority",
        header: ({ column }) => (
          <SortableHeader column={column}>Priority</SortableHeader>
        ),
        cell: ({ row }) => (
          <IssuePriorityBadge
            priority={row.original.priority as IssuePriority}
          />
        ),
      },
      {
        accessorKey: "assigneeName",
        id: "assignee",
        header: ({ column }) => (
          <SortableHeader column={column}>Assignee</SortableHeader>
        ),
        cell: ({ row }) => {
          const assigneeName = row.original.assigneeName;
          const assigneeImage = row.original.assigneeImage;

          if (!row.original.assigneeId) {
            return (
              <span className="text-muted-foreground text-xs italic">
                Unassigned
              </span>
            );
          }

          return (
            <div className="flex items-center gap-2">
              <Avatar className="size-6">
                {assigneeImage ? <AvatarImage src={assigneeImage} /> : null}
                <AvatarFallback className="text-[10px]">
                  {(assigneeName ?? "U").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="max-w-[120px] truncate text-xs font-medium">
                {assigneeName ?? "Member"}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "dueDate",
        id: "dueDate",
        header: ({ column }) => (
          <SortableHeader column={column}>Due Date</SortableHeader>
        ),
        cell: ({ row }) => {
          const dueDate = row.original.dueDate;
          if (!dueDate) {
            return <span className="text-muted-foreground text-xs">-</span>;
          }

          const parsedDate = new Date(dueDate);
          const isOverdue =
            parsedDate.getTime() < Date.now() &&
            row.original.status !== "done" &&
            row.original.status !== "cancelled";

          return (
            <span
              className={`inline-flex items-center gap-1 text-xs ${
                isOverdue
                  ? "font-semibold text-rose-600 dark:text-rose-400"
                  : "text-muted-foreground"
              }`}
            >
              <CalendarIcon className="size-3" />
              {parsedDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          );
        },
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground size-8"
                >
                  <MoreHorizontalIcon className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setSelectedIssueForDetail(row.original)}
                >
                  <EyeIcon className="text-muted-foreground mr-2 size-4" />
                  View details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSelectedIssueForEdit(row.original)}
                >
                  <PencilIcon className="text-muted-foreground mr-2 size-4" />
                  Edit issue
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                  onClick={() => setSelectedIssueForDelete(row.original)}
                >
                  <Trash2Icon className="mr-2 size-4" />
                  Delete issue
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [],
  );

  // eslint-disable-next-line react-hooks/incompatible-library -- using useRef trick to bypass React Compiler optimization
  const tableHook = useReactTable({
    data: filteredData,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter,
    },
    state: {
      sorting,
      pagination: {
        pageIndex,
        pageSize,
      },
    },
    onSortingChange: setSorting,
    onPaginationChange: (updater) => {
      const nextState =
        typeof updater === "function"
          ? updater({ pageIndex, pageSize })
          : updater;
      setPageIndex(nextState.pageIndex);
      setPageSize(nextState.pageSize);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const tableRef = useRef(tableHook);
  tableRef.current = tableHook;
  const table = tableRef.current;

  const totalFilteredCount = filteredData.length;
  const totalPages = Math.ceil(totalFilteredCount / pageSize);
  const startItem = totalFilteredCount === 0 ? 0 : pageIndex * pageSize + 1;
  const endItem = Math.min((pageIndex + 1) * pageSize, totalFilteredCount);

  return (
    <div className="space-y-4">
      {/* Table Toolbar: Filters, Search, and Action Button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative max-w-sm min-w-[200px] flex-1">
            <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              placeholder="Search issues by title or key..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPageIndex(0);
              }}
              className="pr-8 pl-9"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2"
              >
                <XIcon className="size-4" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(val) => {
              setStatusFilter(val);
              setPageIndex(0);
            }}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="backlog">Backlog</SelectItem>
              <SelectItem value="todo">Todo</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="done">Done</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          {/* Priority Filter */}
          <Select
            value={priorityFilter}
            onValueChange={(val) => {
              setPriorityFilter(val);
              setPageIndex(0);
            }}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="no_priority">No priority</SelectItem>
            </SelectContent>
          </Select>

          {/* Assignee Filter */}
          <Select
            value={assigneeFilter}
            onValueChange={(val) => {
              setAssigneeFilter(val);
              setPageIndex(0);
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assignees</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {members.map((member) => (
                <SelectItem key={member.userId} value={member.userId}>
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground hover:text-foreground text-xs"
            >
              <FilterXIcon className="mr-1.5 size-3.5" />
              Reset filters
            </Button>
          )}
        </div>

        {/* Create Issue Trigger */}
        <CreateIssueDialog
          projectId={projectId}
          workspaceId={workspaceId}
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
        />
      </div>

      {/* Main Table Container */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-950">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-muted-foreground border-b border-slate-200 bg-slate-50 text-xs font-semibold tracking-wider uppercase dark:border-slate-800 dark:bg-slate-900/50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-4 py-3">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td className="px-4 py-3.5">
                      <Skeleton className="h-4 w-14" />
                    </td>
                    <td className="px-4 py-3.5">
                      <Skeleton className="h-4 w-48" />
                    </td>
                    <td className="px-4 py-3.5">
                      <Skeleton className="h-5 w-20 rounded-md" />
                    </td>
                    <td className="px-4 py-3.5">
                      <Skeleton className="h-5 w-20 rounded-md" />
                    </td>
                    <td className="px-4 py-3.5">
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </td>
                    <td className="px-4 py-3.5">
                      <Skeleton className="h-4 w-16" />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Skeleton className="ml-auto h-7 w-7 rounded-md" />
                    </td>
                  </tr>
                ))
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="text-muted-foreground py-12 text-center"
                  >
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="rounded-full bg-slate-100 p-3 dark:bg-slate-800">
                        <CheckCircleIcon className="text-muted-foreground size-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-foreground text-sm font-semibold">
                          {hasActiveFilters
                            ? "No matching issues found"
                            : "No issues yet"}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {hasActiveFilters
                            ? "Try refining or resetting your applied filters."
                            : "Get started by creating your first issue in this project."}
                        </p>
                      </div>
                      {!hasActiveFilters && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsCreateOpen(true)}
                          className="mt-1"
                        >
                          <PlusIcon className="mr-1.5 size-4" />
                          Create Issue
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-900/50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer & Pagination */}
        <div className="text-muted-foreground flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-xs sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span>
              Showing {startItem} to {endItem} of {totalFilteredCount} issues
            </span>
            <div className="flex items-center gap-1 pl-4">
              <span>Rows per page:</span>
              <Select
                value={String(pageSize)}
                onValueChange={(val) => {
                  setPageSize(Number(val));
                  setPageIndex(0);
                }}
              >
                <SelectTrigger className="h-7 w-[68px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {totalPages > 1 && (
            <Pagination className="mx-0 w-auto justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (table.getCanPreviousPage()) {
                        table.previousPage();
                      }
                    }}
                    className={
                      !table.getCanPreviousPage()
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      href="#"
                      isActive={pageIndex === i}
                      onClick={(e) => {
                        e.preventDefault();
                        table.setPageIndex(i);
                      }}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (table.getCanNextPage()) {
                        table.nextPage();
                      }
                    }}
                    className={
                      !table.getCanNextPage()
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      </div>

      {/* Edit Issue Dialog */}
      {selectedIssueForEdit && (
        <EditIssueDialog
          issue={selectedIssueForEdit}
          workspaceId={workspaceId}
          open={Boolean(selectedIssueForEdit)}
          onOpenChange={(open) => {
            if (!open) setSelectedIssueForEdit(null);
          }}
        />
      )}

      {/* Delete Issue Confirmation Dialog */}
      <DeleteIssueDialog
        issue={selectedIssueForDelete}
        open={Boolean(selectedIssueForDelete)}
        onOpenChange={(open) => {
          if (!open) setSelectedIssueForDelete(null);
        }}
      />

      {/* Issue Detail Dialog */}
      <IssueDetailDialog
        issue={selectedIssueForDetail}
        open={Boolean(selectedIssueForDetail)}
        onOpenChange={(open) => {
          if (!open) setSelectedIssueForDetail(null);
        }}
        onEdit={(issue) => {
          setSelectedIssueForEdit(issue);
        }}
        onDelete={(issue) => {
          setSelectedIssueForDelete(issue);
        }}
      />
    </div>
  );
}
