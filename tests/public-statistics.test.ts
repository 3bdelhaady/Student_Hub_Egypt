import test from 'node:test';
import assert from 'node:assert/strict';
import { universityDistribution, chartGroups } from '../src/lib/public-statistics';
test('public chart data counts only the supplied content and preserves zeroes', () => {
  assert.deepEqual(
    universityDistribution(
      [
        { id: 'a', name: 'أ' },
        { id: 'b', name: 'ب' },
      ],
      [{ universityId: 'b' }, { universityId: 'b' }],
    ),
    [
      { id: 'a', name: 'أ', count: 0 },
      { id: 'b', name: 'ب', count: 2 },
    ],
  );
  assert.deepEqual(universityDistribution([], []), []);
});
test('chart aggregation keeps exact totals without fake bars or losing smaller groups', () => {
  const input = Array.from({ length: 9 }, (_, i) => ({ id: String(i), name: String(i), count: i }));
  const before = JSON.stringify(input);
  const output = chartGroups(input);
  assert.equal(output.length, 6);
  assert.equal(output.at(-1)?.name, 'جامعات أخرى');
  assert.equal(
    output.reduce((n, row) => n + row.count, 0),
    36,
  );
  assert.equal(JSON.stringify(input), before);
  assert.deepEqual(chartGroups([]), []);
  assert.equal(chartGroups([{ id: 'z', name: 'zero', count: 0 }])[0].count, 0);
});
