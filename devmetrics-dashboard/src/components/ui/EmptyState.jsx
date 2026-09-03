import { cn } from "../../lib/utils";

/**
 * EmptyState
 * -----------------------------------------------------------------------
 * Layout & Responsive rule: centered, generous spacing, never a bare "No
 * data" string — always pairs a plain-language explanation with a concrete
 * next action so the empty state teaches rather than dead-ends the user.
 */
export default function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        "py-16 px-6 rounded-lg border border-dashed border-border",
        className
      )}
    >
      {Icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Icon size={22} strokeWidth={1.75} aria-hidden="true" />
        </div>
      )}
      <h3 className="text-heading-md text-foreground">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-body-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}