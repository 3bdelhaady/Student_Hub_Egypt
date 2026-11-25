import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cairoDate, cairoInput } from '../src/modules/shared/datetime';
test('Cairo datetime-local is zone independent and survives editing', () => {
  for (const local of ['2030-01-12T14:30', '2030-07-12T14:30']) {
    const date = cairoDate(local);
    assert.ok(date);
    assert.equal(cairoInput(date), local);
  }
  assert.equal(cairoDate('2030-01-12T14:30')?.toISOString(), '2030-01-12T12:30:00.000Z');
  assert.equal(cairoDate(''), null);
  assert.equal(cairoInput(null), '');
  assert.throws(() => cairoDate('2030-02-31T14:30'));
  assert.throws(() => cairoDate('2030-01-12T14:30Z'));
});
