import Link from 'next/link';
import { db } from '@/db';
import { portalRequests } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { applicationProfile } from '@/modules/portal/application-profile';
import { submitPortalRequest } from '@/modules/portal/actions';
import { studentLoginPath } from '@/modules/shared/return-path';
import type { viewer as readViewer } from '@/lib/session';
import type { Opportunity } from '@/modules/portal/opportunities';
import { ActionForm } from './portal-forms';
export async function OpportunityApplication({
  opportunity,
  viewer,
}: {
  opportunity: Opportunity;
  viewer: Awaited<ReturnType<typeof readViewer>>;
}) {
  const href = '/services?kind=service&opportunity=' + opportunity.id + '&apply=' + opportunity.id;
  if (!viewer)
    return (
      <Link className="button primary" href={studentLoginPath(href)}>
        سجل الدخول لمراجعة بيانات التقديم
      </Link>
    );
  const profile = await applicationProfile(viewer.user.id);
  const subject = 'تقديم: ' + opportunity.title;
  const [existing] = await db
    .select({ id: portalRequests.id })
    .from(portalRequests)
    .where(
      and(
        eq(portalRequests.userId, viewer.user.id),
        opportunity.demo
          ? eq(portalRequests.subject, subject)
          : eq(portalRequests.entryId, opportunity.id),
        sql`${portalRequests.status} IN ('pending','reviewing','accepted')`,
      ),
    )
    .limit(1);
  if (existing)
    return (
      <Link className="button primary" href={'/requests/' + existing.id}>
        متابعة طلب التقديم
      </Link>
    );
  const recipient = opportunity.demo ? 'إدارة المنصة' : 'مسؤول الفرصة داخل المنصة';
  return (
    <section className="opportunity-application" aria-label="مراجعة بيانات التقديم">
      <h3>راجع بياناتك قبل الإرسال</h3>
      <p>
        المستلم: {recipient}، طلب للمراجعة اليدوية داخل المنصة فقط، لا يُرسل إلى شركة أو جهة خارجية،
        ولا يضمن قبولًا.
      </p>
      <dl>
        {profile.fields.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <Link className="text-link" href="/profile?edit=details">
        تعديل بياناتي قبل التقديم
      </Link>
      <ActionForm
        action={submitPortalRequest}
        label="تأكيد إرسال بياناتي للتقديم"
        nextHref="/requests"
        nextLabel="متابعة طلباتي"
      >
        <input type="hidden" name="opportunityId" value={opportunity.id} />
        {!opportunity.demo && <input type="hidden" name="entryId" value={opportunity.id} />}
        <input type="hidden" name="subject" value={subject.slice(0, 160)} />
        <input type="hidden" name="quantity" value="1" />
        <input type="hidden" name="profileDigest" value={profile.digest} />
        <label>
          رسالة التقديم
          <textarea
            name="body"
            required
            minLength={10}
            maxLength={4000}
            placeholder="اكتب نبذة عنك وسبب اهتمامك بالفرصة"
          />
        </label>
        <label className="checkbox">
          <input name="applicationConsent" type="checkbox" required />
          أوافق على إرسال البيانات المعروضة ورسالة التقديم إلى {recipient} لمراجعة هذا الطلب.
        </label>
      </ActionForm>
    </section>
  );
}
