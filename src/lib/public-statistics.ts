type University = { id: string; name: string };
export function universityDistribution(
  universities: University[],
  items: { universityId: string }[],
) {
  return universities.map((university) => ({
    id: university.id,
    name: university.name,
    count: items.filter((item) => item.universityId === university.id).length,
  }));
}

export function chartGroups(rows: { id: string; name: string; count: number }[]) {
  const sorted = [...rows].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'ar'));
  if (sorted.length <= 6) return sorted;
  return [
    ...sorted.slice(0, 5),
    {
      id: '__other',
      name: 'جامعات أخرى',
      count: sorted.slice(5).reduce((n, row) => n + row.count, 0),
    },
  ];
}
