import { ChevronLeft, ChevronRight } from "lucide-react";
import Button from "./Button";
import { cn } from "../../lib/utils";

/**
 * Pagination
 * -----------------------------------------------------------------------
 * Design-brief §4 new primitive — "page N of M, prev/next, used anywhere
 * a list is server-paginated." Built data-source-agnostic: caller passes
 * page/pageSize/total and an onPageChange handler, so it works identically
 * whether the slicing happens client-side (today, e.g. Runs — the backend
 * has no limit/offset yet) or server-side later (swap the data source,
 * keep this component).
 */
export default function Pagination({ page, pageSize, total, onPageChange, className }) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  if (total <= pageSize) return null;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 border-t border-border px-4 py-3 md:px-6",
        className
      )}
    >
      <span className="font-data text-micro text-muted-foreground">
        Showing {start}–{end} of {total}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft size={16} />
        </Button>
        <span className="font-data text-micro text-muted-foreground">
          {page} / {pageCount}
        </span>
        <Button
          variant="outline"
          size="icon"
          aria-label="Next page"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}