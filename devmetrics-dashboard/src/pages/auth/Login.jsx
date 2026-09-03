import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Activity, GitCompareArrows, BarChart3, Terminal } from "lucide-react";
import { supabase, getUserApiKey, setApiKey } from "../../lib/auth";
import Button from "../../components/ui/Button";

const FEATURES = [
  { icon: Activity, text: "Record local app runs in real time" },
  { icon: GitCompareArrows, text: "Compare before/after behavior" },
  { icon: BarChart3, text: "Analytics on requests and errors" },
];

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!supabase) { setError("Supabase is not configured."); return; }

    setError("");
    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword(form);
      if (authError) throw authError;
      const userId = data.user?.id;
      if (!userId) throw new Error("Unable to determine the signed-in user.");
      const result = await getUserApiKey(userId);
      const key = result?.data?.key;
      if (!key) throw new Error("No DevMetrics API key was found.");
      setApiKey(key);
      navigate("/");
    } catch (err) {
      setError(err.message || "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh bg-background">
      <aside className="relative hidden overflow-hidden border-r border-border bg-card lg:flex lg:w-[44%] lg:flex-col lg:justify-between lg:p-12">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 dm-shell-mesh opacity-80" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,color-mix(in_srgb,var(--color-border)_35%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_srgb,var(--color-border)_35%,transparent)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/75 text-primary-foreground shadow-lg shadow-primary/25">
              <Terminal size={18} />
            </span>
            <p className="font-mono text-sm font-semibold">dev<span className="text-primary">/metrics</span></p>
          </div>
          <h1 className="mt-10 max-w-md text-3xl font-semibold leading-tight tracking-tight">
            Understand what your app does under the hood.
          </h1>
          <ul className="mt-10 space-y-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/15">
                  <Icon size={16} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-muted-foreground">Development observability for local sessions.</p>
      </aside>

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <p className="font-mono text-sm font-semibold">dev<span className="text-primary">/metrics</span></p>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to continue to your runs.</p>

          <form onSubmit={handleSubmit} className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-lg shadow-foreground/[0.03]">
            {error && (
              <div className="mb-5 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive-strong">
                {error}
              </div>
            )}
            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium">Email</span>
                <input name="email" type="email" autoComplete="email" required value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="dm-input" placeholder="you@example.com" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium">Password</span>
                <input name="password" type="password" autoComplete="current-password" required value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="dm-input" placeholder="••••••••" />
              </label>
            </div>
            <Button type="submit" loading={loading} className="mt-6 w-full">Sign in</Button>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/signup" className="font-medium text-foreground hover:underline">Create one</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
