import { test } from 'node:test';
import assert from 'node:assert/strict';
import { housingDetails } from '../src/modules/portal/housing';
import { restaurantDetails } from '../src/modules/portal/restaurants';
test('catalog structured fields accept hosted artwork and preserve real values', () => {
  const h = housingDetails({
    type: 'room',
    rooms: 3,
    gallery: ['https://student-hub-egypt.vercel.app/catalog/housing.svg'],
  });
  assert.equal(h.rooms, 3);
  const r = restaurantDetails({
    open: 'open',
    menu: [
      {
        id: 'm',
        title: 'وجبة غداء',
        priceMinor: 12500,
        imageUrl: 'https://student-hub-egypt.vercel.app/catalog/meal.svg',
      },
    ],
  });
  assert.equal(r.menu.length, 1);
  assert.equal(r.open, 'open');
});
