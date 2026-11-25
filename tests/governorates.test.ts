import test from 'node:test';
import assert from 'node:assert/strict';
import { governorateMatches, governorates } from '../src/modules/institution/governorates';
test('physical institution coverage is exact and unknown locations never match', () => {
  assert.equal(governorates.length, 27);
  assert.equal(governorateMatches('قنا', 'قنا'), true);
  assert.equal(governorateMatches('قنا', 'الأقصر'), false);
  for (const g of ['', null, undefined]) assert.equal(governorateMatches(g, g), false);
});
