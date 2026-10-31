import { useState } from 'react';

import { InsightsPanel } from '@/components/InsightsPanel';
import { NotesPanel } from '@/components/NotesPanel';
import { PortCallForm } from '@/components/PortCallForm';
import { PortCallTable } from '@/components/PortCallTable';
import {
  cardClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '@/components/styles';
import { VesselForm } from '@/components/VesselForm';
import { humanize } from '@/domain/constants';
import { useAuth } from '@/hooks/AuthContext';
import { useWatchlist } from '@/hooks/useWatchlist';
import { pluralize } from '@/lib/format';

type Tab = 'vessels' | 'insights';

export function HomePage() {
  const { signOut, user } = useAuth();
  const watchlist = useWatchlist();
  const [tab, setTab] = useState<Tab>('vessels');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { vessels, portCalls, notes } = watchlist;
  const selected =
    vessels.find((v) => v.id === selectedId) ?? vessels[0] ?? undefined;

  const callsFor = (vesselId: string) =>
    portCalls.filter((c) => c.vesselId === vesselId);

  const handleDeleteVessel = (id: string, name: string) => {
    if (window.confirm(`Remove ${name} and all of its port calls and notes?`)) {
      watchlist.deleteVessel(id);
      setSelectedId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Vessel Watchlist</h1>
          <p className="text-xs text-slate-500">
            Track vessels and port-call delays
          </p>
        </div>
        <div className="flex items-center gap-4">
          {user?.email && (
            <span className="text-sm text-slate-600" title={user.email}>
              {user.email}
            </span>
          )}
          <button
            onClick={() => void signOut()}
            className="text-sm text-slate-400 transition-colors hover:text-slate-600"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6 flex gap-2" role="tablist">
          {(['vessels', 'insights'] as const).map((value) => (
            <button
              key={value}
              role="tab"
              aria-selected={tab === value}
              onClick={() => setTab(value)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                tab === value
                  ? 'bg-teal-700 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              {value === 'vessels' ? 'Watchlist' : 'Insights'}
            </button>
          ))}
        </div>

        {watchlist.error && (
          <div
            role="alert"
            className="mb-4 flex items-start justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <span>{watchlist.error}</span>
            <button onClick={watchlist.dismissError} className="ml-4 font-medium">
              Dismiss
            </button>
          </div>
        )}

        {watchlist.loading ? (
          <p className="py-16 text-center text-sm text-slate-400">Loading…</p>
        ) : tab === 'insights' ? (
          <InsightsPanel vessels={vessels} portCalls={portCalls} />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <aside className="space-y-4">
              <VesselForm onSubmit={watchlist.addVessel} />

              <div className={cardClass}>
                {vessels.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="mb-3 text-sm text-slate-500">
                      Your watchlist is empty.
                    </p>
                    <button
                      className={primaryButtonClass}
                      onClick={() => void watchlist.loadSamples()}
                    >
                      Load sample data
                    </button>
                    <p className="mt-3 text-xs text-slate-400">
                      Synthetic demo vessels, for illustration only.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {vessels.map((vessel) => (
                      <li key={vessel.id}>
                        <button
                          onClick={() => setSelectedId(vessel.id)}
                          aria-current={selected?.id === vessel.id}
                          className={`flex w-full items-center justify-between px-4 py-3 text-left transition-colors ${
                            selected?.id === vessel.id
                              ? 'bg-teal-50'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <span>
                            <span className="block text-sm font-medium text-slate-900">
                              {vessel.isWatched && (
                                <span aria-label="Watched" className="mr-1 text-amber-500">
                                  ★
                                </span>
                              )}
                              {vessel.name}
                            </span>
                            <span className="block text-xs text-slate-500">
                              IMO {vessel.imo} · {humanize(vessel.vesselType)}
                            </span>
                          </span>
                          <span className="text-xs text-slate-400">
                            {pluralize(callsFor(vessel.id).length, 'call')}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </aside>

            <section className="space-y-4">
              {selected ? (
                <>
                  <div className={`${cardClass} flex items-center justify-between p-4`}>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">
                        {selected.name}
                      </h2>
                      <p className="text-sm text-slate-500">
                        IMO {selected.imo} · {humanize(selected.vesselType)}
                        {selected.flag ? ` · ${selected.flag}` : ''}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className={secondaryButtonClass}
                        onClick={() =>
                          watchlist.setWatched(selected.id, !selected.isWatched)
                        }
                      >
                        {selected.isWatched ? 'Unwatch' : 'Watch'}
                      </button>
                      <button
                        className={secondaryButtonClass}
                        onClick={() => handleDeleteVessel(selected.id, selected.name)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <PortCallTable
                    calls={callsFor(selected.id)}
                    onUpdate={watchlist.updatePortCall}
                    onDelete={watchlist.deletePortCall}
                  />

                  <PortCallForm
                    vesselName={selected.name}
                    onSubmit={(input) => watchlist.addPortCall(selected.id, input)}
                  />

                  <NotesPanel
                    notes={notes.filter((n) => n.vesselId === selected.id)}
                    onAdd={(input) => watchlist.addNote(selected.id, input)}
                    onDelete={watchlist.deleteNote}
                  />
                </>
              ) : (
                <div className={`${cardClass} p-10 text-center text-sm text-slate-400`}>
                  Add a vessel to start logging port calls.
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
