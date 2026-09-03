import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import {
  getApiKey,
  getAuthUser,
  getUserApiKey,
  setApiKey,
} from "../lib/auth";

export default function AuthLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function bootstrapApiKey() {
      try {
        if (getApiKey()) return;

        const user = await getAuthUser();
        if (!user?.id) return;

        const result = await getUserApiKey(user.id);
        const key = result?.data?.key;

        if (key) setApiKey(key);
      } catch (error) {
        console.error("API key bootstrap failed:", error);
      } finally {
        if (mounted) setBootstrapping(false);
      }
    }

    bootstrapApiKey();

    return () => {
      mounted = false;
    };
  }, []);

  if (bootstrapping) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div
          className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary"
          aria-label="Loading"
        />
      </div>
    );
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <aside className="relative hidden h-full w-[17.5rem] shrink-0 border-r border-border bg-card/95 md:block">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-primary/30 via-accent/15 to-transparent"
        />
        <Sidebar />
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-foreground/40 backdrop-blur-[2px]"
            onClick={() => setSidebarOpen(false)}
          />

          <aside className="relative h-full w-[17.5rem] max-w-[88vw] border-r border-border bg-card shadow-2xl">
            <Sidebar onNavigate={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden dm-shell-mesh">
          <div className="relative mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}