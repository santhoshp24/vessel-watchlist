import { useState } from 'react';

import { VESSEL_TYPES, humanize } from '@/domain/constants';
import type { VesselInput, VesselType } from '@/domain/types';
import {
  validateVessel,
  type FieldErrors,
  type VesselField,
  type VesselFormValues,
} from '@/domain/validation';

import { Field } from './Field';
import { cardClass, inputClass, primaryButtonClass } from './styles';

const EMPTY: VesselFormValues = {
  imo: '',
  name: '',
  vesselType: 'container',
  flag: '',
};

interface VesselFormProps {
  /** Resolves to an error message, or `null` when the vessel was saved. */
  onSubmit: (input: VesselInput) => Promise<string | null>;
}

export function VesselForm({ onSubmit }: VesselFormProps) {
  const [values, setValues] = useState<VesselFormValues>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors<VesselField>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof VesselFormValues>(
    key: K,
    value: VesselFormValues[K]
  ) => setValues((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);

    const result = validateVessel(values);
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
      <h2 className="text-sm font-semibold text-slate-900">Add a vessel</h2>

      <Field label="IMO number" htmlFor="vessel-imo" error={errors.imo}>
        <input
          id="vessel-imo"
          className={inputClass}
          inputMode="numeric"
          maxLength={7}
          value={values.imo}
          onChange={(e) => set('imo', e.target.value)}
          placeholder="7 digits"
        />
      </Field>

      <Field label="Vessel name" htmlFor="vessel-name" error={errors.name}>
        <input
          id="vessel-name"
          className={inputClass}
          maxLength={100}
          value={values.name}
          onChange={(e) => set('name', e.target.value)}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Type" htmlFor="vessel-type" error={errors.vesselType}>
          <select
            id="vessel-type"
            className={inputClass}
            value={values.vesselType}
            onChange={(e) => set('vesselType', e.target.value as VesselType)}
          >
            {VESSEL_TYPES.map((type) => (
              <option key={type} value={type}>
                {humanize(type)}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Flag (optional)" htmlFor="vessel-flag" error={errors.flag}>
          <input
            id="vessel-flag"
            className={inputClass}
            maxLength={60}
            value={values.flag}
            onChange={(e) => set('flag', e.target.value)}
          />
        </Field>
      </div>

      {submitError && (
        <p role="alert" className="text-sm text-red-600">
          {submitError}
        </p>
      )}

      <button type="submit" disabled={saving} className={primaryButtonClass}>
        {saving ? 'Adding…' : 'Add to watchlist'}
      </button>
    </form>
  );
}
