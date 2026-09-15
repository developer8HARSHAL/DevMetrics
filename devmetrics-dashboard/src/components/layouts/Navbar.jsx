import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ChevronRight,
  FlaskConical,
  KeyRound,
  LogOut,
  Menu,
  Moon,
  Search,
  Sun,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "../../lib/utils";
import { fetchRuns } from "../../lib/runs";
import { fetchTests } from "../../lib/tests";
import { getAuthUser, signOut } from "../../lib/auth";

const PAGE_TITLES = {
  "/": ["Tests", "Tests"],
  "/tests": ["Tests", "Tests"],
  "/sessions": ["Workspace", "Runs"],
  "/compare": ["Analysis", "Compare runs"],
  "/api-key": ["Developer", "API keys"],
};


function getPageMeta(pathname) {
  if (pathname.startsWith("/sessions/")) {
    return ["Workspace", "Run details"];
  }

  if (pathname.startsWith("/tests/")) {
    return ["Tests", "Test details"];
  }

  return PAGE_TITLES[pathname] || ["DevMetrics", "Dashboard"];
}

function normalizeArray(response) {
  const data = response?.data;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  return [];
}

export default function Navbar({ onMenuClick }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const [isDark, setIsDark] = useState(false);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const [runs, setRuns] = useState([]);
  const [tests, setTests] = useState([]);

  const [section, title] = getPageMeta(pathname);

  useEffect(() => {
    getAuthUser()
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("dm-theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    const dark = stored ? stored === "dark" : prefersDark;

    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadSearchData() {
      setSearchLoading(true);

      try {
        const [runsResponse, testsResponse] = await Promise.all([
          fetchRuns(),
          fetchTests(),
        ]);

        if (!mounted) return;

        setRuns(normalizeArray(runsResponse));
        setTests(normalizeArray(testsResponse));
      } catch (error) {
        if (!mounted) return;

        setRuns([]);
        setTests([]);

        console.error("Search data failed to load:", error);
      } finally {
        if (mounted) {
          setSearchLoading(false);
        }
      }
    }

    loadSearchData();

    return () => {
      mounted = false;
    };
  }, []);

  const toggleTheme = () => {
    const next = !isDark;

    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("dm-theme", next ? "dark" : "light");
  };

  const results = useMemo(() => {
    const value = query.trim().toLowerCase();

    if (!value) {
      return {
        runs: [],
        tests: [],
      };
    }

    const matchedRuns = runs
      .filter((run) => {
        const searchable = [
          run?.name,
          run?.hostname,
          run?.id,
          run?.highest_severity,
          run?.status,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchable.includes(value);
      })
      .slice(0, 5);

    const matchedTests = tests
      .filter((test) => {
        const searchable = [
          test?.name,
          test?.description,
          test?.id,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchable.includes(value);
      })
      .slice(0, 5);

    return {
      runs: matchedRuns,
      tests: matchedTests,
    };
  }, [query, runs, tests]);

  const hasResults =
    results.runs.length > 0 || results.tests.length > 0;

  const openResult = (type, item) => {
    setQuery("");
    setSearchOpen(false);

    if (type === "run" && item?.id) {
      navigate(`/sessions/${item.id}`);
      return;
    }

    if (type === "test" && item?.id) {
      navigate(`/tests/${item.id}`);
    }
  };

  const handleSignOut = async () => {
    setMenuOpen(false);

    try {
      await signOut();
    } catch {
    }

    navigate("/login");
  };

  return (
    <header
      className="
        sticky top-0 z-40 flex h-14 shrink-0
        items-center border-b border-border bg-card
      "
    >
      <div className="flex h-full min-w-0 w-full items-center gap-4 px-4 md:px-6">
        {/* Left */}
        <div className="flex min-w-0 shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open navigation"
            className="
              flex h-9 w-9 shrink-0 items-center justify-center
              rounded-lg text-muted-foreground
              transition-colors hover:bg-muted hover:text-foreground
              md:hidden
            "
          >
            <Menu size={19} />
          </button>

          <Link
            to="/"
            className="
              shrink-0 font-mono text-sm font-semibold
              tracking-tight text-foreground
            "
          >
            Dev<span className="text-primary">Metrics</span>
          </Link>

          <div className="hidden h-4 w-px bg-border sm:block" />

          <div className="hidden min-w-0 items-center gap-1.5 sm:flex">
            <span className="truncate text-xs text-muted-foreground">
              {section}
            </span>

            <ChevronRight
              size={13}
              className="shrink-0 text-muted-foreground/50"
            />

            <h1 className="truncate text-sm font-semibold text-foreground">
              {title}
            </h1>
          </div>
        </div>

        {/* Search */}
        <div className="relative mx-auto min-w-0 flex-1">
          <div className="relative mx-auto w-full max-w-lg">
            <Search
              size={15}
              className="
                pointer-events-none absolute left-3 top-1/2
                -translate-y-1/2 text-muted-foreground
              "
            />

            <input
              id="navbar-search"
              type="search"
              value={query}
              onFocus={() => setSearchOpen(true)}
              onChange={(event) => {
                setQuery(event.target.value);
                setSearchOpen(true);
              }}
              placeholder="Search runs and tests..."
              aria-label="Search runs and tests"
              className="
                h-9 w-full rounded-lg border border-border
                bg-background pl-9 pr-3 text-sm text-foreground
                outline-none placeholder:text-muted-foreground
                transition-colors
                focus:border-primary
                focus:ring-2 focus:ring-primary/15
              "
            />
            {searchOpen && query.trim() && (
              <>
                <button
                  type="button"
                  aria-label="Close search results"
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setSearchOpen(false)}
                />

                <div
                  className="
                    absolute left-0 right-0 top-11 z-50
                    overflow-hidden rounded-lg border
                    border-border bg-popover shadow-xl
                  "
                >
                  {searchLoading ? (
                    <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                      Searching...
                    </div>
                  ) : !hasResults ? (
                    <div className="px-4 py-6 text-center">
                      <p className="text-sm font-medium text-foreground">
                        No results found
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        Try another run or test name.
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto p-2">
                      {results.runs.length > 0 && (
                        <div>
                          <p className="px-2 py-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                            Runs
                          </p>

                          {results.runs.map((run) => (
                            <button
                              key={`run-${run.id}`}
                              type="button"
                              onClick={() => openResult("run", run)}
                              className="
                                flex w-full items-center gap-3
                                rounded-md px-2.5 py-2 text-left
                                transition-colors hover:bg-muted
                              "
                            >
                              <Activity
                                size={15}
                                className="shrink-0 text-primary"
                              />

                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-medium text-foreground">
                                  {run.name || "Unnamed run"}
                                </span>

                                <span className="block truncate font-mono text-[10px] text-muted-foreground">
                                  {run.hostname || run.id}
                                </span>
                              </span>
                            </button>
                          ))}
                        </div>
                      )}

                      {results.tests.length > 0 && (
                        <div
                          className={
                            results.runs.length > 0 ? "mt-2" : ""
                          }
                        >
                          <p className="px-2 py-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                            Tests
                          </p>

                          {results.tests.map((test) => (
                            <button
                              key={`test-${test.id}`}
                              type="button"
                              onClick={() => openResult("test", test)}
                              className="
                                flex w-full items-center gap-3
                                rounded-md px-2.5 py-2 text-left
                                transition-colors hover:bg-muted
                              "
                            >
                              <FlaskConical
                                size={15}
                                className="shrink-0 text-accent"
                              />

                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-medium text-foreground">
                                  {test.name || "Unnamed test"}
                                </span>

                                <span className="block truncate text-[10px] text-muted-foreground">
                                  {test.description || test.id}
                                </span>
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={
              isDark
                ? "Switch to light theme"
                : "Switch to dark theme"
            }
            className="
      flex h-9 w-9 items-center justify-center rounded-lg
      text-muted-foreground transition-colors
      hover:bg-muted hover:text-foreground
    "
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-label="Open profile menu"
              className="
        flex h-9 w-9 items-center justify-center
        rounded-lg bg-primary
        font-mono text-[10px] font-semibold
        text-primary-foreground
        transition-colors hover:bg-primary/85
      "
            >
              {user?.email?.slice(0, 2).toUpperCase() || "DM"}
            </button>

            {menuOpen && (
              <>
                <button
                  type="button"
                  aria-label="Close profile menu"
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                />

                <div
                  role="menu"
                  className="
            absolute right-0 z-50 mt-2 w-60 overflow-hidden
            rounded-lg border border-border bg-popover shadow-xl
          "
                >
                  {user?.email && (
                    <div className="border-b border-border px-3 py-3">
                      <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                        Signed in as
                      </p>

                      <p className="mt-1 truncate text-sm font-medium text-foreground">
                        {user.email}
                      </p>
                    </div>
                  )}

                  <Link
                    to="/api-key"
                    onClick={() => setMenuOpen(false)}
                    role="menuitem"
                    className="
              flex items-center gap-2.5 px-3 py-2.5
              text-sm text-foreground
              transition-colors hover:bg-muted
            "
                  >
                    <KeyRound
                      size={15}
                      className="text-muted-foreground"
                    />
                    API keys
                  </Link>

                  <button
                    type="button"
                    onClick={handleSignOut}
                    role="menuitem"
                    className="
              flex w-full items-center gap-2.5
              border-t border-border px-3 py-2.5
              text-sm text-destructive-strong
              transition-colors hover:bg-destructive/10
            "
                  >
                    <LogOut size={15} />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}