import {
  CalendarClock,
  ChevronRight,
  FileCheck2,
  Play,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import Badge from "./ui/Badge";
import { getRunStatusVariant } from "../lib/runs";
import { formatRelativeTime } from "../lib/formatters";
import { cn, toNumber } from "../lib/utils";

function getRequestCount(test) {
  if (test.request_count != null) {
    return toNumber(test.request_count);
  }

  if (Array.isArray(test.requests)) {
    return test.requests.length;
  }

  return 0;
}

function getLastRun(test) {
  const nested = test.last_run || test.lastRun;

  if (nested) {
    return {
      status: nested.status ?? nested.run_status ?? null,
      startedAt: nested.started_at ?? nested.startedAt ?? null,
    };
  }

  return {
    status: test.last_run_status ?? null,
    startedAt: test.last_run_at ?? null,
  };
}

function formatStatus(status) {
  if (!status) return "Never run";

  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function TestRow({ test }) {
  const navigate = useNavigate();

  const requestCount = getRequestCount(test);
  const { status, startedAt } = getLastRun(test);
  const description = test.description?.trim();

  function open() {
    navigate(`/tests/${test.id}`);
  }

  return (
    <li
      role="row"
      aria-label={`${test.name || "Untitled test"}, ${requestCount} requests`}
      tabIndex={0}
      onClick={open}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open();
        }
      }}
      className={cn(
        "group cursor-pointer border-b border-border/80 px-4 py-4",
        "transition-colors duration-normal ease-standard",
        "last:border-b-0 hover:bg-surface-1/80",
        "md:grid md:grid-cols-[minmax(240px,1fr)_96px_112px_96px_20px]",
        "md:items-center md:gap-5 md:px-6"
      )}
    >
      {/* Test identity */}
      <div
        role="gridcell"
        className="flex min-w-0 items-start justify-between gap-4 md:contents"
      >
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <FileCheck2
              size={15}
              className="shrink-0 text-muted-foreground"
              aria-hidden="true"
            />

            <p className="truncate text-sm font-medium text-foreground">
              {test.name || "Untitled test"}
            </p>
          </div>

          <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
            {description || "No description"}
          </p>

          {/* Mobile summary */}
          <div className="mt-2 flex flex-wrap items-center gap-2 md:hidden">
            <span className="font-data text-micro text-muted-foreground">
              {requestCount} request{requestCount === 1 ? "" : "s"}
            </span>

            <span className="text-muted-foreground/40">·</span>

            {status ? (
              <Badge variant={getRunStatusVariant(status)} size="xs">
                {formatStatus(status)}
              </Badge>
            ) : (
              <span className="text-micro text-muted-foreground">
                Never run
              </span>
            )}

            {startedAt && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <span className="font-data text-micro text-muted-foreground">
                  {formatRelativeTime(startedAt)}
                </span>
              </>
            )}
          </div>
        </div>

        <ChevronRight
          size={16}
          className="mt-0.5 shrink-0 text-muted-foreground/50 md:hidden"
          aria-hidden="true"
        />
      </div>

      {/* Request count */}
      <span
        role="gridcell"
        className="hidden justify-self-end font-data text-sm text-foreground md:block"
      >
        {requestCount}
      </span>

      {/* Last run */}
      <span
        role="gridcell"
        className="hidden justify-self-end md:block"
      >
        {status ? (
          <Badge variant={getRunStatusVariant(status)} size="xs">
            <Play size={10} aria-hidden="true" />
            {formatStatus(status)}
          </Badge>
        ) : (
          <span className="font-data text-micro text-muted-foreground">
            Never run
          </span>
        )}
      </span>

      {/* Last run time */}
      <span
        role="gridcell"
        className="hidden items-center justify-end gap-1.5 font-data text-micro text-muted-foreground md:flex"
      >
        {startedAt ? (
          <>
            <CalendarClock size={12} aria-hidden="true" />
            {formatRelativeTime(startedAt)}
          </>
        ) : (
          "—"
        )}
      </span>

      {/* Open */}
      <ChevronRight
        size={16}
        className="hidden text-muted-foreground/0 transition-colors group-hover:text-muted-foreground md:block"
        aria-hidden="true"
      />
    </li>
  );
}