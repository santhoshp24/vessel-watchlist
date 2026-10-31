import { useState } from 'react';

import type { NoteInput, NoteRecord } from '@/domain/types';
import { validateNote, type FieldErrors, type NoteField } from '@/domain/validation';
import { formatDateTime } from '@/lib/format';

import { Field } from './Field';
import { cardClass, inputClass, primaryButtonClass } from './styles';

interface NotesPanelProps {
  notes: readonly NoteRecord[];
  onAdd: (input: NoteInput) => Promise<string | null>;
  onDelete: (id: string) => void;
}

export function NotesPanel({ notes, onAdd, onDelete }: NotesPanelProps) {
  const [body, setBody] = useState('');
  const [tag, setTag] = useState('');
  const [errors, setErrors] = useState<FieldErrors<NoteField>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);

    const result = validateNote({ body, tag });
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});

    const message = await onAdd(result.value);
    if (message) {
      setSubmitError(message);
    } else {
      setBody('');
      setTag('');
    }
  };

  return (
    <section className={`${cardClass} p-4`}>
      <h3 className="mb-3 text-sm font-semibold text-slate-900">Notes</h3>

      {notes.length === 0 ? (
        <p className="mb-4 text-sm text-slate-400">No notes yet.</p>
      ) : (
        <ul className="mb-4 space-y-2">
          {notes.map((note) => (
            <li
              key={note.id}
              className="group rounded-lg bg-slate-50 px-3 py-2 text-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="whitespace-pre-wrap text-slate-800">{note.body}</p>
                <button
                  onClick={() => onDelete(note.id)}
                  className="text-xs text-slate-400 opacity-0 transition-opacity hover:text-red-600 focus:opacity-100 group-hover:opacity-100"
                  aria-label="Delete note"
                >
                  Delete
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {formatDateTime(note.createdAt)}
                {note.tag && (
                  <span className="ml-2 rounded-full bg-teal-50 px-2 py-0.5 text-teal-700">
                    {note.tag}
                  </span>
                )}
              </p>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3" noValidate>
        <Field label="Add a note" htmlFor="note-body" error={errors.body}>
          <textarea
            id="note-body"
            rows={2}
            maxLength={500}
            className={inputClass}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </Field>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Field label="Tag (optional)" htmlFor="note-tag" error={errors.tag}>
              <input
                id="note-tag"
                maxLength={40}
                className={inputClass}
                value={tag}
                onChange={(e) => setTag(e.target.value)}
              />
            </Field>
          </div>
          <button type="submit" className={primaryButtonClass}>
            Add note
          </button>
        </div>
        {submitError && (
          <p role="alert" className="text-sm text-red-600">
            {submitError}
          </p>
        )}
      </form>
    </section>
  );
}
