export function rosterCsv(headers: string[], rows: (string | null)[][]) {
  const cell = (v: string | null) =>
    '"' +
    String(v ?? '')
      .replace(/^(?:\s*[=+@-]|[\t\r])/u, "'$&")
      .replaceAll('"', '""') +
    '"';
  return '\uFEFF' + [headers, ...rows].map((row) => row.map(cell).join(',')).join('\r\n');
}
export function teamRosterCsv(rows: { team: string; name: string; studentCode: string | null }[]) {
  return rosterCsv(
    ['الفريق', 'اسم الطالب', 'كود الطالب'],
    rows.map((r) => [r.team, r.name, r.studentCode]),
  );
}
