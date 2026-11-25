// A datetime-local control on this portal represents Cairo time, never the server's zone.
export function cairoDate(value: string): Date | null {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error('invalid date');
  const target = new Date(value + 'Z');
  if (!Number.isFinite(+target)) throw new Error('invalid date');
  let result = new Date(+target);
  const format = (d: Date) =>
    new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Africa/Cairo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .format(d)
      .replace(' ', 'T');
  for (let i = 0; i < 3; i++) {
    const local = new Date(format(result) + 'Z');
    result = new Date(+result + (+target - +local));
  }
  if (format(result) !== value) throw new Error('nonexistent local date');
  return result;
}

export function cairoInput(value: Date | null | undefined): string {
  if (!value) return '';
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
    .format(value)
    .replace(' ', 'T');
}
