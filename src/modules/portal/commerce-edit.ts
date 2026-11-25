'use server';
import { reportFailure } from '@/lib/diagnostics';
import { housingFromForm } from './housing';
import { restaurantFromForm, restaurantDetails } from './restaurants';
import { ticketTypes, ticketTiersInput } from './tickets';
import { db } from '@/db';
import { portalEntries, portalEntryImages, institutionAgents } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireViewer } from '@/lib/session';
import { canManagePortalEntry, activeEntryScope } from './queries';
import { canEditPortal } from './management-policy';
import { hasSectionRight } from '../institution/section-policy';
import { socialMediaSignature } from '../social/media';
import { refresh, type FormState } from '../shared/form-state';
export async function saveCommerceItem(_: FormState, form: FormData): Promise<FormState> {
  const v = await requireViewer();
  try {
    const title = String(form.get('title') || '').trim(),
      description = String(form.get('description') || '').trim(),
      rawPrice = Number(form.get('price')),
      kind = String(form.get('kind') || ''),
      id = String(form.get('id') || '');
    const ticketType = String(form.get('ticketType') || '');
    const tiers =
      kind === 'ticket'
        ? ticketTiersInput.parse(JSON.parse(String(form.get('ticketTiers') || '[]')))
        : [];
    if (kind === 'ticket' && !(ticketType in ticketTypes)) throw Error();
    const price = tiers.length ? Math.min(...tiers.map((t) => t.priceMinor)) / 100 : rawPrice;
    if (
      title.length < 2 ||
      title.length > 160 ||
      description.length < 10 ||
      description.length > 12000 ||
      !Number.isFinite(price) ||
      price < 0 ||
      price > 1000000 ||
      !['product', 'housing', 'restaurant', 'ticket'].includes(kind)
    )
      throw Error();
    const uploads = form.getAll('images').filter((x): x is File => x instanceof File && x.size > 0);
    if (uploads.length > 5 || uploads.reduce((n, f) => n + f.size, 0) > 3 * 1024 * 1024)
      throw Error();
    const bytes: { id: string; mimeType: string; data: string }[] = [];
    for (const f of uploads) {
      const b = Buffer.from(await f.arrayBuffer());
      if (
        !['image/png', 'image/jpeg', 'image/webp'].includes(f.type) ||
        f.size > 600 * 1024 ||
        !socialMediaSignature(f.type, b)
      )
        throw Error();
      bytes.push({ id: crypto.randomUUID(), mimeType: f.type, data: b.toString('base64') });
    }
    await db.transaction(async (tx) => {
      const [a] = await tx
        .select()
        .from(institutionAgents)
        .where(eq(institutionAgents.userId, v.user.id))
        .for('share')
        .limit(1);
      if (!a || a.department !== 'private_sector') throw Error();
      const [old] = id
        ? await tx
            .select()
            .from(portalEntries)
            .where(eq(portalEntries.id, id))
            .for('update')
            .limit(1)
        : [];
      if (
        id &&
        (!old || old.archived || old.kind !== kind || !(await canManagePortalEntry(v, old, tx)))
      )
        throw Error();
      if (!canEditPortal(a, { ...a, kind, ticketType }, await activeEntryScope(a, tx)))
        throw Error();
      const publish = hasSectionRight(
        a,
        kind === 'ticket' && ticketType === 'trip' ? 'trip' : kind,
        'canPublish',
      );
      if (old?.published && !publish) throw Error();
      const existing = old?.imageUrls.length ? old.imageUrls : old?.imageUrl ? [old.imageUrl] : [];
      const kept = form.getAll('keepImage').map(String);
      if (
        new Set(kept).size !== kept.length ||
        kept.some((u) => !existing.includes(u)) ||
        kept.length + bytes.length > 5
      )
        throw Error();
      const entityId = old?.id || crypto.randomUUID(),
        urls = [...kept, ...bytes.map((b) => '/api/store/images/' + b.id)];
      const data = {
        title,
        description,
        priceMinor: Math.round(price * 100),
        ...(kind === 'ticket' ? { ticketType, ticketTiers: tiers } : {}),
        imageUrl: urls[0] || '',
        imageUrls: urls,
        ...(kind === 'housing'
          ? {
              location: String(form.get('location') || '')
                .trim()
                .slice(0, 300),
            }
          : {}),
        ...(kind === 'housing'
          ? {
              housingDetails: {
                ...housingFromForm(form),
                gallery: old?.housingDetails.gallery || [],
              },
            }
          : {}),
        ...(kind === 'restaurant'
          ? {
              restaurantDetails: {
                ...restaurantDetails(old?.restaurantDetails),
                menu: restaurantFromForm(form).menu,
              },
            }
          : {}),
        updatedAt: new Date(),
      };
      if (old) await tx.update(portalEntries).set(data).where(eq(portalEntries.id, old.id));
      else
        await tx.insert(portalEntries).values({
          ...data,
          id: entityId,
          institutionId: a.institutionId,
          department: 'private_sector',
          kind,
          ticketType,
          authorId: v.user.id,
          published: publish,
        });
      for (const b of bytes) await tx.insert(portalEntryImages).values({ ...b, entryId: entityId });
      const stored = await tx
        .select({ id: portalEntryImages.id })
        .from(portalEntryImages)
        .where(eq(portalEntryImages.entryId, entityId));
      for (const b of stored)
        if (!urls.includes('/api/store/images/' + b.id))
          await tx.delete(portalEntryImages).where(eq(portalEntryImages.id, b.id));
    });
    refresh();
    return { success: 'تم حفظ العنصر.' };
  } catch {
    reportFailure('modules.portal.commerce-edit');
    return {
      error: 'تعذر الحفظ. راجع الحقول، والحد الأقصى ٥ صور، ٦٠٠ كيلوبايت للصورة و٣ ميجابايت إجمالًا.',
    };
  }
}
