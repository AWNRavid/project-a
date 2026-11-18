"use client";

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
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  MoreVerticalIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import { useRef, useState } from "react";

import type { Column } from "@tanstack/react-table";

type SortDirection = "asc" | "desc" | false;

interface SortableHeaderProps<T> {
  column: Column<T, unknown>;
  children: React.ReactNode;
  /** Override sort direction display for server-side sorting */
  sortDirection?: SortDirection;
  /** Show column filter option in dropdown menu (default: false) */
  showColumnFilter?: boolean;
  /** Callback for server-side column filtering */
  onColumnFilter?: (value: string) => void;
  /** Controlled column filter value for server-side filtering */
  columnFilterValue?: string;
}

export const SortableHeader = <T,>({
  column,
  children,
  sortDirection,
  showColumnFilter = false,
  onColumnFilter,
  columnFilterValue,
}: SortableHeaderProps<T>) => {
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [filterValue, setFilterValue] = useState(
    (column.getFilterValue() as string) || "",
  );
  const inputRef = useRef<HTMLInputElement>(null);

  // Use sortDirection prop if provided for display, otherwise use TanStack Table's state
  const currentSort = sortDirection ?? column.getIsSorted();

  // Use controlled value if provided, otherwise use local state
  const currentFilterValue = columnFilterValue ?? filterValue;

  const handleSort = () => {
    if (currentSort === "asc") {
      column.toggleSorting(true); // desc
    } else if (currentSort === "desc") {
      column.clearSorting(); // no sort
    } else {
      column.toggleSorting(false); // asc
    }
  };

  const handleSortAsc = () => {
    column.toggleSorting(false);
  };

  const handleSortDesc = () => {
    column.toggleSorting(true);
  };

  const handleClearSort = () => {
    column.clearSorting();
  };

  const handleFilter = (value: string) => {
    if (onColumnFilter) {
      onColumnFilter(value);
    } else {
      setFilterValue(value);
      column.setFilterValue(value);
    }
  };

  const clearFilter = () => {
    if (onColumnFilter) {
      onColumnFilter("");
    } else {
      setFilterValue("");
      column.setFilterValue("");
    }
    setIsFilterVisible(false);
  };

  const getSortIcon = () => {
    if (currentSort === "asc")
      return <ArrowUpIcon className="text-primary ml-1 size-3.5" />;
    if (currentSort === "desc")
      return <ArrowDownIcon className="text-primary ml-1 size-3.5" />;
    return <ArrowUpDownIcon className="ml-1 size-3.5 opacity-30" />;
  };

  return (
    <div className="space-y-2">
      <div className="group flex items-center justify-between gap-1">
        <Button
          variant="ghost"
          onClick={handleSort}
          className="h-auto p-0 font-semibold hover:bg-transparent"
        >
          {children}
          {getSortIcon()}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-foreground h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
            >
              <MoreVerticalIcon className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={handleSortAsc}
              disabled={currentSort === "asc"}
            >
              <ArrowUpIcon className="mr-2 h-4 w-4" />
              Sort Ascending
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleSortDesc}
              disabled={currentSort === "desc"}
            >
              <ArrowDownIcon className="mr-2 h-4 w-4" />
              Sort Descending
            </DropdownMenuItem>
            {currentSort && (
              <DropdownMenuItem onClick={handleClearSort}>
                <ArrowUpDownIcon className="mr-2 h-4 w-4" />
                Clear Sort
              </DropdownMenuItem>
            )}
            {showColumnFilter && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    if (isFilterVisible) {
                      clearFilter();
                    } else {
                      setIsFilterVisible(true);
                      setTimeout(() => {
                        inputRef.current?.focus();
                      }, 200);
                    }
                  }}
                >
                  <SearchIcon className="mr-2 h-4 w-4" />
                  {isFilterVisible ? "Hide Filter" : "Show Filter"}
                </DropdownMenuItem>
                {currentFilterValue && (
                  <DropdownMenuItem onClick={clearFilter}>
                    <XIcon className="mr-2 h-4 w-4" />
                    Clear Filter
                  </DropdownMenuItem>
                )}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {isFilterVisible && showColumnFilter && (
        <Input
          ref={inputRef}
          placeholder={`Filter ${children}`}
          value={currentFilterValue}
          onChange={(e) => handleFilter(e.target.value)}
          className="h-8"
        />
      )}
    </div>
  );
};
