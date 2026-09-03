import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Activity, GitCompareArrows, BarChart3, Terminal } from "lucide-react";
import { supabase, registerUser, setApiKey } from "../../lib/auth";
import Button from "../../components/ui/Button";

const FEATURES = [
  { icon: Activity, text: "Record local app runs in real time" },
  { icon: GitCompareArrows, text: "Compare before/after behavior" },
  { icon: BarChart3, text: "Analytics on requests and errors" },
];

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!supabase) { setError("Supabase is not configured."); return; }
    if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }

    setError("");
    setMessage("");
    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signUp({ email: form.email, password: form.password });
      if (authError) throw authError;
      const userId = data.user?.id;
      if (!userId) throw new Error("Unable to create the user account.");
      const result = await registerUser(userId, form.email);
      const key = result?.data?.key;
      if (!key) throw new Error("Unable to create the DevMetrics API key.");
      setApiKey(key);
      if (data.session) { navigate("/"); return; }
      setMessage("Account created. Check your email to confirm your account.");
    } catch (err) {
      setError(err.message || "Unable to create your account.");
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
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent/90 to-accent/60 text-accent-foreground shadow-lg shadow-accent/20">
              <Terminal size={18} />
            </span>
            <p className="font-mono text-sm font-semibold">dev<span className="text-primary">/metrics</span></p>
          </div>
          <h1 className="mt-10 max-w-md text-3xl font-semibold leading-tight tracking-tight">
            Start capturing how your application behaves.
          </h1>
          <ul className="mt-10 space-y-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent-foreground ring-1 ring-accent/20">
                  <Icon size={16} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-muted-foreground">Free to get started — runs stay on your machine.</p>
      </aside>

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <p className="font-mono text-sm font-semibold">dev<span className="text-primary">/metrics</span></p>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">Create your account</h2>
          <p className="mt-2 text-sm text-muted-foreground">Start recording and analyzing development runs.</p>

          <form onSubmit={handleSubmit} className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-lg shadow-foreground/[0.03]">
            {error && (
              <div className="mb-5 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive-strong">{error}</div>
            )}
            {message && (
              <div className="mb-5 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm">{message}</div>
            )}
            <div className="space-y-4">
              {[
                { name: "email", label: "Email", type: "email" },
                { name: "password", label: "Password", type: "password" },
                { name: "confirmPassword", label: "Confirm password", type: "password" },
              ].map(({ name, label, type }) => (
                <label key={name} className="block">
                  <span className="mb-2 block text-sm font-medium">{label}</span>
                  <input
                    name={name}
                    type={type}
                    autoComplete={name === "email" ? "email" : "new-password"}
                    required
                    value={form[name]}
                    onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
                    className="dm-input"
                    placeholder={type === "password" ? "••••••••" : "you@example.com"}
                  />
                </label>
              ))}
            </div>
            <Button type="submit" loading={loading} className="mt-6 w-full">Create account</Button>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-foreground hover:underline">Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}


