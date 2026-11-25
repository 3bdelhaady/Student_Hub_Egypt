import { z } from 'zod';
import { safeMediaUrl } from './policy';
export const menuItemInput = z.object({
  id: z.string().min(1).max(100),
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000).default(''),
  category: z.string().trim().max(80).default(''),
  priceMinor: z.number().int().min(0).max(100000000),
  imageUrl: z.string().max(1500).refine(safeMediaUrl).default(''),
  available: z.boolean().default(true),
});
export const restaurantInput = z
  .object({
    logo: z.string().default(''),
    cover: z.string().default(''),
    open: z.enum(['', 'open', 'closed']).default(''),
    delivery: z.enum(['', 'yes', 'no']).default(''),
    hours: z.string().trim().max(200).default(''),
    opensAt: z
      .string()
      .regex(/^$|^([01]\d|2[0-3]):[0-5]\d$/)
      .default(''),
    closesAt: z
      .string()
      .regex(/^$|^([01]\d|2[0-3]):[0-5]\d$/)
      .default(''),
    mapUrl: z.string().max(1500).refine(safeMediaUrl).default(''),
    phone: z
      .string()
      .max(30)
      .regex(/^[+0-9 ()-]*$/)
      .default(''),
    website: z.string().max(1500).refine(safeMediaUrl).default(''),
    menu: z.array(menuItemInput).max(100).default([]),
  })
  .superRefine((v, c) => {
    if (new Set(v.menu.map((i) => i.id)).size !== v.menu.length)
      c.addIssue({ code: 'custom', message: 'duplicate menu id' });
  });
export type RestaurantDetails = z.infer<typeof restaurantInput>;
export function restaurantDetails(v: unknown): RestaurantDetails {
  const p = restaurantInput.safeParse(v);
  return p.success ? p.data : restaurantInput.parse({});
}
export function restaurantFromForm(f: FormData) {
  return restaurantInput.parse({
    open: f.get('restaurantOpen') || '',
    delivery: f.get('restaurantDelivery') || '',
    hours: f.get('restaurantHours') || '',
    mapUrl: f.get('restaurantMapUrl') || '',
    phone: f.get('restaurantPhone') || '',
    website: f.get('restaurantWebsite') || '',
    menu: JSON.parse(String(f.get('restaurantMenu') || '[]')),
  });
}
export const cartInput = z
  .array(z.object({ id: z.string().min(1).max(100), quantity: z.number().int().min(1).max(99) }))
  .min(1)
  .max(100)
  .superRefine((v, c) => {
    if (new Set(v.map((i) => i.id)).size !== v.length)
      c.addIssue({ code: 'custom', message: 'duplicate item' });
  });
export function priceCart(menu: RestaurantDetails['menu'], raw: unknown) {
  const cart = cartInput.parse(raw);
  return cart.map((row) => {
    const item = menu.find((i) => i.id === row.id && i.available);
    if (!item) throw Error('menu item unavailable');
    return {
      id: item.id,
      title: item.title,
      quantity: row.quantity,
      unitPriceMinor: item.priceMinor,
    };
  });
}

export function restaurantHours(r: RestaurantDetails) {
  return r.opensAt && r.closesAt ? r.opensAt + ' - ' + r.closesAt : r.hours;
}
