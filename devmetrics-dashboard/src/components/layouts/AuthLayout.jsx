import { useCallback, useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

import {
  getApiKey,
  getAuthUser,
  setApiKey,
} from "../../lib/auth";

import { getUserApiKey } from "../../lib/apiKeys";

import {
  ErrorState,
  Skeleton,
} from "../ui";

export default function AuthLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [bootstrapError, setBootstrapError] = useState("");

  const bootstrapApiKey = useCallback(async () => {
    setBootstrapping(true);
    setBootstrapError("");

    try {
      if (getApiKey()) {
        return;
      }

      const user = await getAuthUser();

      if (!user?.id) {
        throw new Error(
          "Unable to verify your account session."
        );
      }

      const result = await getUserApiKey(user.id);
      const key = result?.data?.key;

      if (!key) {
        throw new Error(
          "Your account API key could not be provisioned."
        );
      }

      setApiKey(key);
    } catch (error) {
      console.error(
        "API key bootstrap failed:",
        error
      );

      setBootstrapError(
        error?.message ||
          "We could not finish setting up your account."
      );
    } finally {
      setBootstrapping(false);
    }
  }, []);

  useEffect(() => {
    bootstrapApiKey();
  }, [bootstrapApiKey]);

  if (bootstrapping) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background px-4">
        <div className="w-full max-w-xs text-center">
          <Skeleton className="mx-auto h-10 w-10 rounded-md" />
          <p className="mt-4 text-sm text-muted-foreground">
            Setting up your account
          </p>
        </div>
      </div>
    );
  }

  if (bootstrapError) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background px-4">
        <div className="w-full max-w-md">
          <ErrorState
            title="Account setup failed"
            description={bootstrapError}
            onRetry={bootstrapApiKey}
            retryLabel="Try again"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <aside className="relative hidden h-full w-16 shrink-0 overflow-visible border-r border-border bg-card md:block">
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

          <aside className="relative h-full w-60 max-w-[88vw] border-r border-border bg-card shadow-2xl">
            <Sidebar
              mobile
              onNavigate={() => setSidebarOpen(false)}
            />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-background">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6 md:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}