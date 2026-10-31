import { withImoCheckDigit } from '@/domain/imo';
import type {
  PortCallInput,
  PortCallStatus,
  DelayReason,
  VesselInput,
} from '@/domain/types';

import type { WatchlistRepository } from './repository';

/**
 * Synthetic demo data. Vessel names, IMO numbers, and timings are invented
 * for illustration; the IMO numbers carry valid check digits but are not meant
 * to identify real ships. Port names and UN/LOCODEs are real public codes.
 */
interface SampleCall {
  portName: string;
  unlocode: string;
  /** Hours after the first ETA, so the data stays relative to "now". */
  etaOffsetHours: number;
  /** Hours late (+) or early (-) versus ETA. Omit for a call not yet arrived. */
  delay?: number;
  status: PortCallStatus;
  delayReason: DelayReason;
  berth?: string;
}

interface SampleVessel {
  vessel: VesselInput;
  watched: boolean;
  calls: SampleCall[];
  note?: { body: string; tag?: string };
}

const SAMPLE: SampleVessel[] = [
  {
    vessel: {
      imo: withImoCheckDigit('950001'),
      name: 'DEMO GULF TRADER',
      vesselType: 'container',
      flag: 'Panama',
    },
    watched: true,
    note: { body: 'Recurring Jebel Ali delays since the schedule change.', tag: 'congestion' },
    calls: [
      { portName: 'Jebel Ali', unlocode: 'AEJEA', etaOffsetHours: -240, delay: 6.5, status: 'departed', delayReason: 'congestion' },
      { portName: 'Khalifa Port', unlocode: 'AEKHL', etaOffsetHours: -120, delay: 1.0, status: 'departed', delayReason: 'none' },
      { portName: 'Jebel Ali', unlocode: 'AEJEA', etaOffsetHours: 48, status: 'expected', delayReason: 'none' },
    ],
  },
  {
    vessel: {
      imo: withImoCheckDigit('950002'),
      name: 'DEMO RED SEA SPIRIT',
      vesselType: 'tanker',
      flag: 'Liberia',
    },
    watched: true,
    note: { body: 'Diverted around the Cape; ETAs unreliable.', tag: 'diversion' },
    calls: [
      { portName: 'Jeddah', unlocode: 'SAJED', etaOffsetHours: -300, delay: 52.0, status: 'departed', delayReason: 'red-sea-diversion' },
      { portName: 'Fujairah', unlocode: 'AEFJR', etaOffsetHours: -60, delay: 14.0, status: 'berthed', delayReason: 'berth-unavailable', berth: 'Anchorage 3' },
    ],
  },
  {
    vessel: {
      imo: withImoCheckDigit('950003'),
      name: 'DEMO COASTAL BULKER',
      vesselType: 'bulk-carrier',
      flag: 'Marshall Islands',
    },
    watched: false,
    calls: [
      { portName: 'Abu Dhabi', unlocode: 'AEAUH', etaOffsetHours: -200, delay: -3.0, status: 'departed', delayReason: 'none' },
      { portName: 'Khalifa Port', unlocode: 'AEKHL', etaOffsetHours: -30, delay: 2.5, status: 'arrived', delayReason: 'weather' },
    ],
  },
  {
    vessel: {
      imo: withImoCheckDigit('950004'),
      name: 'DEMO RORO EXPRESS',
      vesselType: 'ro-ro',
      flag: 'Singapore',
    },
    watched: false,
    calls: [
      { portName: 'Jebel Ali', unlocode: 'AEJEA', etaOffsetHours: -90, delay: 0.5, status: 'departed', delayReason: 'none' },
    ],
  },
];

const MS_PER_HOUR = 3_600_000;

/** Loads the demo data through whichever repository is active. */
export async function loadSampleData(
  repository: WatchlistRepository,
  now: Date = new Date()
): Promise<void> {
  for (const entry of SAMPLE) {
    const vessel = await repository.createVessel(entry.vessel);
    if (entry.watched) await repository.setWatched(vessel.id, true);

    for (const call of entry.calls) {
      const eta = new Date(now.getTime() + call.etaOffsetHours * MS_PER_HOUR);
      const ata =
        call.delay === undefined
          ? undefined
          : new Date(eta.getTime() + call.delay * MS_PER_HOUR);
      const input: PortCallInput = {
        portName: call.portName,
        unlocode: call.unlocode,
        status: call.status,
        eta,
        ata,
        berth: call.berth,
        delayReason: call.delayReason,
      };
      await repository.createPortCall(vessel.id, input);
    }

    if (entry.note) await repository.addNote(vessel.id, entry.note);
  }
}
