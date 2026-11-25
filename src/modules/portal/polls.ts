export type PollTiming = { capacity: number | null; startsAt: Date | null; closesAt: Date | null };
export function pollPhase(entry: PollTiming, now = new Date()): 'open' | 'upcoming' | 'closed' {
  if (entry.capacity === 0 || (entry.closesAt && entry.closesAt <= now)) return 'closed';
  if (entry.startsAt && entry.startsAt > now) return 'upcoming';
  return 'open';
}
export function pollResults(
  options: { id: string; label: string }[],
  counts: { optionId: string; total: number }[],
) {
  const rows = options.map((option) => ({
    ...option,
    votes: Math.max(0, counts.find((count) => count.optionId === option.id)?.total || 0),
  }));
  const total = rows.reduce((sum, row) => sum + row.votes, 0);
  return {
    total,
    rows: rows.map((row) => ({
      ...row,
      percentage: total ? Math.round((row.votes / total) * 100) : 0,
    })),
  };
}
