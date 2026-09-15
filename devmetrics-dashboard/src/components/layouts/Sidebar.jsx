import { useEffect, useState } from "react";
import {
  Activity,
  FlaskConical,
  FolderKanban,
  GitCompareArrows,
  KeyRound,
  LogOut,
  Terminal,
  UserRound,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "../../lib/utils";
import { getAuthUser, signOut } from "../../lib/auth";

const NAV = [
  { href: "/", label: "Tests", icon: FlaskConical },
  { href: "/sessions", label: "Runs", icon: Activity },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/compare", label: "Compare", icon: GitCompareArrows },
  { href: "/api-key", label: "API keys", icon: KeyRound },
];

function isActive(pathname, href) {
  if (href === "/") {
    return pathname === "/" || pathname.startsWith("/tests");
  }
  if (href === "/sessions") {
    return pathname.startsWith("/sessions");
  }
  if (href === "/projects") {
    return pathname.startsWith("/projects");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Sidebar({ mobile = false, onNavigate }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const [expanded, setExpanded] = useState(mobile);
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    getAuthUser()
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (mobile) {
      setExpanded(true);
    }
  }, [mobile]);

  const handleSignOut = async () => {
    setMenuOpen(false);

    try {
      await signOut();
    } catch {
      // local sign-out
    }

    navigate("/login");
    onNavigate?.();
  };

  const initials = user?.email?.slice(0, 2).toUpperCase() || "DM";

  return (
    <nav
      aria-label="Primary"
      onMouseEnter={() => !mobile && setExpanded(true)}
      onMouseLeave={() => !mobile && setExpanded(false)}
      onFocus={() => !mobile && setExpanded(true)}
      onBlur={(e) => {
        if (!mobile && !e.currentTarget.contains(e.relatedTarget)) {
          setExpanded(false);
        }
      }}
      className={cn(
        "absolute inset-y-0 left-0 z-50 flex flex-col",
        "border-r border-border bg-card",
        "transition-[width] duration-200 ease-out",
        expanded ? "w-64" : "w-[4.5rem]",
        mobile ? "static h-full w-full" : "h-full"
      )}
    >
      <div
        className={cn(
          "flex h-16 shrink-0 items-center",
          expanded ? "px-4" : "justify-center px-2"
        )}
      >
        <Link
          to="/"
          onClick={onNavigate}
          aria-label="DevMetrics"
          className={cn(
            "flex items-center rounded-lg",
            expanded ? "gap-3 px-1.5" : "justify-center"
          )}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Terminal size={18} strokeWidth={2.1} />
          </span>

          <span
            className={cn(
              "whitespace-nowrap font-mono text-sm font-semibold tracking-tight text-foreground",
              expanded ? "opacity-100" : "pointer-events-none w-0 opacity-0"
            )}
          >
            Dev<span className="text-primary">Metrics</span>
          </span>
        </Link>
      </div>

      <div className="flex flex-1 flex-col justify-center overflow-y-auto px-2.5">
        <span
          className={cn(
            "mb-3 font-mono text-micro uppercase tracking-[0.16em] text-muted-foreground/70",
            expanded ? "px-2.5 opacity-100" : "pointer-events-none h-0 opacity-0"
          )}
        >
          Workspace
        </span>

        <ul className="space-y-1.5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);

            return (
              <li key={href} className="group relative">
                <Link
                  to={href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex h-12 items-center rounded-lg",
                    "transition-colors duration-150",
                    expanded ? "px-2.5" : "justify-center",
                    active
                      ? "bg-primary/10 text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-2.5 bottom-2.5 w-0.5 rounded-r-full bg-primary" />
                  )}

                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
                      active
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground group-hover:text-foreground"
                    )}
                  >
                    <Icon size={18} strokeWidth={active ? 2.1 : 1.7} />
                  </span>

                  <span
                    className={cn(
                      "ml-3 overflow-hidden whitespace-nowrap text-[13px]",
                      active ? "font-semibold" : "font-medium",
                      expanded ? "opacity-100" : "pointer-events-none w-0 opacity-0"
                    )}
                  >
                    {label}
                  </span>
                </Link>

                {!expanded && (
                  <span
                    className="
                      pointer-events-none absolute left-full top-1/2
                      z-[60] ml-2 -translate-y-1/2
                      whitespace-nowrap rounded-md border border-border
                      bg-popover px-2.5 py-1.5
                      font-mono text-[10px]
                      text-popover-foreground shadow-md
                      opacity-0 transition-opacity
                      group-hover:opacity-100 group-focus-within:opacity-100
                    "
                  >
                    {label}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="shrink-0 p-2.5">
        <div className="relative border-t border-border pt-3">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            className={cn(
              "group flex h-12 w-full items-center rounded-lg",
              "text-muted-foreground transition-colors",
              "hover:bg-muted hover:text-foreground",
              expanded ? "px-2.5" : "justify-center"
            )}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-[10px] font-semibold text-foreground">
              {initials}
            </span>

            <span
              className={cn(
                "ml-3 min-w-0 flex-1 overflow-hidden text-left",
                expanded ? "opacity-100" : "pointer-events-none w-0 opacity-0"
              )}
            >
              <span className="block truncate text-xs font-medium text-foreground">
                {user?.email || "Account"}
              </span>
              <span className="block text-[10px] text-muted-foreground">Account</span>
            </span>

            <UserRound
              size={15}
              className={cn(
                "shrink-0",
                expanded ? "opacity-100" : "pointer-events-none w-0 opacity-0"
              )}
            />
          </button>

          {menuOpen && (
            <>
              <button
                type="button"
                aria-label="Close account menu"
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
              />

              <div
                role="menu"
                className="
                  absolute bottom-16 left-0 z-[70] w-56
                  overflow-hidden rounded-lg
                  border border-border bg-popover shadow-xl
                  md:left-full md:ml-2
                "
              >
                {user?.email && (
                  <div className="border-b border-border px-3 py-3">
                    <p className="truncate text-xs font-medium text-foreground">{user.email}</p>
                  </div>
                )}

                <Link
                  to="/account"
                  onClick={() => {
                    setMenuOpen(false);
                    onNavigate?.();
                  }}
                  role="menuitem"
                  className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
                >
                  <UserRound size={15} className="text-muted-foreground" />
                  Account settings
                </Link>

                <button
                  type="button"
                  onClick={handleSignOut}
                  role="menuitem"
                  className="flex w-full items-center gap-2.5 border-t border-border px-3 py-2.5 text-sm text-destructive-strong transition-colors hover:bg-destructive/10"
                >
                  <LogOut size={15} />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}