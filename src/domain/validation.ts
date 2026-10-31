import { toStandardSchema } from '@microsoft/rayfin-core';

import { PortCall } from '../../rayfin/data/PortCall';
import { Vessel } from '../../rayfin/data/Vessel';
import { VesselNote } from '../../rayfin/data/VesselNote';

import { isValidImo } from './imo';
import type {
  DelayReason,
  NoteInput,
  PortCallInput,
  PortCallStatus,
  VesselInput,
  VesselType,
} from './types';

/**
 * Field rules (lengths, regexes, allowed enum values) are declared once, on the
 * entity decorators, and reused here for client-side validation. Only rules the
 * decorators cannot express (the IMO check digit, date ordering) are written
 * by hand below.
 */
const vesselSchema = toStandardSchema(Vessel, {
  omit: ['isWatched', 'createdAt', 'user_id'] as const,
});

const portCallSchema = toStandardSchema(PortCall, {
  omit: ['user_id'] as const,
});

const noteSchema = toStandardSchema(VesselNote, {
  omit: ['createdAt', 'user_id'] as const,
});

export type FieldErrors<K extends string> = Partial<Record<K, string>>;

export type ValidationResult<TValue, TField extends string> =
  | { ok: true; value: TValue }
  | { ok: false; errors: FieldErrors<TField> };

interface Issue {
  message: string;
  path?: ReadonlyArray<PropertyKey | { key: PropertyKey }>;
}

/** Keeps the first message per field. */
function collectErrors<K extends string>(
  issues: readonly Issue[]
): FieldErrors<K> {
  const errors: Partial<Record<string, string>> = {};
  for (const issue of issues) {
    const segment = issue.path?.[0];
    const key = String(
      typeof segment === 'object' && segment !== null
        ? segment.key
        : (segment ?? '_')
    );
    errors[key] ??= issue.message;
  }
  return errors as FieldErrors<K>;
}

/** Blank form inputs mean "not provided". */
function blankToUndefined(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

// ---------------------------------------------------------------------------
// Vessel
// ---------------------------------------------------------------------------

export interface VesselFormValues {
  imo: string;
  name: string;
  vesselType: VesselType;
  flag: string;
}

export type VesselField = 'imo' | 'name' | 'vesselType' | 'flag';

export function validateVessel(
  form: VesselFormValues
): ValidationResult<VesselInput, VesselField> {
  const candidate = {
    imo: form.imo.trim(),
    name: form.name.trim(),
    vesselType: form.vesselType,
    flag: blankToUndefined(form.flag),
  };

  const result = vesselSchema.validate(candidate);
  if (result.issues) {
    return { ok: false, errors: collectErrors<VesselField>(result.issues) };
  }

  if (!isValidImo(candidate.imo)) {
    return {
      ok: false,
      errors: { imo: 'This IMO number fails the check-digit test.' },
    };
  }

  return {
    ok: true,
    value: {
      imo: candidate.imo,
      name: candidate.name,
      vesselType: candidate.vesselType,
      flag: candidate.flag,
    },
  };
}

// ---------------------------------------------------------------------------
// Port call
// ---------------------------------------------------------------------------

export interface PortCallFormValues {
  portName: string;
  unlocode: string;
  status: PortCallStatus;
  /** `datetime-local` input values, e.g. "2026-11-02T08:30". */
  eta: string;
  ata: string;
  atd: string;
  berth: string;
  delayReason: DelayReason;
}

export type PortCallField =
  | 'portName'
  | 'unlocode'
  | 'status'
  | 'eta'
  | 'ata'
  | 'atd'
  | 'berth'
  | 'delayReason';

function parseLocalDateTime(value: string): Date | undefined {
  const trimmed = value.trim();
  if (trimmed === '') return undefined;
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export function validatePortCall(
  form: PortCallFormValues
): ValidationResult<PortCallInput, PortCallField> {
  const eta = parseLocalDateTime(form.eta);
  const ata = parseLocalDateTime(form.ata);
  const atd = parseLocalDateTime(form.atd);

  const errors: FieldErrors<PortCallField> = {};
  if (form.eta.trim() !== '' && !eta) errors.eta = 'Enter a valid date and time.';
  if (form.ata.trim() !== '' && !ata) errors.ata = 'Enter a valid date and time.';
  if (form.atd.trim() !== '' && !atd) errors.atd = 'Enter a valid date and time.';

  const candidate = {
    portName: form.portName.trim(),
    unlocode: blankToUndefined(form.unlocode)?.toUpperCase(),
    status: form.status,
    eta,
    ata,
    atd,
    berth: blankToUndefined(form.berth),
    delayReason: form.delayReason,
  };

  const result = portCallSchema.validate(candidate);
  if (result.issues) {
    const fromSchema = collectErrors<PortCallField>(result.issues);
    // A date that failed to parse is reported above; keep that clearer message.
    return { ok: false, errors: { ...fromSchema, ...errors } };
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  // Cross-field rules the decorators cannot express.
  if (ata && atd && atd < ata) {
    return {
      ok: false,
      errors: { atd: 'Departure cannot be before arrival.' },
    };
  }
  if (candidate.status === 'expected' && ata) {
    return {
      ok: false,
      errors: { status: 'A call with an actual arrival is no longer "expected".' },
    };
  }

  return {
    ok: true,
    value: {
      portName: candidate.portName,
      unlocode: candidate.unlocode,
      status: candidate.status,
      eta: eta as Date,
      ata,
      atd,
      berth: candidate.berth,
      delayReason: candidate.delayReason,
    },
  };
}

// ---------------------------------------------------------------------------
// Note
// ---------------------------------------------------------------------------

export type NoteField = 'body' | 'tag';

export function validateNote(form: {
  body: string;
  tag: string;
}): ValidationResult<NoteInput, NoteField> {
  const candidate = {
    body: form.body.trim(),
    tag: blankToUndefined(form.tag),
  };
  const result = noteSchema.validate(candidate);
  if (result.issues) {
    return { ok: false, errors: collectErrors<NoteField>(result.issues) };
  }
  return { ok: true, value: candidate };
}
