import { AgentInstitutionCard } from './agent-institution-card';
import { TeamManagementDetail } from './team-management-detail';
import { CommerceItemForm } from './commerce-item-form';
import { TeamCourseManagement } from '@/components/team-course-management';
import { studentCourseScopeSql } from '@/modules/agent-academic/queries';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/db';
import {
  portalEntries,
  volunteerDivisions,
  courses,
  portalRequests,
  supportDestinations,
  institutions,
  faculties,
  studentOrganizations,
  pollOptions,
  pollVotes,
  user,
} from '@/db/schema';
import { eq, desc, and, inArray, isNull, or, sql } from 'drizzle-orm';
import { requireViewer } from '@/lib/session';
import { activeEntryScope } from '@/modules/portal/queries';
import { serviceDepartments, canReadPortal } from '@/modules/portal/management-policy';
import { agentSections, hasSectionRight } from '@/modules/institution/section-policy';
import { activeAgent } from '@/modules/institution/policy';
import { entryLabels, requestStatuses, requestLabels } from '@/modules/portal/policy';
import Certificates from '@/components/certificate-management';
import { ArchivePortalEntry } from '@/components/portal-entry-actions';
import { PortalEntryForm } from '@/components/portal-forms';
export async function ManagementWorkspace({
  searchParams,
}: {
  searchParams: Promise<{
    edit?: string;
    new?: string;
    tab?: string;
    kind?: string;
    entry?: string;
    csv?: string;
    q?: string;
    opportunity?: string;
    course?: string;
  }>;
}) {
  const v = await requireViewer(),
    p = await searchParams,
    a = v.institutionAgent;
  if (
    !v.platformAdmin &&
    (!a || !serviceDepartments.includes(a.department) || a.status !== 'active' || !a.canRead)
  )
    notFound();
  if (!v.platformAdmin) {
    const scopeActive = await activeEntryScope(a!);
    if (!activeAgent(a, scopeActive)) notFound();
  }
  const availableKinds = Object.keys(entryLabels).filter(
    (k) =>
      v.platformAdmin ||
      (a?.department === 'private_sector'
        ? hasSectionRight(a, k, 'canRead') ||
          (k === 'ticket' && hasSectionRight(a, 'trip', 'canRead'))
        : k in agentSections &&
          (hasSectionRight(a, k, 'canRead') ||
            (k === 'ticket' && hasSectionRight(a, 'trip', 'canRead')))),
  );
  const editableKinds = availableKinds.filter(
    (k) =>
      v.platformAdmin ||
      hasSectionRight(a, k, 'canEdit') ||
      (k === 'ticket' && hasSectionRight(a, 'trip', 'canEdit')),
  );
  const editable = editableKinds.length > 0;
  if (p.kind === 'team' && p.new) {
    const { redirect } = await import('next/navigation');
    redirect('/manage/team-settings');
  }
  const privateWorkspace = a?.department === 'private_sector' && !v.platformAdmin;
  const basePath = privateWorkspace ? '/agent' : '/manage';
  if (privateWorkspace && !p.kind)
    p.kind =
      ['product', 'housing', 'restaurant', 'ticket'].find((k) => availableKinds.includes(k)) ||
      availableKinds[0];
  const selectedKind = p.kind || '';
  const filteredRequests = () =>
    requests.filter(
      ({ request: r }) =>
        (!selectedKind ||
          scopedEntries.some((e) => e.id === r.entryId && e.kind === selectedKind)) &&
        (!p.entry || r.entryId === p.entry) &&
        (!p.course || scopedEntries.some((e) => e.id === r.entryId && e.teamCourseId === p.course)),
    );
  if (p.kind && !availableKinds.includes(p.kind)) notFound();
  if (p.new && p.kind && !editableKinds.includes(p.kind)) notFound();
  if ((p.new || p.edit) && !editable) notFound();
  const all = await db
    .select()
    .from(portalEntries)
    .where(v.platformAdmin ? undefined : eq(portalEntries.institutionId, a!.institutionId))
    .orderBy(desc(portalEntries.createdAt))
    .limit(300);
  const scopedEntries: (typeof portalEntries.$inferSelect)[] = [];
  for (const e of all)
    if (v.platformAdmin || canReadPortal(a, e, await activeEntryScope(e))) scopedEntries.push(e);
  if (p.entry && !scopedEntries.some((e) => e.id === p.entry && (!p.kind || e.kind === p.kind)))
    notFound();
  const entries = [];
  for (const e of all)
    if (!e.archived && (v.platformAdmin || canReadPortal(a, e, await activeEntryScope(e))))
      entries.push(e);
  const entry = p.edit ? entries.find((e) => e.id === p.edit) : undefined;
  if (
    p.edit &&
    (!entry ||
      !editableKinds.includes(entry.kind) ||
      (entry.published &&
        !v.platformAdmin &&
        !hasSectionRight(
          a,
          entry.kind === 'ticket' && entry.ticketType === 'trip' ? 'trip' : entry.kind,
          'canPublish',
        )))
  )
    notFound();
  const requests = await db
    .select({ request: portalRequests, name: user.name })
    .from(portalRequests)
    .innerJoin(user, eq(portalRequests.userId, user.id))
    .leftJoin(supportDestinations, eq(supportDestinations.requestId, portalRequests.id))
    .where(
      v.platformAdmin
        ? isNull(supportDestinations.requestId)
        : scopedEntries.length
          ? and(
              inArray(
                portalRequests.entryId,
                scopedEntries.map((e) => e.id),
              ),
              or(isNull(portalRequests.recipientId), eq(portalRequests.recipientId, v.user.id)),
            )
          : eq(portalRequests.id, '__none__'),
    )
    .orderBy(desc(portalRequests.updatedAt))
    .limit(200);
  const inst = await db
    .select()
    .from(institutions)
    .where(v.platformAdmin ? undefined : eq(institutions.id, a!.institutionId));
  const fac = await db
    .select()
    .from(faculties)
    .where(
      v.platformAdmin
        ? eq(faculties.active, true)
        : and(
            eq(faculties.active, true),
            a?.facultyId ? eq(faculties.id, a.facultyId) : isNull(faculties.id),
          ),
    );
  const orgs = await db
    .select()
    .from(studentOrganizations)
    .where(
      v.platformAdmin
        ? eq(studentOrganizations.active, true)
        : and(
            eq(studentOrganizations.active, true),
            eq(studentOrganizations.institutionId, a!.institutionId),
            a?.facultyId ? eq(studentOrganizations.facultyId, a.facultyId) : undefined,
          ),
    );
  const universityIds = inst.map((i) => i.universityId).filter((id): id is string => !!id);
  const teamCourses = await db
    .select()
    .from(courses)
    .where(
      universityIds.length
        ? and(
            inArray(courses.universityId, universityIds),
            v.platformAdmin
              ? undefined
              : studentCourseScopeSql({
                  status: 'active',
                  universityId: a!.universityId!,
                  facultyId: a!.facultyId,
                }),
          )
        : eq(courses.id, '__none__'),
    );
  const resultPoll =
    p.kind === 'poll' && p.tab === 'results'
      ? entries.find((e) => e.id === p.entry && e.kind === 'poll')
      : undefined;
  if (p.tab === 'results' && !resultPoll) notFound();
  const pollResults = resultPoll
    ? await db
        .select({
          id: pollOptions.id,
          label: pollOptions.label,
          votes: sql<number>`count(${pollVotes.id})::int`,
        })
        .from(pollOptions)
        .leftJoin(
          pollVotes,
          and(eq(pollVotes.optionId, pollOptions.id), eq(pollVotes.entryId, resultPoll.id)),
        )
        .where(eq(pollOptions.entryId, resultPoll.id))
        .groupBy(pollOptions.id, pollOptions.label)
        .orderBy(pollOptions.id)
    : [];
  const opts =
    entry?.kind === 'poll'
      ? await db.select().from(pollOptions).where(eq(pollOptions.entryId, entry.id))
      : [];
  const divisions =
    entry?.kind === 'volunteer'
      ? await db.select().from(volunteerDivisions).where(eq(volunteerDivisions.entryId, entry.id))
      : [];
  const local = (d: Date | null) => {
    if (!d) return '';
    return new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Africa/Cairo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
      .format(d)
      .replace(' ', 'T');
  };
  const neutral = !p.kind && !p.new && !p.edit && !p.tab;
  return (
    <section
      className={`portal-screen manage-screen ${privateWorkspace ? 'commerce-management' : ''}`}
    >
      <h1>{privateWorkspace ? 'لوحتي' : 'إدارة الخدمات والطلبات'}</h1>
      {privateWorkspace && (
        <p className="form-hint">أضف عناصر متجرك وحدّث بياناتها وتابع طلبات الطلاب من مكان واحد.</p>
      )}
      {privateWorkspace && (
        <AgentInstitutionCard
          institutionId={a!.institutionId}
          entries={entries}
          kind={p.kind || ''}
          entryId={p.edit}
        />
      )}
      {!privateWorkspace && (
        <nav className="portal-kind-grid" aria-label="أقسام الخدمات للإدارة">
          {availableKinds.map((k) => (
            <Link
              key={k}
              href={basePath + '?kind=' + k}
              aria-current={p.kind === k ? 'page' : undefined}
            >
              {entryLabels[k]}
            </Link>
          ))}
        </nav>
      )}

      {!neutral && (
        <div id="section-content" className="management-section-content">
          {p.kind && (
            <header className="section-heading">
              <h2>{entryLabels[p.kind]}</h2>
              {p.kind === 'volunteer' && (
                <a
                  className="button secondary"
                  href={
                    '/api/manage/volunteers' +
                    (p.entry ? '?entry=' + encodeURIComponent(p.entry) : '')
                  }
                >
                  تحميل بيانات المقبولين CSV
                </a>
              )}
              {p.kind === 'team' && editableKinds.includes('team') && (
                <Link className="button primary" href="/manage/team-settings">
                  تفعيل فريق أكاديمي لمقرر دراسي
                </Link>
              )}
            </header>
          )}
          {privateWorkspace && !p.new && !p.edit && (
            <nav className="commerce-tabs" aria-label="عرض القسم">
              <Link
                href={basePath + '?kind=' + p.kind}
                aria-current={p.tab !== 'requests' ? 'page' : undefined}
              >
                العناصر
              </Link>
              <Link
                href={basePath + '?kind=' + p.kind + '&tab=requests'}
                aria-current={p.tab === 'requests' ? 'page' : undefined}
              >
                الطلبات ({filteredRequests().length})
              </Link>
              {p.tab === 'requests' && p.entry && (
                <Link href={basePath + '?kind=' + p.kind + '&tab=requests'}>كل طلبات القسم</Link>
              )}
            </nav>
          )}
          {p.kind === 'team' && !p.edit && (
            <TeamCourseManagement v={v} entries={entries} courseId={p.course} />
          )}
          {p.kind === 'certificate' ? (
            <Certificates
              embedded
              searchParams={Promise.resolve({ new: p.new, edit: p.edit, csv: p.csv, q: p.q })}
            />
          ) : resultPoll ? (
            <section className="portal-form-section">
              <h2>{resultPoll.title}</h2>
              <p className="prose">{resultPoll.description}</p>
              <h3>نتائج التصويت</h3>
              <p>إجمالي الأصوات: {pollResults.reduce((n, r) => n + Number(r.votes), 0)}</p>
              {pollResults.map((r) => (
                <div key={r.id}>
                  <strong>{r.label}</strong>
                  <p>{r.votes} صوت</p>
                </div>
              ))}
              <p className="form-hint">تعرض النتائج مجمعة دون كشف اختيار كل طالب.</p>
              <Link className="button secondary" href={basePath + '?kind=poll'}>
                كل التصويتات والاستبيانات
              </Link>
            </section>
          ) : p.tab === 'requests' ||
            (['volunteer', 'team'].includes(p.kind || '') &&
              p.tab !== 'entries' &&
              !p.new &&
              !p.edit) ? (
            <div className="request-list">
              {filteredRequests().map(({ request: r, name }) => (
                <Link className="request-row" key={r.id} href={'/requests/' + r.id}>
                  <div>
                    <small>
                      {r.reference} · {name}
                    </small>
                    <h2>{r.subject}</h2>
                    <p>{requestLabels[r.kind] || 'طلب خدمة'}</p>
                  </div>
                  <span className={'status-pill status-' + r.status}>
                    {requestStatuses[r.status]}
                  </span>
                </Link>
              ))}
              {!filteredRequests().length && (
                <div className="portal-empty">
                  <h2>
                    {p.kind === 'service'
                      ? 'لم يتقدم طلاب لهذه الفرصة بعد'
                      : 'لا توجد طلبات ضمن نطاقك'}
                  </h2>
                </div>
              )}
            </div>
          ) : entry?.kind === 'team' ? (
            <TeamManagementDetail v={v} entry={entry} />
          ) : p.new || entry ? (
            <div className="portal-form-section">
              <h2>
                {privateWorkspace
                  ? entry
                    ? 'تعديل العنصر'
                    : 'إضافة عنصر'
                  : p.kind === 'poll'
                    ? entry
                      ? 'تعديل التصويت أو الاستبيان'
                      : 'إضافة تصويت أو استبيان'
                    : p.kind === 'service'
                      ? entry
                        ? 'تعديل الفرصة'
                        : 'إضافة فرصة رابط الطلاب'
                      : entry
                        ? 'تعديل الخدمة'
                        : 'إضافة خدمة أو منتج'}
              </h2>
              {privateWorkspace ? (
                <CommerceItemForm kind={entry?.kind || p.kind || 'product'} value={entry} />
              ) : (
                <PortalEntryForm
                  initialOpportunityType={
                    p.kind === 'service' &&
                    ['internship', 'scholarship', 'job'].includes(p.opportunity || '')
                      ? p.opportunity
                      : undefined
                  }
                  ownScope={
                    !v.platformAdmin && a
                      ? {
                          institutionId: a.institutionId,
                          facultyId: a.facultyId,
                          organizationId: a.organizationId,
                          department: a.department,
                        }
                      : undefined
                  }
                  value={
                    entry
                      ? {
                          ...entry,
                          startsAt: local(entry.startsAt),
                          closesAt: local(entry.closesAt),
                          options: opts.map((o) => o.label).join('\n'),
                          volunteerDivisions: divisions.sort((a, b) => a.position - b.position),
                        }
                      : undefined
                  }
                  institutions={inst}
                  faculties={fac}
                  organizations={orgs}
                  courses={teamCourses}
                  allowedKinds={p.kind ? editableKinds.filter((k) => k === p.kind) : editableKinds}
                  tripPublish={v.platformAdmin || hasSectionRight(a, 'trip', 'canPublish')}
                  publishKinds={availableKinds.filter(
                    (k) => v.platformAdmin || hasSectionRight(a, k, 'canPublish'),
                  )}
                />
              )}
            </div>
          ) : (
            <>
              {p.kind === 'service' && editableKinds.includes('service') && (
                <nav
                  className="tab-row"
                  aria-label="إضافة فرصة"
                  style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}
                >
                  {[
                    ['internship', 'إضافة فرصة تدريب'],
                    ['scholarship', 'إضافة منحة'],
                    ['job', 'إضافة فرصة عمل'],
                  ].map(([kind, label]) => (
                    <Link
                      className="button primary"
                      key={kind}
                      href={basePath + '?kind=service&new=1&opportunity=' + kind}
                    >
                      {label}
                    </Link>
                  ))}
                </nav>
              )}
              {p.kind === 'poll' && editableKinds.includes('poll') && (
                <Link className="button primary" href={basePath + '?kind=poll&new=1'}>
                  إضافة تصويت أو استبيان
                </Link>
              )}
              {!['service', 'poll', 'team'].includes(p.kind || '') &&
                editable &&
                (!p.kind || editableKinds.includes(p.kind)) && (
                  <Link
                    className="button primary"
                    href={basePath + '?new=1' + (p.kind ? '&kind=' + p.kind : '')}
                  >
                    {privateWorkspace ? '+ إضافة عنصر' : '+ إضافة خدمة أو منتج'}
                  </Link>
                )}
              <div
                className="portal-table-wrap"
                tabIndex={0}
                role="region"
                aria-label="جدول الخدمات والمنتجات"
              >
                <table className="portal-table">
                  <thead>
                    <tr>
                      <th>
                        {p.kind === 'poll'
                          ? 'التصويت أو الاستبيان'
                          : p.kind === 'service'
                            ? 'الفرصة'
                            : 'الخدمة'}
                      </th>
                      <th>النوع</th>
                      <th>النشر</th>
                      <th>الإجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries
                      .filter(
                        (e) =>
                          (!p.kind || e.kind === p.kind) &&
                          (v.platformAdmin || e.kind !== 'service' || e.authorId === v.user.id),
                      )
                      .map((e) => (
                        <tr key={e.id}>
                          <td>
                            {['service', 'poll'].includes(e.kind) ? (
                              <Link
                                className="text-link"
                                href={
                                  basePath +
                                  '?kind=' +
                                  e.kind +
                                  '&tab=' +
                                  (e.kind === 'poll' ? 'results' : 'requests') +
                                  '&entry=' +
                                  e.id
                                }
                              >
                                {e.title}
                              </Link>
                            ) : (
                              e.title
                            )}
                          </td>
                          <td>
                            {e.kind === 'service'
                              ? { internship: 'فرصة تدريب', scholarship: 'منحة', job: 'فرصة عمل' }[
                                  e.opportunityType as string
                                ] || 'فرصة'
                              : entryLabels[e.kind]}
                          </td>
                          <td>{e.published ? 'منشور' : 'مسودة'}</td>
                          <td>
                            <div className="management-row-actions">
                              {e.kind === 'service' && (
                                <a
                                  className="text-link"
                                  href={'/api/manage/applicants?entry=' + encodeURIComponent(e.id)}
                                >
                                  تحميل المتقدمين CSV
                                </a>
                              )}
                              {editableKinds.includes(e.kind) &&
                              (!e.published ||
                                v.platformAdmin ||
                                hasSectionRight(a, e.kind, 'canPublish')) ? (
                                <Link
                                  className="text-link"
                                  href={basePath + '?kind=' + e.kind + '&edit=' + e.id}
                                >
                                  تعديل
                                </Link>
                              ) : (
                                <span className="form-hint">قراءة فقط</span>
                              )}
                              <Link
                                className="text-link"
                                href={
                                  basePath +
                                  '?kind=' +
                                  e.kind +
                                  '&tab=' +
                                  (e.kind === 'poll' ? 'results' : 'requests') +
                                  '&entry=' +
                                  e.id
                                }
                              >
                                {e.kind === 'poll'
                                  ? 'عرض نتائج التصويت'
                                  : e.kind === 'service'
                                    ? 'الطلاب المتقدمون'
                                    : privateWorkspace
                                      ? 'مراجعة الطلبات'
                                      : 'طلبات التسجيل والانضمام'}
                              </Link>
                              {e.kind === 'ticket' && (
                                <a
                                  className="text-link"
                                  href={'/api/manage/registrations?entry=' + e.id}
                                >
                                  تحميل بيانات المسجلين CSV
                                </a>
                              )}
                              {editableKinds.includes(e.kind) &&
                                (v.platformAdmin ||
                                  e.kind !== 'service' ||
                                  e.authorId === v.user.id) &&
                                [
                                  'service',
                                  'poll',
                                  'product',
                                  'housing',
                                  'restaurant',
                                  'ticket',
                                ].includes(e.kind) && <ArchivePortalEntry id={e.id} />}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {!entries.filter(
                (e) =>
                  (!p.kind || e.kind === p.kind) &&
                  (v.platformAdmin || e.kind !== 'service' || e.authorId === v.user.id),
              ).length && (
                <div className="portal-empty">
                  <h2>
                    {p.kind === 'poll'
                      ? editable
                        ? 'ابدأ بإضافة تصويت أو استبيان'
                        : 'لا توجد تصويتات أو استبيانات'
                      : p.kind === 'service'
                        ? editable
                          ? 'ابدأ بإضافة فرص التدريب والمنح والعمل'
                          : 'لا توجد فرص ضمن هذا القسم'
                        : editable
                          ? 'ابدأ بإضافة خدماتك الفعلية'
                          : 'لا توجد خدمات ضمن هذا القسم'}
                  </h2>
                  <p>
                    {p.kind === 'poll'
                      ? 'أضف السؤال والاختيارات، ثم اضغط على التصويت لمتابعة نتائجه.'
                      : p.kind === 'service'
                        ? 'أضف بيانات الفرصة، ثم اضغط عليها لمتابعة الطلاب المتقدمين.'
                        : 'الكتالوج فارغ حتى ينشر المسؤول بيانات الخدمات المتاحة.'}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
