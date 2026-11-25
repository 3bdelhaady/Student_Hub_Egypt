import { ReviewDemoNotice } from './review-demo-notice';
import Link from 'next/link';
import { ArrowRight, HeartHandshake } from 'lucide-react';
import { and, asc, eq } from 'drizzle-orm';
import { db } from '@/db';
import {
  institutions,
  studentOrganizations,
  volunteerDivisions,
  volunteerRequestChoices,
} from '@/db/schema';
import type { PortalEntry } from '@/modules/portal/queries';
import { SaveEntryButton } from './portal-forms';
import { VolunteerApplicationPanel } from './volunteer-application-panel';
export async function VolunteerDetail({
  entry,
  signedIn,
  saved,
  activeRequest,
}: {
  entry: PortalEntry;
  signedIn: boolean;
  saved: boolean;
  activeRequest?: { id: string; reference: string; status: string };
}) {
  const divisions = await db
    .select()
    .from(volunteerDivisions)
    .where(and(eq(volunteerDivisions.entryId, entry.id), eq(volunteerDivisions.active, true)))
    .orderBy(asc(volunteerDivisions.position), asc(volunteerDivisions.id));
  const [institution] = await db
    .select({ name: institutions.name })
    .from(institutions)
    .where(eq(institutions.id, entry.institutionId))
    .limit(1);
  const [organization] = entry.organizationId
    ? await db
        .select({ name: studentOrganizations.name })
        .from(studentOrganizations)
        .where(eq(studentOrganizations.id, entry.organizationId))
        .limit(1)
    : [];
  const [choice] = activeRequest
    ? await db
        .select()
        .from(volunteerRequestChoices)
        .where(eq(volunteerRequestChoices.requestId, activeRequest.id))
        .limit(1)
    : [];
  return (
    <section className="volunteering volunteer-detail">
      {entry.demo && <ReviewDemoNotice />}
      <div className="breadcrumbs">
        <Link href={'/services?kind=volunteer&volunteer=' + encodeURIComponent(entry.id)}>
          <ArrowRight size={16} />
          الأنشطة التطوعية
        </Link>
        <span>{entry.title}</span>
      </div>
      <div className="volunteer-layout">
        <article className="volunteer-panel volunteer-description">
          {entry.imageUrl ? (
            <img className="volunteer-detail-image" src={entry.imageUrl} alt="" />
          ) : (
            <HeartHandshake size={45} />
          )}
          <h1>{entry.title}</h1>
          <p className="volunteer-info">{organization?.name || institution?.name}</p>
          <h2>عن الفرصة</h2>
          <div className="prose">{entry.description}</div>
          {entry.category && <p>التصنيف: {entry.category}</p>}
          {signedIn && <SaveEntryButton id={entry.id} saved={saved} />}
        </article>
        <VolunteerApplicationPanel
          entry={entry}
          divisions={divisions}
          signedIn={signedIn}
          returnPath={'/services/' + entry.id}
          activeRequest={activeRequest}
          selectedDivision={choice?.divisionLabel}
        />
      </div>
    </section>
  );
}
