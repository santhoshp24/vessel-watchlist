const DATE_TIME = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export function formatDateTime(date: Date | undefined): string {
  return date ? DATE_TIME.format(date) : '—';
}

/** "1 call", "2 calls". */
export function pluralize(
  count: number,
  singular: string,
  plural: string = `${singular}s`
): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
