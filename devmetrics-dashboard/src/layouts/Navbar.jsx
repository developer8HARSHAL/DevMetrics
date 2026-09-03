import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, Sun, Moon, LogOut, ChevronRight, KeyRound } from "lucide-react";
import { cn } from "../lib/utils";
import { getAuthUser, signOut } from "../lib/auth";

const PAGE_TITLES = {
  "/": ["Workspace", "Runs"],
  "/compare": ["Analysis", "Compare runs"],
  "/analytics": ["Analysis", "Analytics"],
  "/api-key": ["Developer", "API keys"],
};

function getPageMeta(pathname) {
  if (pathname.startsWith("/sessions/")) return ["Workspace", "Run details"];
  return PAGE_TITLES[pathname] || ["DevMetrics", "Dashboard"];
}

export default function Navbar({ onMenuClick }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const [section, title] = getPageMeta(pathname);
  const initials = user?.email?.slice(0, 2).toUpperCase() || "DM";

  useEffect(() => {
    const stored = localStorage.getItem("dm-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const dark = stored ? stored === "dark" : prefersDark;
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  useEffect(() => {
    getAuthUser().then(setUser).catch(() => setUser(null));
  }, [pathname]);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("dm-theme", next ? "dark" : "light");
  };

  const handleSignOut = async () => {
    setMenuOpen(false);
    try { await signOut(); } catch { /* local sign-out */ }
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b border-border/80 bg-card/90 px-4 shadow-sm backdrop-blur-xl md:px-6">
      <button
        onClick={onMenuClick}
        aria-label="Open navigation"
        className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted md:hidden"
      >
        <Menu size={20} />
      </button>

      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="hidden rounded-md bg-muted/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground sm:inline">
          {section}
        </span>
        <ChevronRight size={14} className="hidden shrink-0 text-muted-foreground/50 sm:inline" />
        <h1 className="truncate text-sm font-semibold tracking-tight text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={toggleTheme}
          aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-haspopup="true"
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full",
              "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground",
              "text-micro font-semibold shadow-sm ring-2 ring-background",
              "transition-transform hover:scale-[1.03] active:scale-[0.98]"
            )}
          >
            {initials}
          </button>

          {menuOpen && (
            <>
              <button type="button" aria-label="Close menu" className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
                {user?.email && (
                  <div className="border-b border-border bg-muted/30 px-4 py-3">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Signed in as</p>
                    <p className="mt-0.5 truncate text-sm font-medium">{user.email}</p>
                  </div>
                )}
                <Link
                  to="/api-key"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
                >
                  <KeyRound size={15} className="text-muted-foreground" />
                  API keys
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2.5 border-t border-border px-4 py-2.5 text-sm text-destructive-strong transition-colors hover:bg-destructive/10"
                >
                  <LogOut size={15} />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
