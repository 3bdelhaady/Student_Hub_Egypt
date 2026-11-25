import { z } from 'zod';
import { revalidatePath } from 'next/cache';
export type FormState = { error?: string; success?: string };
export const text = (min = 2, max = 200) => z.string().trim().min(min).max(max);
export function refresh() {
  revalidatePath('/', 'layout');
}
export function fail(): FormState {
  return { error: 'تعذر حفظ التغييرات، تحقق من الحقول والصلاحيات ثم حاول مرة أخرى.' };
}
