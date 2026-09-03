import { useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Activity, BarChart3, GitCompareArrows, KeyRound, Terminal } from "lucide-react";
import { cn } from "../lib/utils";

const NAV = [
  { section: "Workspace", items: [
    { href: "/", label: "Runs", icon: Activity, shortcut: "r" },
    { href: "/compare", label: "Compare", icon: GitCompareArrows, shortcut: "c" },
  ]},
  { section: "Analysis", items: [
    { href: "/analytics", label: "Analytics", icon: BarChart3, shortcut: "a" },
  ]},
  { section: "Developer", items: [
    { href: "/api-key", label: "API keys", icon: KeyRound, shortcut: "k" },
  ]},
];

const ALL_ITEMS = NAV.flatMap((g) => g.items);

function isActive(pathname, href) {
  if (href === "/") return pathname === "/" || pathname.startsWith("/sessions/");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Sidebar({ onNavigate }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const primedRef = useRef(false);
  const timerRef = useRef(null);

  useEffect(() => {
    function onKeyDown(e) {
      const el = e.target;
      if (el?.tagName === "INPUT" || el?.tagName === "TEXTAREA" || el?.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key.toLowerCase() === "g") {
        primedRef.current = true;
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => { primedRef.current = false; }, 800);
        return;
      }

      if (!primedRef.current) return;
      const item = ALL_ITEMS.find((i) => i.shortcut === e.key.toLowerCase());
      if (item) {
        e.preventDefault();
        navigate(item.href);
        onNavigate?.();
      }
      primedRef.current = false;
      clearTimeout(timerRef.current);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      clearTimeout(timerRef.current);
    };
  }, [navigate, onNavigate]);

  return (
    <nav aria-label="Primary" className="flex h-full flex-col px-3 py-5">
      <Link to="/" onClick={onNavigate} className="group mb-8 flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-muted/50">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/75 text-primary-foreground shadow-md shadow-primary/20">
          <Terminal size={18} strokeWidth={2.25} />
        </span>
        <div className="min-w-0">
          <p className="font-mono text-sm font-semibold tracking-tight text-foreground">
            dev<span className="text-primary">/metrics</span>
          </p>
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
            Dev observability
          </p>
        </div>
      </Link>

      <div className="flex-1 space-y-7 overflow-y-auto">
        {NAV.map(({ section, items }) => (
          <section key={section}>
            <p className="mb-2.5 px-2.5 font-mono text-[9px] font-medium uppercase tracking-[0.16em] text-muted-foreground/80">
              {section}
            </p>
            <ul className="space-y-1">
              {items.map(({ href, label, icon: Icon, shortcut }) => {
                const active = isActive(pathname, href);
                return (
                  <li key={href}>
                    <Link
                      to={href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group relative flex min-h-10 items-center gap-3 rounded-xl px-3 py-2.5",
                        "text-[13px] font-medium transition-all duration-normal ease-standard",
                        active
                          ? "bg-primary/14 text-foreground shadow-sm ring-1 ring-primary/20"
                          : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                      )}
                    >
                      {active && (
                        <span className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-primary shadow-[0_0_8px_color-mix(in_srgb,var(--color-primary)_50%,transparent)]" />
                      )}
                      <span className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors",
                        active ? "bg-primary/20 text-primary" : "bg-muted/50 text-muted-foreground group-hover:bg-muted"
                      )}>
                        <Icon size={15} strokeWidth={1.85} />
                      </span>
                      <span className="flex-1 truncate">{label}</span>
                      <kbd className="hidden rounded border border-border bg-background/80 px-1 py-0.5 font-mono text-[9px] text-muted-foreground group-hover:inline">
                        g{shortcut}
                      </kbd>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <div className="mt-5 rounded-xl border border-border/80 bg-muted/25 px-3 py-3">
        <p className="font-mono text-[9px] leading-relaxed text-muted-foreground">
          Press{" "}
          <kbd className="rounded border border-border bg-background px-1 py-0.5 text-foreground">g</kbd>
          {" then a letter to jump — e.g. "}
          <kbd className="rounded border border-border bg-background px-1 py-0.5 text-foreground">g</kbd>
          <kbd className="rounded border border-border bg-background px-1 py-0.5 text-foreground">r</kbd>
          {" for Runs"}
        </p>
      </div>
    </nav>
  );
}
