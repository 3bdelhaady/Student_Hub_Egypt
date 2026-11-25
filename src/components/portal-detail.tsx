import { withInstitutionRestaurant } from '@/modules/institution/restaurant-info';
import { ticketTypes, ticketTiers } from '@/modules/portal/tickets';
import { HousingGallery } from './housing-gallery';
import { RestaurantDetail } from './restaurant-detail';
import { HousingDetail } from './housing-detail';
import { ProductIcon } from './product-icon';
import { ReviewDemoNotice } from './review-demo-notice';
import Link from 'next/link';
import { VolunteerDetail } from './volunteer-detail';
import { AcademicTeamDetail } from './academic-team-detail';
import { PollBallot } from './poll-ballot';
import { studentLoginPath } from '@/modules/shared/return-path';
import { notFound } from 'next/navigation';
import { db } from '@/db';
import {
  institutions,
  portalEntries,
  portalRequests,
  portalSaved,
  pollOptions,
  pollVotes,
} from '@/db/schema';
import { eq, and, sql, desc, inArray, asc } from 'drizzle-orm';
import { viewer, studentAreaViewer } from '@/lib/session';
import { activeStudentEntryScope } from '@/modules/portal/queries';
import {
  canStudentReadEntry,
  entryLabels,
  commerceKinds,
  requestStatuses,
} from '@/modules/portal/policy';
import { RequestForm, SaveEntryButton } from './portal-forms';
import { ArrowRight, MapPin, CalendarDays, Package } from 'lucide-react';
import { money } from './portal-catalog';
export async function PortalDetail({ id, service = false }: { id: string; service?: boolean }) {
  await studentAreaViewer();
  const [e] = await db.select().from(portalEntries).where(eq(portalEntries.id, id)).limit(1);
  const v = await viewer();
  if (
    !e ||
    !canStudentReadEntry(v?.membership, e, await activeStudentEntryScope(e, v?.membership)) ||
    commerceKinds.includes(e.kind) === service
  )
    notFound();
  const root = service ? '/services' : '/store';
  const saved = v
    ? await db
        .select()
        .from(portalSaved)
        .where(and(eq(portalSaved.userId, v.user.id), eq(portalSaved.entryId, id)))
        .limit(1)
    : [];
  const options =
    e.kind === 'poll'
      ? await db
          .select()
          .from(pollOptions)
          .where(eq(pollOptions.entryId, id))
          .orderBy(asc(pollOptions.label), asc(pollOptions.id))
      : [];
  const votes =
    e.kind === 'poll'
      ? await db
          .select({ optionId: pollVotes.optionId, total: sql<number>`count(*)::int` })
          .from(pollVotes)
          .where(eq(pollVotes.entryId, id))
          .groupBy(pollVotes.optionId)
      : [];
  const [mine] =
    v && e.kind === 'poll'
      ? await db
          .select({ optionId: pollVotes.optionId })
          .from(pollVotes)
          .where(and(eq(pollVotes.entryId, id), eq(pollVotes.userId, v.user.id)))
          .limit(1)
      : [];
  const [activeRequest] =
    v && e.kind !== 'poll'
      ? await db
          .select({
            id: portalRequests.id,
            status: portalRequests.status,
            reference: portalRequests.reference,
          })
          .from(portalRequests)
          .where(
            and(
              eq(portalRequests.userId, v.user.id),
              eq(portalRequests.entryId, id),
              inArray(portalRequests.status, ['pending', 'reviewing', 'accepted']),
            ),
          )
          .orderBy(desc(portalRequests.createdAt))
          .limit(1)
      : [];
  const closed = e.capacity === 0 || (!!e.closesAt && e.closesAt <= new Date());
  if (e.kind === 'restaurant') {
    const [institution] = await db
      .select()
      .from(institutions)
      .where(eq(institutions.id, e.institutionId))
      .limit(1);
    return (
      <RestaurantDetail
        entry={withInstitutionRestaurant(e, institution?.restaurantInfo, institution?.website)}
        signedIn={!!v}
      />
    );
  }
  if (e.kind === 'housing')
    return (
      <HousingDetail
        entry={e}
        signedIn={!!v}
        saved={!!saved.length}
        activeRequest={activeRequest}
      />
    );
  if (e.kind === 'volunteer')
    return (
      <VolunteerDetail
        entry={e}
        signedIn={!!v}
        saved={!!saved.length}
        activeRequest={activeRequest}
      />
    );
  if (e.kind === 'team')
    return (
      <AcademicTeamDetail
        entry={e}
        signedIn={!!v}
        saved={!!saved.length}
        activeRequest={activeRequest}
      />
    );
  if (e.kind === 'poll')
    return (
      <section className="student-voice">
        {e.demo && <ReviewDemoNotice />}
        <div className="breadcrumbs">
          <Link href="/services?kind=poll">
            <ArrowRight size={15} />
            صوت الطلاب
          </Link>
          <span>{e.title}</span>
        </div>
        <h1 className="sr-only">{e.title}</h1>
        <PollBallot
          entry={e}
          options={options}
          counts={votes}
          mine={mine?.optionId}
          signedIn={!!v}
          eligible={v?.membership?.status === 'active'}
          returnPath={'/services/' + e.id}
        />
        {v && (
          <div className="student-voice-tools">
            <SaveEntryButton id={e.id} saved={!!saved.length} />
          </div>
        )}
      </section>
    );

  return (
    <section className="portal-screen">
      {e.demo && <ReviewDemoNotice />}
      <div className="breadcrumbs">
        <Link href={`${root}?kind=${e.kind}`}>
          <ArrowRight size={15} />
          {entryLabels[e.kind]}
        </Link>
        <span>{e.title}</span>
      </div>
      <div className="portal-detail-grid">
        <div>
          <div className={'portal-detail-art ' + (!e.imageUrl ? 'no-image' : '')}>
            {e.imageUrls.length > 1 ? (
              <HousingGallery images={e.imageUrls} title={e.title} />
            ) : e.imageUrl ? (
              <img src={e.imageUrl} alt={e.title} />
            ) : e.kind === 'product' ? (
              <ProductIcon title={e.title} size={100} />
            ) : (
              <Package size={80} />
            )}
          </div>
          <div className="portal-form-section">
            <span className="tag">{e.category || entryLabels[e.kind]}</span>
            <h1>{e.title}</h1>
            {e.kind === 'ticket' && e.ticketType && (
              <span className="tag">
                {ticketTypes[e.ticketType as keyof typeof ticketTypes] || 'فعالية'}
              </span>
            )}
            <div className="portal-meta">
              {e.location && (
                <span>
                  <MapPin size={17} />
                  {e.location}
                </span>
              )}
              {e.startsAt && (
                <span>
                  <CalendarDays size={17} />
                  {e.startsAt.toLocaleString('ar-EG', {
                    timeZone: 'Africa/Cairo',
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              )}
            </div>
            {e.kind === 'service' && (
              <>
                <p>{e.provider}</p>
                <span className="tag">
                  {e.opportunityType === 'job'
                    ? 'وظيفة'
                    : e.opportunityType === 'internship'
                      ? 'تدريب'
                      : e.opportunityType === 'scholarship'
                        ? 'منحة'
                        : 'طلب سابق'}
                </span>
              </>
            )}
            {e.kind === 'ticket' && (
              <section>
                <h2>أنواع التذاكر</h2>
                {ticketTiers(e.ticketTiers, e.priceMinor).map((t) => (
                  <article key={t.id}>
                    <h3>{t.title}</h3>
                    <p>{t.description}</p>
                    <strong>{money(t.priceMinor)}</strong>
                  </article>
                ))}
              </section>
            )}
            <h2>التفاصيل</h2>
            <div className="prose">{e.description}</div>
            {e.kind === 'service' && e.requirements && (
              <>
                <h2>الشروط والمتطلبات</h2>
                <div className="prose">{e.requirements}</div>
              </>
            )}
            {e.kind === 'service' && (
              <p>
                التقديم هنا طلب خاص يراجعه المسؤول داخل المنصة، وليس إرسالًا تلقائيًا إلى جهة خارجية
                أو ضمان قبول.
              </p>
            )}
          </div>
        </div>
        <aside className="portal-detail-aside">
          <div className="portal-form-section">
            <h2>{commerceKinds.includes(e.kind) ? 'تفاصيل الطلب' : 'التقديم والمتابعة'}</h2>
            <strong className="portal-price">
              {e.priceMinor ? money(e.priceMinor) : 'بدون رسوم منشورة'}
            </strong>
            {e.capacity !== null && (
              <p>{e.capacity === 0 ? 'اكتمل العدد' : `${e.capacity} متاح`}</p>
            )}
            {e.closesAt && (
              <p>
                آخر موعد:{' '}
                {e.closesAt.toLocaleString('ar-EG', {
                  timeZone: 'Africa/Cairo',
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
            )}
            {v && <SaveEntryButton id={id} saved={!!saved.length} />}
            <Link href="/requests" className="button secondary">
              متابعة طلباتي
            </Link>
          </div>
          {e.kind !== 'poll' &&
            (activeRequest ? (
              <div className="portal-form-section active-request-notice">
                <h2>لديك طلب قيد المتابعة</h2>
                <p dir="ltr">{activeRequest.reference}</p>
                <p>
                  الحالة: {requestStatuses[activeRequest.status]}، تابع الطلب الحالي بدل إرسال طلب
                  مكرر.
                </p>
                <Link className="button primary" href={'/requests/' + activeRequest.id}>
                  متابعة هذا الطلب
                </Link>
              </div>
            ) : closed ? (
              <div className="portal-form-section">
                <h2>التقديم مغلق</h2>
                <p>راجع الخدمات الأخرى المتاحة.</p>
              </div>
            ) : (
              <div className="portal-form-section">
                {v && commerceKinds.includes(e.kind) ? (
                  <Link href={'/store/' + e.id + '/checkout'} className="button primary">
                    دفع وإتمام عملية الشراء
                  </Link>
                ) : v ? (
                  <RequestForm
                    entry={{
                      id: e.id,
                      kind: e.kind,
                      title: e.title,
                      priceMinor: e.priceMinor,
                      capacity: e.capacity,
                    }}
                  />
                ) : (
                  <Link href={studentLoginPath(`${root}/${id}`)} className="button primary">
                    تسجيل الدخول لإرسال طلب
                  </Link>
                )}
              </div>
            ))}
        </aside>
      </div>
    </section>
  );
}
