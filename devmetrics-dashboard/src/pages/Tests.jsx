import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Plus } from "lucide-react";
import { useFetch } from "../hooks/useFetch";
import { createTest, fetchTests } from "../lib/tests";
import Card, { CardContent } from "../components/ui/Card";
import Button from "../components/ui/Button";
import SectionHeader from "../components/ui/SectionHeader";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import Skeleton from "../components/ui/Skeleton";
import Badge from "../components/ui/Badge";

function TestsSkeleton() {
  return <div className="space-y-2">{[1, 2, 3].map((item) => <Card key={item}><CardContent className="py-4"><Skeleton className="h-5 w-48" /><Skeleton className="mt-2 h-4 w-72" /></CardContent></Card>)}</div>;
}

export default function Tests() {
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useFetch(fetchTests);
  const [creating, setCreating] = useState(false);
  const tests = data?.data || [];

  const handleCreate = async () => {
    try {
      setCreating(true);
      const response = await createTest({ name: "Untitled test", description: "" });
      const created = response?.data?.data ?? response?.data;
      if (!created?.id) throw new Error("Test was created but no test ID was returned.");
      navigate(`/tests/${created.id}`);
    } catch (err) {
      console.error("Failed to create test:", err);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <div className="space-y-6"><SectionHeader eyebrow="Tests" title="API tests" description="Create reusable API test configurations." /><TestsSkeleton /></div>;
  }

  if (error) return <ErrorState description={error} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Tests" title="API tests" description="Create reusable API test configurations." actions={<Button onClick={handleCreate} loading={creating} leftIcon={<Plus size={16} />}>Create test</Button>} />

      {!tests.length ? (
        <EmptyState title="No tests yet" description="Create your first API test and configure the requests it should execute." action={<Button onClick={handleCreate} loading={creating} leftIcon={<Plus size={16} />}>Create your first test</Button>} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
          {tests.map((test, index) => (
            <button
              key={test.id}
              type="button"
              onClick={() => navigate(`/tests/${test.id}`)}
              className="flex w-full items-center gap-4 border-b border-border px-5 py-4 text-left transition-colors last:border-b-0 hover:bg-muted/30"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/20 font-mono text-xs text-muted-foreground">
                {String(index + 1).padStart(2, "0")}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate font-medium">{test.name || "Untitled test"}</h2>
                  <Badge variant="outline">{test.request_count || 0} {Number(test.request_count) === 1 ? "request" : "requests"}</Badge>
                </div>
                <p className="mt-1 truncate text-sm text-muted-foreground">{test.description || "No description"}</p>
              </div>
              <ArrowRight size={16} className="shrink-0 text-muted-foreground" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
