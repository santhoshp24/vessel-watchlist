import { delayBand, delayHours, type DelayBand } from '@/domain/delay';
import type { PortCallRecord } from '@/domain/types';

const BAND_CLASS: Record<DelayBand, string> = {
  early: 'bg-sky-50 text-sky-700',
  'on-time': 'bg-emerald-50 text-emerald-700',
  late: 'bg-amber-50 text-amber-700',
  severe: 'bg-red-50 text-red-700',
};

export function DelayChip({
  call,
}: {
  call: Pick<PortCallRecord, 'eta' | 'ata'>;
}) {
  const hours = delayHours(call);
  if (hours === null) {
    return <span className="text-slate-400">Not arrived</span>;
  }
  const band = delayBand(hours);
  const sign = hours > 0 ? '+' : '';
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${BAND_CLASS[band]}`}
    >
      {sign}
      {hours} h
    </span>
  );
}
