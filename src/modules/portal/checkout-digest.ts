import { createHash } from 'node:crypto';
import type { PortalEntry } from './queries';
export function checkoutDigest(
  e: Pick<PortalEntry, 'id' | 'priceMinor' | 'housingDetails' | 'restaurantDetails' | 'updatedAt'>,
) {
  return createHash('sha256')
    .update(
      JSON.stringify({
        id: e.id,
        price: e.priceMinor,
        housing: e.housingDetails,
        restaurant: e.restaurantDetails,
        updated: e.updatedAt.toISOString(),
      }),
    )
    .digest('hex');
}
