import { delayBand, delayHours, portStats, reasonBreakdown } from '@/domain/delay';
import { humanize } from '@/domain/constants';
import type { PortCallRecord, VesselRecord } from '@/domain/types';

import { cardClass } from './styles';

interface InsightsPanelProps {
  vessels: readonly VesselRecord[];
  portCalls: readonly PortCallRecord[];
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className={`${cardClass} px-4 py-3`}>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export function InsightsPanel({ vessels, portCalls }: InsightsPanelProps) {
  const measured = portCalls
    .map((call) => delayHours(call))
    .filter((h): h is number => h !== null);

  const average =
    measured.length === 0
      ? null
      : Math.round((measured.reduce((a, b) => a + b, 0) / measured.length) * 10) / 10;
  const severe = measured.filter((h) => delayBand(h) === 'severe').length;

  const ports = portStats(portCalls).filter((p) => p.measuredCalls > 0);
  const reasons = reasonBreakdown(portCalls);

  const maxDelay = Math.max(1, ...ports.map((p) => Math.abs(p.averageDelayHours)));
  const maxReason = Math.max(1, ...reasons.map((r) => r.count));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Vessels" value={String(vessels.length)} />
        <Kpi label="Port calls" value={String(portCalls.length)} />
        <Kpi
          label="Avg delay"
          value={average === null ? '—' : `${average > 0 ? '+' : ''}${average} h`}
        />
        <Kpi label="Severe delays (>24 h)" value={String(severe)} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className={`${cardClass} p-4`}>
          <h3 className="mb-3 text-sm font-semibold text-slate-900">
            Average delay by port
          </h3>
          {ports.length === 0 ? (
            <p className="text-sm text-slate-400">
              Delays appear once vessels have arrived.
            </p>
          ) : (
            <ul className="space-y-3">
              {ports.map((port) => (
                <li key={port.portName}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-slate-800">{port.portName}</span>
                    <span className="text-slate-500">
                      {port.averageDelayHours > 0 ? '+' : ''}
                      {port.averageDelayHours} h · {port.measuredCalls}{' '}
                      {port.measuredCalls === 1 ? 'call' : 'calls'}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className={`h-2 rounded-full ${
                        port.averageDelayHours > 24
                          ? 'bg-red-500'
                          : port.averageDelayHours > 2
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                      }`}
                      style={{
                        width: `${(Math.abs(port.averageDelayHours) / maxDelay) * 100}%`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={`${cardClass} p-4`}>
          <h3 className="mb-3 text-sm font-semibold text-slate-900">
            Delay reasons
          </h3>
          {reasons.length === 0 ? (
            <p className="text-sm text-slate-400">No delay reasons recorded.</p>
          ) : (
            <ul className="space-y-3">
              {reasons.map(({ reason, count }) => (
                <li key={reason}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-slate-800">{humanize(reason)}</span>
                    <span className="text-slate-500">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-teal-600"
                      style={{ width: `${(count / maxReason) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
