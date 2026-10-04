"use client";

import { SlidersHorizontal, Search } from "lucide-react";
import {
  COMPLAINT_PRIORITIES,
  COMPLAINT_STATUSES,
  SERVICE_AREAS,
  type Complaint,
} from "@/types/complaint";
import { AREA_LABELS, priorityStyle, statusStyle } from "@/config/status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ComplaintFilters as ComplaintFilterState } from "@/hooks/use-complaint-filters";

/**
 * The filter bar shown above complaint and issue lists.
 *
 * Presentational only — the parent owns the state via `useComplaintFilters`, so
 * the bar and the list below it can never disagree about what is being shown.
 * The counts next to each status come from the full list.
 */
export function ComplaintFilterBar({
  complaints,
  filters,
  onChange,
  visibleCount,
  isFiltered,
  onReset,
}: {
  complaints: Complaint[];
  filters: ComplaintFilterState;
  onChange: (filters: ComplaintFilterState) => void;
  visibleCount: number;
  isFiltered: boolean;
  onReset: () => void;
}) {
  const patch = (partial: Partial<ComplaintFilterState>) =>
    onChange({ ...filters, ...partial });

  const countFor = (status: (typeof COMPLAINT_STATUSES)[number]) =>
    complaints.filter((complaint) => complaint.status === status).length;

  return (
    <div className="flex flex-col gap-3">
      <Tabs
        value={filters.status}
        onValueChange={(value) =>
          patch({ status: value as ComplaintFilterState["status"] })
        }
      >
        <TabsList className="scrollbar-subtle w-full justify-start overflow-x-auto">
          <TabsTrigger value="all" className="gap-1.5">
            All
            <span className="text-xs text-muted-foreground">
              {complaints.length}
            </span>
          </TabsTrigger>
          {COMPLAINT_STATUSES.map((status) => (
            <TabsTrigger key={status} value={status} className="gap-1.5">
              {statusStyle(status).label}
              <span className="text-xs text-muted-foreground">
                {countFor(status)}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <Label
            htmlFor={`filter-search-${visibleCount}`}
            className="text-xs text-muted-foreground"
          >
            Search
          </Label>
          <div className="relative">
            <Search
              className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id={`filter-search-${visibleCount}`}
              placeholder="Title, reference or location…"
              value={filters.search}
              onChange={(event) => patch({ search: event.target.value })}
              className="pl-7 w-56"
              size="sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Label
            htmlFor="filter-priority"
            className="text-xs text-muted-foreground"
          >
            Priority
          </Label>
          <Select
            value={filters.priority}
            onValueChange={(value) =>
              patch({ priority: value as ComplaintFilterState["priority"] })
            }
          >
            <SelectTrigger id="filter-priority" size="sm" className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any priority</SelectItem>
              {COMPLAINT_PRIORITIES.map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {priorityStyle(priority).label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="filter-area" className="text-xs text-muted-foreground">
            Area
          </Label>
          <Select
            value={filters.area}
            onValueChange={(value) =>
              patch({ area: value as ComplaintFilterState["area"] })
            }
          >
            <SelectTrigger id="filter-area" size="sm" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All areas</SelectItem>
              {SERVICE_AREAS.map((area) => (
                <SelectItem key={area} value={area}>
                  {AREA_LABELS[area]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {visibleCount} shown
          </p>
          {isFiltered ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="text-muted-foreground"
            >
              <SlidersHorizontal aria-hidden="true" />
              Clear
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
