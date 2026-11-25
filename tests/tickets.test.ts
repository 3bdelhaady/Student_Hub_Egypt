import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ticketTiers,
  ticketTiersInput,
  priceTicket,
  ticketTypes,
} from '../src/modules/portal/tickets';
test('ticket tiers validate unique IDs, prices and legacy fallback', () => {
  assert.equal(Object.keys(ticketTypes).length, 4);
  assert.equal(ticketTiers([], 5000)[0].priceMinor, 5000);
  const tiers = [
    { id: 'normal', title: 'عادية', description: 'دخول عادي', priceMinor: 5000 },
    { id: 'vip', title: 'مميزة', description: 'مقاعد مميزة', priceMinor: 10000 },
  ];
  assert.equal(priceTicket(tiers, 5000, 'vip').priceMinor, 10000);
  assert.throws(() => priceTicket(tiers, 5000, 'fake'));
  assert.equal(ticketTiersInput.safeParse([...tiers, tiers[0]]).success, false);
  assert.equal(ticketTiersInput.safeParse([{ ...tiers[0], priceMinor: -1 }]).success, false);
  assert.equal(ticketTiersInput.safeParse([]).success, false);
});
