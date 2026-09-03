import { useMemo } from 'react';

import { useFetch } from '../../hooks/useFetch';
import { fetchSessions } from '../../lib/runs';
import RunRow from '../../components/RunRow';
import { LoadingState, EmptyState, ErrorState } from '../../components/runs/Sessiondetails';
import Card from "../../components/ui/Card";


/**
 * FIXED: removed the unused `useNavigate`/`handleKeyDown` pair. RunRow
 * already owns its own click + Enter/Space navigation (to /sessions/:id) —
 * this page was building a second, disconnected keyboard handler and
 * passing it as an `onKeyDown` prop RunRow never read. One row, one owner
 * of its own interaction.
 */
export default function RunsPage() {
  const { data, loading, error, refetch } = useFetch(fetchSessions);

const runs = useMemo(() => {
  const list = data?.data;
  if (!list) return list;

  return [...list].sort((a, b) => {
    const aActive = a.ended_at == null;
    const bActive = b.ended_at == null;

    if (aActive !== bActive) return aActive ? -1 : 1;

    return new Date(b.started_at) - new Date(a.started_at);
  });
}, [data]);

 if (loading) return <LoadingState />;
if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!runs || runs.length === 0) return <EmptyState />;

 return (
 <div className="mx-auto w-full max-w-7xl px-6 py-8">
  <header className="mb-6"> 
    <h1 className="text-xl font-semibold text-foreground">
     Runs
      </h1>
       <p className="mt-1 text-sm text-muted-foreground">
         Bounded debugging sessions captured from your app. 
         </p> 
         </header>
    
    <Card>
      <ul
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
        }}
        role="list"
      >
        {runs.map((run) => (
          <RunRow key={run.id} run={run} />
        ))}
      </ul>
    </Card>
  </div>
);
}