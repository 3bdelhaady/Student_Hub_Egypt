import { test } from 'node:test';
import assert from 'node:assert/strict';
import { housingInput, housingDetails } from '../src/modules/portal/housing';
import { restaurantInput, priceCart } from '../src/modules/portal/restaurants';
import { canStudentReadEntry } from '../src/modules/portal/policy';
test('housing fields reject invalid counts, money and unsafe image or map links', () => {
  assert.equal(housingInput.safeParse({ rooms: -1 }).success, false);
  assert.equal(housingInput.safeParse({ deposit: -2 }).success, false);
  assert.equal(housingInput.safeParse({ mapUrl: 'javascript:alert(1)' }).success, false);
  assert.equal(
    housingInput.safeParse({ gallery: ['http://example.com/image.jpg'] }).success,
    false,
  );
  assert.equal(housingDetails({}).rooms, null);
  assert.equal(housingDetails({}).deposit, 0);
});
test('restaurant cart uses current menu prices, and rejects missing, unavailable or duplicate items', () => {
  const r = restaurantInput.parse({
    menu: [
      { id: 'a', title: 'Pizza', priceMinor: 15000 },
      { id: 'b', title: 'Drink', priceMinor: 2000, available: false },
    ],
  });
  assert.deepEqual(priceCart(r.menu, [{ id: 'a', quantity: 2, priceMinor: 1 }]), [
    { id: 'a', title: 'Pizza', quantity: 2, unitPriceMinor: 15000 },
  ]);
  for (const cart of [
    [],
    [{ id: 'b', quantity: 1 }],
    [{ id: 'other', quantity: 1 }],
    [
      { id: 'a', quantity: 1 },
      { id: 'a', quantity: 1 },
    ],
    [{ id: 'a', quantity: 100 }],
  ])
    assert.throws(() => priceCart(r.menu, cart));
  assert.throws(() => priceCart([], [{ id: 'a', quantity: 1 }]));
  assert.equal(
    restaurantInput.safeParse({
      menu: [
        { id: 'x', title: 'Food', priceMinor: 2 },
        { id: 'x', title: 'Food', priceMinor: 3 },
      ],
    }).success,
    false,
  );
});
test('hosted production rejects synthetic entries even with direct links', () => {
  const old = process.env.VERCEL;
  process.env.VERCEL = '1';
  try {
    assert.equal(
      canStudentReadEntry(
        undefined,
        {
          department: 'private_sector',
          universityId: null,
          facultyId: null,
          published: true,
          demo: true,
        },
        true,
      ),
      false,
    );
  } finally {
    if (old === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = old;
  }
});
