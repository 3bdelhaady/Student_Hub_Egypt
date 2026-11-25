import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pollPhase, pollResults } from '../src/modules/portal/polls';
const now = new Date('2026-11-22T08:00:00Z');
const entry = { capacity: null, startsAt: null, closesAt: null };
test('poll lifecycle closes capacity-zero and expired polls and holds future starts', () => {
  assert.equal(pollPhase(entry, now), 'open');
  assert.equal(pollPhase({ ...entry, capacity: 0 }, now), 'closed');
  assert.equal(pollPhase({ ...entry, closesAt: now }, now), 'closed');
  assert.equal(pollPhase({ ...entry, startsAt: new Date(+now + 1) }, now), 'upcoming');
  assert.equal(pollPhase({ ...entry, startsAt: now }, now), 'open');
  assert.equal(pollPhase({ ...entry, startsAt: new Date(+now + 1), closesAt: now }, now), 'closed');
});
test('poll results count only actual options, preserve zeroes and round without inventing votes', () => {
  const options = [
    { id: 'a', label: 'أ' },
    { id: 'b', label: 'ب' },
  ];
  assert.deepEqual(
    pollResults(options, []).rows.map((row) => row.percentage),
    [0, 0],
  );
  const result = pollResults(options, [
    { optionId: 'a', total: 2 },
    { optionId: 'b', total: 1 },
    { optionId: 'foreign', total: 500 },
  ]);
  assert.equal(result.total, 3);
  assert.deepEqual(
    result.rows.map((row) => row.percentage),
    [67, 33],
  );
  assert.deepEqual(
    pollResults(options, [
      { optionId: 'a', total: 1 },
      { optionId: 'b', total: 1 },
    ]).rows.map((row) => row.percentage),
    [50, 50],
  );
});
