import { z } from 'zod';
export const ticketTypes = {
  concert: 'حفلة غنائية',
  graduation: 'حفلة تخرج',
  standup: 'حفلة ستاند أب كوميدي',
  trip: 'رحلة',
} as const;
export const ticketTierInput = z.object({
  id: z.string().min(1).max(100),
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000),
  priceMinor: z.number().int().min(0).max(100000000),
});
export const ticketTiersInput = z
  .array(ticketTierInput)
  .min(1)
  .max(20)
  .refine((v) => new Set(v.map((t) => t.id)).size === v.length);
export type TicketTier = z.infer<typeof ticketTierInput>;
export function ticketTiers(value: unknown, priceMinor: number): TicketTier[] {
  const parsed = ticketTiersInput.safeParse(value);
  return parsed.success
    ? parsed.data
    : [{ id: 'standard', title: 'تذكرة عادية', description: '', priceMinor }];
}
export function priceTicket(value: unknown, priceMinor: number, tierId: string) {
  const tier = ticketTiers(value, priceMinor).find((t) => t.id === tierId);
  if (!tier) throw Error('ticket tier unavailable');
  return tier;
}
