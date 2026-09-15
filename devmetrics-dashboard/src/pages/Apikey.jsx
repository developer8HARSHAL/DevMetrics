import { useState } from "react";
import { Check, Copy, Eye, EyeOff, KeyRound, ShieldAlert } from "lucide-react";

import { getApiKey } from "../lib/auth";
import {
  Button,
  Card,
  CardContent,
  EmptyState,
  SectionHeader,
} from "../components/ui";

function maskKey(key) {
  if (!key || key.length < 8) return key;
  return `${key.slice(0, 4)}${"•".repeat(Math.max(key.length - 8, 4))}${key.slice(-4)}`;
}

const STEPS = [
  {
    title: "Copy your key",
    description: "Use the button below.",
  },
  {
    title: "Add it to your integration's server-side config",
    description: "As an environment variable in whatever sends traffic data to DevMetrics — never in frontend or browser code.",
  },
  {
    title: "Runs show up here automatically",
    description: "Anything sent in with this key lands in your account and appears on the Runs page.",
  },
];

export default function ApiKeyPage() {
  const [key] = useState(() => getApiKey());
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!key) return;

    await navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!key) {
    return (
      <div className="space-y-6">
        <SectionHeader eyebrow="Developer" title="API key" />
        <EmptyState
          icon={KeyRound}
          title="No key yet"
          description="Your key is provisioned automatically when you sign in. If this persists, try reloading the app."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <SectionHeader
        eyebrow="Developer"
        title="API key"
        description="The credential that lets your own tools send data into DevMetrics under your account."
      />

      <Card>
        <CardContent className="space-y-5 md:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <KeyRound size={18} strokeWidth={1.9} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">Your key</p>
              <p className="text-xs text-muted-foreground">One key, shared across all your integrations.</p>
            </div>
          </div>

          <div className="flex items-stretch gap-2">
            <div className="flex min-w-0 flex-1 items-center rounded-md border border-border bg-muted/50 px-3.5 py-3">
              <code className="min-w-0 flex-1 truncate font-data text-sm tracking-wide text-foreground">
                {revealed ? key : maskKey(key)}
              </code>
              <button
                type="button"
                aria-label={revealed ? "Hide key" : "Reveal key"}
                onClick={() => setRevealed((r) => !r)}
                className="ml-3 shrink-0 text-muted-foreground transition-colors hover:text-foreground"
              >
                {revealed ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <Button
              variant={copied ? "secondary" : "primary"}
              size="md"
              className="shrink-0"
              leftIcon={copied ? <Check size={15} /> : <Copy size={15} />}
              onClick={handleCopy}
            >
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>

          <div className="flex items-start gap-2.5 rounded-md bg-warning/10 px-3.5 py-3">
            <ShieldAlert size={15} className="mt-0.5 shrink-0 text-warning-strong" />
            <p className="text-xs leading-5 text-warning-strong">
              Anyone with this key can send data into your account. Keep it out of
              client-side code and public repos. Self-serve rotation isn't available
              yet — contact support if this key is exposed.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <p className="text-sm font-medium text-foreground">Setting it up</p>
        <ol className="space-y-4">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-3.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted font-data text-xs font-medium text-muted-foreground">
                {i + 1}
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="text-sm text-foreground">{step.title}</p>
                <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}