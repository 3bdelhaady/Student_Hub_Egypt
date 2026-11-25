import { z } from 'zod';
import { normalizeExternalUrl } from '@/modules/shared/url';
export const personalResourceInput = z
  .object({
    title: z.string().trim().min(2).max(160),
    body: z.string().trim().max(12000).default(''),
    url: z.string().trim().max(2000).default(''),
  })
  .superRefine((value, context) => {
    if (value.url && !normalizeExternalUrl(value.url))
      context.addIssue({ code: 'custom', path: ['url'], message: 'https' });
    if (!value.body && !value.url)
      context.addIssue({ code: 'custom', path: ['body'], message: 'empty resource' });
  })
  .transform((value) => ({ ...value, url: normalizeExternalUrl(value.url) || '' }));
export const personalCourseInput = z.object({
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(4000),
  status: z.enum(['active', 'draft']),
});
export function personalProgress(completed: number, total: number) {
  return total > 0 ? Math.round((Math.min(total, Math.max(0, completed)) / total) * 100) : 0;
}
