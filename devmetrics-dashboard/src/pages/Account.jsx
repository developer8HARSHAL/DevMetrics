import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BadgeCheck, LogOut, Mail, UserRound } from "lucide-react";

import { getAuthUser, signOut, updatePassword } from "../lib/auth";
import {
  formatDate,
  formatRelativeTime,
} from "../lib/formatters";
import {
  Badge,
  Button,
  Card,
  CardContent,
  SectionHeader,
  Skeleton,
} from "../components/ui";

const MIN_PASSWORD_LENGTH = 8;

export default function Account() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    let mounted = true;

    getAuthUser()
      .then((u) => mounted && setUser(u))
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  async function handleChangePassword(e) {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setPasswordError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError("Passwords don't match.");
      return;
    }

    setSaving(true);

    try {
      await updatePassword(password);
      setPassword("");
      setConfirmPassword("");
      setPasswordSuccess(true);
    } catch (err) {
      setPasswordError(err?.message || "Could not update your password.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
    } catch {
      // local sign-out regardless
    }
    navigate("/login");
  }

  const initials = user?.email?.slice(0, 2).toUpperCase() || "DM";
  const emailVerified = Boolean(user?.email_confirmed_at);
  const provider = user?.app_metadata?.provider;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <SectionHeader eyebrow="Account" title="Your account" />

      {loading ? (
        <Card>
          <CardContent className="space-y-3 md:p-6">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="space-y-5 md:p-6">
              <div className="flex items-center gap-3.5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-xs font-semibold text-foreground">
                  {initials}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{user?.email}</p>
                  <div className="mt-1 flex items-center gap-2">
                    {emailVerified && (
                      <Badge variant="success" size="xs">
                        <BadgeCheck size={11} /> Verified
                      </Badge>
                    )}
                    {provider && (
                      <Badge variant="outline" size="xs">
                        <Mail size={11} /> {provider}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-4 border-t border-border pt-4 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Member since</dt>
                  <dd className="mt-0.5 text-foreground">{formatDate(user?.created_at)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Last signed in</dt>
                  <dd className="mt-0.5 text-foreground">
                    {user?.last_sign_in_at ? formatRelativeTime(user.last_sign_in_at) : "—"}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="md:p-6">
              <p className="text-sm font-medium text-foreground">Change password</p>
              <form onSubmit={handleChangePassword} className="mt-4 space-y-3">
                <input
                  type="password"
                  className="dm-input"
                  placeholder="New password"
                  value={password}
                  disabled={saving}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <input
                  type="password"
                  className="dm-input"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  disabled={saving}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />

                {passwordError && (
                  <p className="text-xs text-destructive-strong">{passwordError}</p>
                )}
                {passwordSuccess && (
                  <p className="text-xs text-success">Password updated.</p>
                )}

                <Button type="submit" size="sm" loading={saving}>
                  {saving ? "Updating…" : "Update password"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<LogOut size={14} />}
              onClick={handleSignOut}
            >
              Sign out
            </Button>
          </div>
        </>
      )}
    </div>
  );
}