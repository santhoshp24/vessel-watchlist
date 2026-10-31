import { useState } from 'react';

import {
  DELAY_REASONS,
  PORT_CALL_STATUSES,
  humanize,
} from '@/domain/constants';
import type {
  DelayReason,
  PortCallInput,
  PortCallStatus,
} from '@/domain/types';
import {
  validatePortCall,
  type FieldErrors,
  type PortCallField,
  type PortCallFormValues,
} from '@/domain/validation';

import { Field } from './Field';
import { cardClass, inputClass, primaryButtonClass } from './styles';

const EMPTY: PortCallFormValues = {
  portName: '',
  unlocode: '',
  status: 'expected',
  eta: '',
  ata: '',
  atd: '',
  berth: '',
  delayReason: 'none',
};

interface PortCallFormProps {
  vesselName: string;
  /** Resolves to an error message, or `null` when the call was saved. */
  onSubmit: (input: PortCallInput) => Promise<string | null>;
}

export function PortCallForm({ vesselName, onSubmit }: PortCallFormProps) {
  const [values, setValues] = useState<PortCallFormValues>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors<PortCallField>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof PortCallFormValues>(
    key: K,
    value: PortCallFormValues[K]
  ) => setValues((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);

    const result = validatePortCall(values);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});

    setSaving(true);
    const message = await onSubmit(result.value);
    setSaving(false);

    if (message) setSubmitError(message);
    else setValues(EMPTY);
  };

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className={`${cardClass} space-y-3 p-4`}
      noValidate
    >
      <h3 className="text-sm font-semibold text-slate-900">
        Log a port call for {vesselName}
      </h3>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Port" htmlFor="call-port" error={errors.portName}>
          <input
            id="call-port"
            className={inputClass}
            maxLength={100}
            value={values.portName}
            onChange={(e) => set('portName', e.target.value)}
          />
        </Field>
        <Field
          label="UN/LOCODE (optional)"
          htmlFor="call-locode"
          error={errors.unlocode}
          hint="e.g. AEJEA"
        >
          <input
            id="call-locode"
            className={inputClass}
            maxLength={5}
            value={values.unlocode}
            onChange={(e) => set('unlocode', e.target.value)}
          />
        </Field>
        <Field label="Status" htmlFor="call-status" error={errors.status}>
          <select
            id="call-status"
            className={inputClass}
            value={values.status}
            onChange={(e) => set('status', e.target.value as PortCallStatus)}
          >
            {PORT_CALL_STATUSES.map((status) => (
              <option key={status} value={status}>
                {humanize(status)}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="ETA" htmlFor="call-eta" error={errors.eta}>
          <input
            id="call-eta"
            type="datetime-local"
            className={inputClass}
            value={values.eta}
            onChange={(e) => set('eta', e.target.value)}
          />
        </Field>
        <Field label="Actual arrival (ATA)" htmlFor="call-ata" error={errors.ata}>
          <input
            id="call-ata"
            type="datetime-local"
            className={inputClass}
            value={values.ata}
            onChange={(e) => set('ata', e.target.value)}
          />
        </Field>
        <Field label="Actual departure (ATD)" htmlFor="call-atd" error={errors.atd}>
          <input
            id="call-atd"
            type="datetime-local"
            className={inputClass}
            value={values.atd}
            onChange={(e) => set('atd', e.target.value)}
          />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Berth (optional)" htmlFor="call-berth" error={errors.berth}>
          <input
            id="call-berth"
            className={inputClass}
            maxLength={50}
            value={values.berth}
            onChange={(e) => set('berth', e.target.value)}
          />
        </Field>
        <Field
          label="Delay reason"
          htmlFor="call-reason"
          error={errors.delayReason}
        >
          <select
            id="call-reason"
            className={inputClass}
            value={values.delayReason}
            onChange={(e) => set('delayReason', e.target.value as DelayReason)}
          >
            {DELAY_REASONS.map((reason) => (
              <option key={reason} value={reason}>
                {humanize(reason)}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {submitError && (
        <p role="alert" className="text-sm text-red-600">
          {submitError}
        </p>
      )}

      <button type="submit" disabled={saving} className={primaryButtonClass}>
        {saving ? 'Saving…' : 'Log port call'}
      </button>
    </form>
  );
}
