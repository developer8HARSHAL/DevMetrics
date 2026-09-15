import { Children, forwardRef, useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";

export function Label({ className, required, children, ...props }) {
  return (
    <label
      className={cn("text-sm font-medium text-foreground", className)}
      {...props}
    >
      {children}
      {required && <span className="ml-0.5 text-destructive-strong">*</span>}
    </label>
  );
}

export const Input = forwardRef(function Input({ className, error, ...props }, ref) {
  return (
    <input
      ref={ref}
      aria-invalid={error || undefined}
      className={cn("dm-input", error && "border-destructive focus:border-destructive", className)}
      {...props}
    />
  );
});

export const Textarea = forwardRef(function Textarea(
  { className, error, rows = 4, ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={error || undefined}
      className={cn(
        "dm-input font-mono text-sm resize-y",
        error && "border-destructive focus:border-destructive",
        className
      )}
      {...props}
    />
  );
});

// Native <select> popups can't be restyled — the browser owns that render
// once open. Same value/onChange contract as a native select, so call
// sites (<option> children, controlled value) don't need to change.
export const Select = forwardRef(function Select(
  { className, error, children, value, onChange, disabled, placeholder = "Select...", ...props },
  ref
) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const containerRef = useRef(null);

  const options = Children.toArray(children)
    .filter((child) => child.type === "option")
    .map((child) => ({
      value: child.props.value,
      label: child.props.children,
      disabled: child.props.disabled,
    }));

  const selectedIndex = options.findIndex((opt) => String(opt.value) === String(value));
  const selected = options[selectedIndex];

  useEffect(() => {
    function onOutsideClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  function commit(index) {
    const option = options[index];
    if (!option || option.disabled) return;
    onChange?.({ target: { value: option.value } });
    setOpen(false);
  }

  function handleKeyDown(e) {
    if (disabled) return;

    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        setOpen(true);
        setHighlighted(selectedIndex >= 0 ? selectedIndex : 0);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(options.length - 1, h + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(0, h - 1));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      commit(highlighted);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-invalid={error || undefined}
        onClick={() => {
          setOpen((o) => !o);
          setHighlighted(selectedIndex >= 0 ? selectedIndex : 0);
        }}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-sm text-foreground",
          "transition-colors duration-fast ease-standard hover:border-border-strong",
          "focus-visible:outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/15",
          "disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground",
          error && "border-destructive focus-visible:border-destructive",
          className
        )}
        {...props}
      >
        <span className={cn("truncate text-left", !selected && "text-muted-foreground")}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={15} className={cn("shrink-0 text-muted-foreground transition-transform duration-fast", open && "rotate-180")} />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1.5 max-h-60 w-full overflow-auto rounded-md border border-border bg-popover py-1 shadow-xl"
        >
          {options.map((option, index) => (
            <li
              key={option.value}
              role="option"
              aria-selected={index === selectedIndex}
              onMouseEnter={() => setHighlighted(index)}
              onClick={() => commit(index)}
              className={cn(
                "cursor-pointer px-3 py-2 text-sm text-foreground",
                index === highlighted && "bg-muted",
                index === selectedIndex && "font-medium"
              )}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});

export function InputGroup({ className, children }) {
  return (
    <div className={cn("flex items-stretch", className)}>{children}</div>
  );
}

export function InputGroupAddon({ children, className }) {
  return (
    <span
      className={cn(
        "flex items-center rounded-md border border-l-0 border-input",
        "bg-muted px-3 text-sm text-muted-foreground",
        "rounded-l-none",
        className
      )}
    >
      {children}
    </span>
  );
}

export function FormItemLayout({ label, description, required, children, className }) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", className)}>
      {label && (
        <div className="sm:w-1/3 sm:pt-2.5">
          <Label required={required}>{label}</Label>
          {description && (
            <p className="mt-1 text-body-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      <div className="sm:w-2/3">{children}</div>
    </div>
  );
}