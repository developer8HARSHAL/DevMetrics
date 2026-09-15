import { useState } from "react";
import { ChevronDown, Save, Trash2 } from "lucide-react";
import Badge from "./ui/Badge";
import Button from "./ui/Button";
import Card, { CardContent } from "./ui/Card";
import { Input, Select, Textarea } from "./ui/Form";
import { cn } from "../lib/utils";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"];

export default function RequestRow({ request, index, onUpdate, onSave, onDelete }) {
  const [expanded, setExpanded] = useState(!request.url);

  return (
    <Card>
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-muted/40"
      >
        <Badge variant="outline" size="xs">#{index + 1}</Badge>

        <span className="rounded-md bg-muted px-2 py-1 font-data text-xs font-semibold uppercase tracking-wide text-foreground">
          {request.method}
        </span>

        <span className="min-w-0 flex-1 truncate font-data text-sm text-muted-foreground">
          {request.url || "No URL set"}
        </span>

        {(request.saving || request.deleting) && (
          <span
            aria-hidden="true"
            className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-border border-t-primary"
          />
        )}

        <ChevronDown
          size={16}
          className={cn("shrink-0 text-muted-foreground transition-transform", expanded && "rotate-180")}
        />
      </button>

      {expanded && (
        <CardContent className="space-y-5 border-t border-border pt-5">
          <div className="grid gap-4 md:grid-cols-[140px_1fr]">
            <label className="grid gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Method</span>
              <Select value={request.method} onChange={(e) => onUpdate(index, "method", e.target.value)}>
                {METHODS.map((method) => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </Select>
            </label>

            <label className="grid gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">URL</span>
              <Input
                value={request.url}
                onChange={(e) => onUpdate(index, "url", e.target.value)}
                className="font-data"
                placeholder="https://api.example.com/health"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Headers</span>
              <Textarea
                value={request.headers}
                onChange={(e) => onUpdate(index, "headers", e.target.value)}
                className="min-h-32 font-mono text-xs"
                placeholder={`Authorization: Bearer ...\nContent-Type: application/json`}
              />
              <span className="text-[11px] text-muted-foreground">One header per line: <code>Name: Value</code></span>
            </label>

            <label className="grid gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">JSON body</span>
              <Textarea
                value={request.body}
                onChange={(e) => onUpdate(index, "body", e.target.value)}
                className="min-h-32 font-mono text-xs"
                placeholder={`{\n  "example": true\n}`}
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Timeout (ms)</span>
              <Input
                type="number"
                min="1"
                value={request.timeoutMs}
                onChange={(e) => onUpdate(index, "timeoutMs", e.target.value)}
              />
            </label>
            <label className="grid gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Expected status</span>
              <Input
                type="number"
                min="100"
                max="599"
                value={request.expectedStatus}
                onChange={(e) => onUpdate(index, "expectedStatus", e.target.value)}
                placeholder="200"
              />
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" disabled={request.deleting} onClick={() => onDelete(index)}>
              <Trash2 size={15} />
              {request.deleting ? "Deleting..." : "Delete"}
            </Button>
            <Button variant="outline" disabled={request.saving} onClick={() => onSave(index)}>
              <Save size={15} />
              {request.saving ? "Saving..." : "Save request"}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
