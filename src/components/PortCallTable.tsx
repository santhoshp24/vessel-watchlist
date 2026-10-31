import { humanize } from '@/domain/constants';
import type { PortCallPatch, PortCallRecord } from '@/domain/types';
import { formatDateTime } from '@/lib/format';

import { DelayChip } from './DelayChip';
import { cardClass, secondaryButtonClass } from './styles';

interface PortCallTableProps {
  calls: readonly PortCallRecord[];
  onUpdate: (id: string, patch: PortCallPatch) => void;
  onDelete: (id: string) => void;
}

export function PortCallTable({ calls, onUpdate, onDelete }: PortCallTableProps) {
  if (calls.length === 0) {
    return (
      <div className={`${cardClass} p-6 text-center text-sm text-slate-400`}>
        No port calls logged for this vessel yet.
      </div>
    );
  }

  const ordered = [...calls].sort((a, b) => b.eta.getTime() - a.eta.getTime());

  return (
    <div className={`${cardClass} overflow-x-auto`}>
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 font-medium">Port</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">ETA</th>
            <th className="px-4 py-3 font-medium">ATA</th>
            <th className="px-4 py-3 font-medium">ATD</th>
            <th className="px-4 py-3 font-medium">Delay</th>
            <th className="px-4 py-3 font-medium">Reason</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {ordered.map((call) => (
            <tr key={call.id}>
              <td className="px-4 py-3">
                <div className="font-medium text-slate-900">{call.portName}</div>
                <div className="text-xs text-slate-400">
                  {[call.unlocode, call.berth].filter(Boolean).join(' · ')}
                </div>
              </td>
              <td className="px-4 py-3 text-slate-700">{humanize(call.status)}</td>
              <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                {formatDateTime(call.eta)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                {formatDateTime(call.ata)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                {formatDateTime(call.atd)}
              </td>
              <td className="px-4 py-3">
                <DelayChip call={call} />
              </td>
              <td className="px-4 py-3 text-slate-700">
                {call.delayReason === 'none' ? '—' : humanize(call.delayReason)}
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  {call.status === 'expected' && (
                    <button
                      className={secondaryButtonClass}
                      onClick={() =>
                        onUpdate(call.id, { status: 'arrived', ata: new Date() })
                      }
                    >
                      Mark arrived
                    </button>
                  )}
                  {(call.status === 'arrived' || call.status === 'berthed') && (
                    <button
                      className={secondaryButtonClass}
                      onClick={() =>
                        onUpdate(call.id, { status: 'departed', atd: new Date() })
                      }
                    >
                      Mark departed
                    </button>
                  )}
                  <button
                    className="text-xs text-slate-400 hover:text-red-600"
                    onClick={() => onDelete(call.id)}
                    aria-label={`Delete call at ${call.portName}`}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
