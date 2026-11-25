import { z } from 'zod';
import { safeMediaUrl } from './policy';
const optionalCount = z
  .union([z.literal(''), z.coerce.number().int().min(0).max(10000)])
  .transform((v) => (v === '' ? null : v))
  .nullable()
  .default(null);
const amount = z.coerce.number().min(0).max(1000000).default(0);
export const housingInput = z.object({
  type: z.enum(['', 'apartment', 'room', 'bed', 'studio', 'villa']).default(''),
  audience: z.enum(['', 'male', 'female', 'all']).default(''),
  rooms: optionalCount,
  beds: optionalCount,
  residents: optionalCount,
  furnished: z.enum(['', 'yes', 'no']).default(''),
  cooling: z.enum(['', 'yes', 'no']).default(''),
  water: z.boolean().default(false),
  gas: z.boolean().default(false),
  electricity: z.boolean().default(false),
  wifi: z.boolean().default(false),
  deposit: amount,
  serviceFee: amount,
  mapUrl: z.string().max(1500).refine(safeMediaUrl).default(''),
  gallery: z
    .array(
      z
        .string()
        .max(1500)
        .refine((v) => !!v && safeMediaUrl(v)),
    )
    .max(8)
    .default([]),
});
export type HousingDetails = z.infer<typeof housingInput>;
export function housingDetails(value: unknown): HousingDetails {
  const p = housingInput.safeParse(value);
  return p.success ? p.data : housingInput.parse({});
}
export function housingFromForm(form: FormData) {
  return housingInput.parse({
    type: form.get('housingType') || '',
    audience: form.get('housingAudience') || '',
    rooms: form.get('housingRooms') || '',
    beds: form.get('housingBeds') || '',
    residents: form.get('housingResidents') || '',
    furnished: form.get('housingFurnished') || '',
    cooling: form.get('housingCooling') || '',
    water: form.get('housingWater') === 'on',
    gas: form.get('housingGas') === 'on',
    electricity: form.get('housingElectricity') === 'on',
    wifi: form.get('housingWifi') === 'on',
    deposit: form.get('housingDeposit') || 0,
    serviceFee: form.get('housingServiceFee') || 0,
    mapUrl: form.get('housingMapUrl') || '',
    gallery: String(form.get('housingGallery') || '')
      .split('\n')
      .map((v) => v.trim())
      .filter(Boolean),
  });
}
export const housingTypes: Record<string, string> = {
  apartment: 'شقة',
  room: 'غرفة',
  bed: 'سرير',
  studio: 'استوديو',
  villa: 'فيلا',
};
export const housingAudiences: Record<string, string> = {
  male: 'طلاب',
  female: 'طالبات',
  all: 'للجميع',
};
