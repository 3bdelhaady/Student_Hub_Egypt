import { InstitutionLifecycle } from './institution-lifecycle';
import { institutionRestaurantDefaults } from '@/modules/institution/restaurant-info';
import { PlatformConsoleFrame } from './platform-console-frame';
import { MobileDisclosure } from '@/components/mobile-disclosure';
import { ConsoleDirectory } from '@/components/console-directory';
import Link from 'next/link';
import { db } from '@/db';
import {
  institutionContent,
  portalEntries,
  institutions,
  institutionAgents,
  institutionAuditEvents,
  studentOrganizations,
  faculties,
  universities,
  user,
  memberships,
} from '@/db/schema';
import { desc, eq, isNull, and } from 'drizzle-orm';
import { requireViewer } from '@/lib/session';
import { redirect } from 'next/navigation';
import {
  DomainContentForm,
  InstitutionForm,
  AddAgentForm,
  AgentReviewForm,
  OrganizationForm,
} from './institution-forms';
import {
  institutionKinds,
  departmentLabels,
  accountRoleLabel,
  agentStatusLabels,
} from '@/modules/institution/policy';
export async function PlatformAdmin({
  tab = 'institutions',
  edit,
  create = false,
}: {
  tab?: string;
  edit?: string;
  create?: boolean;
}) {
  const v = await requireViewer();
  if (!v.platformAdmin) redirect('/account');
  const [catalog, agents, audit, facultyList, universityList, groups, content, students] =
    await Promise.all([
      db
        .select()
        .from(institutions)
        .where(isNull(institutions.deletedAt))
        .orderBy(desc(institutions.createdAt))
        .limit(100),
      db
        .select({
          agent: institutionAgents,
          name: user.name,
          email: user.email,
          institution: institutions.name,
        })
        .from(institutionAgents)
        .innerJoin(user, eq(user.id, institutionAgents.userId))
        .innerJoin(institutions, eq(institutions.id, institutionAgents.institutionId))
        .orderBy(desc(institutionAgents.createdAt))
        .limit(100),
      db
        .select({ event: institutionAuditEvents, institution: institutions.name })
        .from(institutionAuditEvents)
        .innerJoin(institutions, eq(institutions.id, institutionAuditEvents.institutionId))
        .orderBy(desc(institutionAuditEvents.createdAt))
        .limit(40),
      db.select().from(faculties).orderBy(faculties.name),
      db.select().from(universities).orderBy(universities.name),
      db.select().from(studentOrganizations).orderBy(studentOrganizations.name),
      db.select().from(institutionContent).orderBy(desc(institutionContent.createdAt)).limit(100),
      db
        .select({ name: user.name, email: user.email, id: user.id, membership: memberships })
        .from(user)
        .innerJoin(memberships, eq(memberships.userId, user.id))
        .where(eq(memberships.role, 'student'))
        .orderBy(desc(memberships.createdAt))
        .limit(100),
    ]);
  const deputies = agents.filter((a) =>
    ['student_affairs', 'private_sector'].includes(a.agent.department),
  );
  const restaurantEntries =
    tab === 'institutions' && edit
      ? await db.select().from(portalEntries).where(eq(portalEntries.institutionId, edit))
      : [];
  const selected =
    catalog.find((i) => i.id === edit) ||
    (edit && tab === 'institutions'
      ? (
          await db
            .select()
            .from(institutions)
            .where(and(eq(institutions.id, edit), isNull(institutions.deletedAt)))
            .limit(1)
        )[0]
      : undefined);
  const facultyName = (id: string | null) =>
    facultyList.find((f) => f.id === id)?.name || 'دون كلية (قطاع خاص)';
  const agentRecord =
    agents.find((a) => a.agent.id === edit) ||
    (edit && tab === 'agents'
      ? (
          await db
            .select({
              agent: institutionAgents,
              name: user.name,
              email: user.email,
              institution: institutions.name,
            })
            .from(institutionAgents)
            .innerJoin(user, eq(user.id, institutionAgents.userId))
            .innerJoin(institutions, eq(institutions.id, institutionAgents.institutionId))
            .where(eq(institutionAgents.id, edit))
            .limit(1)
        )[0]
      : undefined);
  const title =
    tab === 'agents'
      ? 'الوكلاء والصلاحيات'
      : tab === 'students'
        ? 'إدارة الطلاب'
        : tab === 'organizations'
          ? 'الاتحادات والأنشطة'
          : tab === 'institution-audit'
            ? 'سجل المؤسسات'
            : tab === 'domain-content'
              ? 'إدارة المحتوى'
              : 'إدارة المؤسسات';
  const total =
    tab === 'agents' ? deputies.length : tab === 'students' ? students.length : catalog.length;
  const active =
    tab === 'agents'
      ? deputies.filter((a) => a.agent.status === 'active').length
      : tab === 'students'
        ? students.filter((a) => a.membership.status === 'active').length
        : catalog.filter((a) => a.active).length;
  return (
    <PlatformConsoleFrame
      title={title}
      description={
        'عرض وإدارة بيانات ' +
        (tab === 'agents' ? 'الوكلاء' : tab === 'students' ? 'الطلاب' : 'المؤسسات') +
        ' المسجلة'
      }
      total={total}
      active={active}
    >
      <details className="console-safety">
        <summary>صلاحيات منفصلة لكل جهة</summary>
        <p>
          أدمن المنصة يفعّل حسابات شؤون الطلاب والقطاع الخاص، شؤون الطلاب تفعّل طلاب كليتها وتمنحهم
          صلاحية Coordinator، كل حساب يعمل في نطاقه فقط.
        </p>
      </details>

      {tab === 'students' && (
        <ConsoleDirectory
          searchKind="students"
          columns={['الطالب', 'الجامعة', 'الكلية', 'الحالة']}
          placeholder="ابحث باسم الطالب أو بريده..."
          categoryLabel="الجامعة"
          rows={students.map((s) => ({
            id: s.id,
            accountToggle: {
              id: s.membership.id,
              kind: 'student',
              active: s.membership.status === 'active',
            },
            title: s.name,
            subtitle:
              s.email +
              (agents.some(
                (a) =>
                  a.agent.userId === s.id &&
                  ['student_union', 'student_activity'].includes(a.agent.department),
              )
                ? ' · Coordinator'
                : ''),
            category: universityList.find((u) => u.id === s.membership.universityId)?.name || '',
            status: agentStatusLabels[s.membership.status] || s.membership.status,
            cells: [
              universityList.find((u) => u.id === s.membership.universityId)?.name || '',
              facultyName(s.membership.facultyId),
              agentStatusLabels[s.membership.status] || s.membership.status,
            ],
          }))}
        />
      )}

      {tab === 'domain-content' && (
        <div className="panel">
          <div className="section-heading">
            <h2>محتوى جميع الأقسام</h2>
            <Link
              href={
                create || edit ? '/admin?tab=domain-content' : '/admin?tab=domain-content&new=1'
              }
            >
              {create || edit ? 'رجوع' : '+ إضافة محتوى'}
            </Link>
          </div>

          {create || edit ? (
            <DomainContentForm
              value={content.find((c) => c.id === edit)}
              canPublish
              scopeOptions={{
                institutions: catalog,
                faculties: facultyList,
                organizations: groups,
              }}
            />
          ) : (
            <div className="domain-content-list">
              {content.map((c) => (
                <article key={c.id}>
                  <span className="tag">
                    {departmentLabels[c.department]} • {c.published ? 'منشور' : 'مسودة'}
                  </span>
                  <h3>{c.title}</h3>
                  <p>
                    {catalog.find((i) => i.id === c.institutionId)?.name} •
                    {facultyName(c.facultyId)}
                  </p>
                  <div className="prose">{c.body}</div>
                  <Link href={`/admin?tab=domain-content&edit=${c.id}`}>تعديل المحتوى</Link>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'institutions' && (
        <div className="panel">
          <div className="section-heading">
            <h2>{create || edit ? 'بيانات المؤسسة' : 'المؤسسات المتاحة'}</h2>
            <Link
              className="text-link"
              href={create || edit ? '/admin?tab=institutions' : '/admin?tab=institutions&new=1'}
            >
              {create || edit ? 'رجوع للقائمة' : '+ إنشاء مؤسسة يدويًا'}
            </Link>
          </div>

          {create || edit ? (
            edit && !selected ? (
              <p>المؤسسة غير موجودة ضمن القائمة.</p>
            ) : (
              <>
                <InstitutionForm
                  key={edit || 'new'}
                  value={
                    selected
                      ? {
                          ...selected,
                          website:
                            selected.website ||
                            restaurantEntries.find((e) => e.kind === 'restaurant')
                              ?.restaurantDetails?.website ||
                            '',
                          restaurantInfo: institutionRestaurantDefaults(
                            selected.restaurantInfo,
                            restaurantEntries.find((e) => e.kind === 'restaurant'),
                          ),
                        }
                      : undefined
                  }
                  universities={universityList}
                  platform
                />
                {selected && (
                  <InstitutionLifecycle
                    id={selected.id}
                    name={selected.name}
                    active={selected.active}
                    deleteOnly
                  />
                )}
              </>
            )
          ) : (
            <>
              <p className="form-hint">آخر ١٠٠ مؤسسة مسجلة.</p>
              <ConsoleDirectory
                searchKind="institutions"
                columns={['المؤسسة', 'القطاع', 'الوكلاء', 'الحالة']}
                placeholder="ابحث باسم المؤسسة..."
                categoryLabel="القطاع"
                rows={catalog.map((i) => ({
                  id: i.id,
                  title: i.name,
                  subtitle: undefined,
                  category: institutionKinds[i.kind],
                  status: i.active ? 'منشط' : 'غير منشط',
                  cells: [
                    institutionKinds[i.kind],
                    `${agents.filter((a) => a.agent.institutionId === i.id).length} وكلاء`,
                    i.active ? 'منشط' : 'غير منشط',
                  ],
                  href: `/admin?tab=institutions&edit=${i.id}`,
                  institutionState: { active: i.active },
                }))}
              />
              <Link className="console-create" href="/admin?tab=institutions&new=1">
                + إنشاء مؤسسة جديدة
              </Link>
            </>
          )}
        </div>
      )}

      {tab === 'organizations' && (
        <>
          <div className="panel">
            <h2>إنشاء نشاط طلابي لكلية</h2>
            <MobileDisclosure title="إنشاء نشاط طلابي">
              <OrganizationForm institutions={catalog} faculties={facultyList} />
            </MobileDisclosure>
          </div>
          <div className="panel">
            <h2>الاتحادات والأنشطة</h2>
            <div className="table-wrap" tabIndex={0} aria-label="الاتحادات والأنشطة">
              <table>
                <thead>
                  <tr>
                    <th>الجامعة</th>
                    <th>النوع</th>
                    <th>الكلية</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((g) => (
                    <tr key={g.id}>
                      <td>
                        {universityList.find((u) => u.id === g.universityId)?.name || 'غير محددة'}
                        <small className="organization-row-name">{g.name}</small>
                      </td>
                      <td>{departmentLabels[g.kind]}</td>
                      <td>{facultyName(g.facultyId)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'agents' && (
        <>
          {create ? (
            <div className="panel console-form-panel">
              <div className="section-heading">
                <h2>إضافة حساب وكيل أو مسؤول</h2>
                <Link href="/admin?tab=agents">رجوع للقائمة</Link>
              </div>
              <AddAgentForm
                institutions={catalog}
                faculties={facultyList}
                organizations={groups}
                platform
              />
            </div>
          ) : edit ? (
            agentRecord ? (
              <div className="console-agent-detail">
                <div className="console-detail-banner">
                  <span className="console-avatar">{agentRecord.name.slice(0, 1)}</span>
                  <div>
                    <h2>{agentRecord.name}</h2>
                    <p>{agentRecord.email}</p>
                  </div>
                  <Link href="/admin?tab=agents">رجوع للوكلاء</Link>
                </div>
                <div className="panel">
                  <h3>المؤسسة المرتبطة</h3>
                  <p>
                    {agentRecord.institution} · {facultyName(agentRecord.agent.facultyId)} ·
                    {departmentLabels[agentRecord.agent.department]}
                  </p>
                </div>
                <div className="panel">
                  <h3>صلاحيات الوصول</h3>
                  <AgentReviewForm key={agentRecord.agent.id} agent={agentRecord.agent} platform />
                </div>
              </div>
            ) : (
              <p role="alert">الوكيل غير موجود.</p>
            )
          ) : (
            <>
              <ConsoleDirectory
                searchKind="agents"
                columns={['الحساب', 'القسم', 'المؤسسة', 'الحالة']}
                placeholder="ابحث بالاسم أو البريد..."
                categoryLabel="المؤسسة"
                rows={deputies.map(({ agent, name, email, institution }) => ({
                  id: agent.id,
                  title: name,
                  subtitle: `${email} · ${accountRoleLabel(agent.department)}`,
                  category: institution,
                  status: agentStatusLabels[agent.status],
                  cells: [
                    departmentLabels[agent.department],
                    institution,
                    agentStatusLabels[agent.status],
                  ],
                  accountToggle: { id: agent.id, kind: 'agent', active: agent.status === 'active' },
                  href: `/admin?tab=agents&edit=${agent.id}`,
                }))}
              />
              <Link className="console-create" href="/admin?tab=agents&new=1">
                + إضافة حساب وكيل
              </Link>
            </>
          )}
        </>
      )}

      {tab === 'institution-audit' && (
        <div className="panel">
          <h2>سجل قرارات المؤسسات</h2>
          <p className="form-hint">آخر ٤٠ عملية، دون كلمات مرور أو أسرار.</p>
          <div className="table-wrap" tabIndex={0} aria-label="سجل المؤسسات">
            <table>
              <thead>
                <tr>
                  <th>المؤسسة</th>
                  <th>العملية</th>
                  <th>المرجع</th>
                  <th>التوقيت</th>
                </tr>
              </thead>
              <tbody>
                {audit.map(({ event, institution }) => (
                  <tr key={event.id}>
                    <td>{institution}</td>
                    <td dir="ltr">{event.action}</td>
                    <td>
                      <code>{event.entityId.slice(0, 12)}</code>
                    </td>
                    <td>{event.createdAt.toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PlatformConsoleFrame>
  );
}
