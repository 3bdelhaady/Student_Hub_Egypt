import { ManagementWorkspace } from '@/components/management-workspace';
import { FacultyStudentDirectory } from '@/components/faculty-students';
import { MobileDisclosure } from '@/components/mobile-disclosure';
import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { requireViewer } from '@/lib/session';
import { db } from '@/db';
import {
  institutions,
  institutionAgents,
  studentOrganizations,
  institutionContent,
  faculties,
  user,
} from '@/db/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { Building2, Users, ShieldCheck, LogOut, UserRound, FilePenLine } from 'lucide-react';
import {
  InstitutionForm,
  AgentReviewForm,
  OrganizationForm,
  DomainContentForm,
} from '@/components/institution-forms';
import { ProfileForm } from '@/components/forms';
import { signOut } from '@/modules/identity/actions';
import {
  activeAgent,
  departmentLabels,
  positionLabel,
  accountRoleLabel,
  agentStatusLabels,
} from '@/modules/institution/policy';
export const metadata = { title: 'مساحة الوكيل' };
export default async function AgentPage({
  searchParams,
}: {
  searchParams: Promise<{
    edit?: string;
    new?: string;
    q?: string;
    status?: string;
    manage?: string;
    kind?: string;
    tab?: string;
    entry?: string;
  }>;
}) {
  const v = await requireViewer();
  if (v.membership?.role === 'student' && v.institutionAgent && v.activeMode === 'student')
    redirect('/account?view=student');
  const agent = v.institutionAgent;
  if (!agent) {
    const [person] = await db.select().from(user).where(eq(user.id, v.user.id)).limit(1);
    if (person && person.signupKind !== 'student') redirect('/registration');
  }
  const params = await searchParams;
  if (
    params.manage === 'content' &&
    agent &&
    ['student_union', 'student_activity', 'private_sector'].includes(agent.department) &&
    agent.sectionPermissions
  )
    notFound();
  const [institution] = agent
    ? await db.select().from(institutions).where(eq(institutions.id, agent.institutionId)).limit(1)
    : [];
  const [organization] = agent?.organizationId
    ? await db
        .select()
        .from(studentOrganizations)
        .where(eq(studentOrganizations.id, agent.organizationId))
        .limit(1)
    : [];
  const [faculty] = agent?.facultyId
    ? await db.select().from(faculties).where(eq(faculties.id, agent.facultyId)).limit(1)
    : [];
  const active = activeAgent(
    agent,
    !!institution?.active &&
      (!agent?.facultyId || !!faculty?.active) &&
      (!agent?.organizationId || !!organization?.active),
  );
  if (active && agent?.department === 'private_sector' && params.manage !== 'content')
    return <ManagementWorkspace searchParams={searchParams} />;
  if (
    active &&
    (['student_union', 'student_activity'].includes(agent!.department) ||
      (agent!.department === 'private_sector' && !!agent!.sectionPermissions)) &&
    params.manage !== 'content'
  )
    redirect('/manage');
  const manager = active && agent!.isSuperAgent;
  const affairsManager =
    manager && ['student_affairs', 'youth_welfare'].includes(agent!.department);
  if (
    active &&
    agent?.department === 'student_affairs' &&
    agent.canEdit &&
    params.manage !== 'content'
  )
    return <FacultyStudentDirectory searchParams={searchParams} />;
  const [team, groups, content] = await Promise.all([
    manager
      ? db
          .select({ agent: institutionAgents, name: user.name, email: user.email })
          .from(institutionAgents)
          .innerJoin(user, eq(user.id, institutionAgents.userId))
          .where(
            and(
              eq(institutionAgents.institutionId, agent!.institutionId),
              agent!.facultyId
                ? eq(institutionAgents.facultyId, agent!.facultyId)
                : isNull(institutionAgents.facultyId),
              affairsManager
                ? undefined
                : and(
                    eq(institutionAgents.department, agent!.department),
                    agent!.organizationId
                      ? eq(institutionAgents.organizationId, agent!.organizationId)
                      : isNull(institutionAgents.organizationId),
                  ),
            ),
          )
          .orderBy(desc(institutionAgents.createdAt))
          .limit(100)
      : Promise.resolve([]),
    affairsManager
      ? db
          .select()
          .from(studentOrganizations)
          .where(
            and(
              eq(studentOrganizations.institutionId, agent!.institutionId),
              eq(studentOrganizations.facultyId, agent!.facultyId!),
            ),
          )
          .orderBy(studentOrganizations.name)
      : Promise.resolve([]),
    active
      ? db
          .select()
          .from(institutionContent)
          .where(
            and(
              eq(institutionContent.institutionId, agent!.institutionId),
              affairsManager ? undefined : eq(institutionContent.department, agent!.department),
              agent!.facultyId
                ? eq(institutionContent.facultyId, agent!.facultyId)
                : isNull(institutionContent.facultyId),
              affairsManager
                ? undefined
                : agent!.organizationId
                  ? eq(institutionContent.organizationId, agent!.organizationId)
                  : isNull(institutionContent.organizationId),
            ),
          )
          .orderBy(desc(institutionContent.createdAt))
          .limit(100)
      : Promise.resolve([]),
  ]);
  const edit = content.find((c) => c.id === params.edit);
  const editing = params.new === '1' || !!params.edit;
  const canEdit = active && !!agent?.canEdit;
  return (
    <div className="agent-workspace">
      <div className="page-top">
        <div className="container">
          <span className="eyebrow">
            <Building2 size={16} /> {accountRoleLabel(agent?.department)}
          </span>
          <h1>إدارة محتوى القسم</h1>
          {active && agent?.canEdit && agent.department !== 'student_affairs' && (
            <p>
              <Link className="text-link" href="/manage">
                إدارة الخدمات والطلبات
              </Link>
            </p>
          )}
          <p>قسمك وكليتك فقط، بصلاحيات يحددها المسؤول.</p>
        </div>
      </div>
      <section className="section container dashboard-grid">
        <aside className="dashboard-nav">
          <Link className="agent-wordmark" href="/agent">
            Student Hub
          </Link>
          <span className="nav-caption">{v.user.name}</span>
          <Link href="/agent">
            <Building2 size={17} />
            نظرة عامة
          </Link>
          {active && (
            <Link href="#domain-content">
              <FilePenLine size={17} />
              محتوى قسمي
            </Link>
          )}
          {manager && (
            <Link href="#institution-team">
              <Users size={17} />
              اتحاد وأنشطة الكلية
            </Link>
          )}
          {active && agent?.canEdit && agent.department !== 'student_affairs' && (
            <Link href="/manage">الخدمات والطلبات</Link>
          )}
          {v.membership?.role === 'student' && (
            <Link href="/settings">
              <UserRound size={17} />
              تغيير نوع الحساب
            </Link>
          )}
          {v.platformAdmin && <Link href="/admin?tab=institutions">أدمن المنصة</Link>}
          <form action={signOut}>
            <button className="nav-logout" type="submit">
              <LogOut size={17} />
              تسجيل الخروج
            </button>
          </form>
        </aside>
        <div>
          <div className={`notice ${active ? '' : 'warning'}`}>
            <ShieldCheck />
            <div>
              <strong>
                {accountRoleLabel(agent?.department)}:{' '}
                {agent ? agentStatusLabels[agent.status] : 'لا يوجد تعيين'}
              </strong>
              <p>
                {agent && institution
                  ? `${institution.name} • ${faculty?.name || 'قطاع خاص'} • ${departmentLabels[agent.department]} • ${positionLabel(agent.department, agent.position)}`
                  : 'التسجيل لا يمنح صلاحيات، يراجع أدمن المنصة حسابات شؤون الطلاب والقطاع الخاص، وتمنح شؤون الطلاب صلاحية Coordinator لطلاب كليتها.'}
              </p>
              {!active && (
                <p>
                  لا تظهر بيانات القسم دون تفعيل الحساب وصلاحية القراءة وإتاحة المؤسسة والمجموعة.
                </p>
              )}
            </div>
          </div>
          {active && institution && agent && (
            <>
              <div className="institution-overview">
                <span className="institution-card-icon">
                  <Building2 size={32} />
                </span>
                <div>
                  <span className="eyebrow">{departmentLabels[agent.department]}</span>
                  <h2>{organization?.name || institution.name}</h2>
                  <p>{faculty?.name || 'نطاق المؤسسة الخاصة فقط'}</p>
                </div>
                <span className="tag">
                  {agent.isSuperAgent ? 'مسؤول نطاق' : accountRoleLabel(agent.department)} •{' '}
                  {positionLabel(agent.department, agent.position)}
                </span>
              </div>
              <div className="panel" id="domain-content">
                <div className="section-heading">
                  <h2>{editing ? 'محرر محتوى القسم' : 'محتوى قسمي'}</h2>
                  {canEdit && (
                    <Link className="text-link" href={editing ? '/agent' : '/agent?new=1'}>
                      {editing ? 'رجوع للقائمة' : '+ إضافة محتوى'}
                    </Link>
                  )}
                </div>
                <p className="form-hint">
                  تعرض هذه القائمة قسمك وكليتك ومجموعتك فقط، وحساب السوبر الجامعي يشمل أقسام كليته،
                  دون القطاع الخاص، آخر ١٠٠ محتوى.
                </p>
                {editing ? (
                  canEdit && (!params.edit || edit) && (!edit?.published || agent.canPublish) ? (
                    <DomainContentForm
                      key={edit?.id || 'new'}
                      value={edit}
                      canPublish={agent.canPublish}
                      scopeOptions={
                        affairsManager
                          ? {
                              institutions: [institution],
                              faculties: faculty ? [faculty] : [],
                              organizations: groups,
                            }
                          : undefined
                      }
                    />
                  ) : (
                    <p>المحتوى أو صلاحية تعديله غير متاحة في نطاقك.</p>
                  )
                ) : (
                  <div className="domain-content-list">
                    {content.map((c) => (
                      <article key={c.id}>
                        <span className="tag">{c.published ? 'منشور' : 'مسودة'}</span>
                        <h3>{c.title}</h3>
                        <MobileDisclosure title="قراءة التفاصيل">
                          <div className="prose">{c.body}</div>
                        </MobileDisclosure>
                        {canEdit && (!c.published || agent.canPublish) && (
                          <Link className="text-link" href={`/manage/content?edit=${c.id}`}>
                            تعديل المحتوى
                          </Link>
                        )}
                      </article>
                    ))}
                    {!content.length && <p>لا يوجد محتوى في قسمك بعد.</p>}
                  </div>
                )}
              </div>
              {agent.department === 'private_sector' && canEdit && (
                <div className="panel">
                  <h2>بيانات المؤسسة الخاصة</h2>
                  <InstitutionForm value={institution} />
                </div>
              )}
              {manager && (
                <div id="institution-team">
                  {affairsManager && (
                    <div className="panel">
                      <h2>إنشاء نشاط طلابي لكليتك</h2>
                      <MobileDisclosure title="إنشاء نشاط طلابي">
                        <OrganizationForm
                          institutions={[institution]}
                          faculties={faculty ? [faculty] : []}
                        />
                      </MobileDisclosure>
                    </div>
                  )}
                  <div className="panel">
                    <h2>منح صلاحية Coordinator</h2>
                    <p>
                      تمنح شؤون الطلاب الصلاحية لحساب طالب مسجل من الكلية نفسها، دون حساب منفصل أو
                      موافقة الأدمن.
                    </p>
                    <Link className="button primary" href="/manage/access?assign=1">
                      منح صلاحية Coordinator
                    </Link>
                  </div>
                  <div className="panel">
                    <h2>مسؤولو الاتحاد والأنشطة</h2>
                    <p className="form-hint">
                      نطاقك كلية واحدة، يمكنك تعديل المنصب والقراءة والتعديل والنشر، أدمن المنصة
                      وحده يفعّل الحساب أو يوقفه، السوبر الجامعي يشمل أقسام كليته فقط، ولا سلطة له
                      على القطاع الخاص.
                    </p>
                    <div
                      className="table-wrap"
                      tabIndex={0}
                      aria-label="مسؤولو اتحاد وأنشطة الكلية"
                    >
                      <table>
                        <thead>
                          <tr>
                            <th>الحساب</th>
                            <th>القسم والمجموعة</th>
                            <th>الصلاحيات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {team.map(({ agent: row, name, email }) => (
                            <tr key={row.id}>
                              <td>
                                {name}
                                <small className="table-email">{email}</small>
                              </td>
                              <td>
                                {departmentLabels[row.department]}
                                <small className="table-email">
                                  {groups.find((g) => g.id === row.organizationId)?.name} •{' '}
                                  {agentStatusLabels[row.status]}
                                </small>
                              </td>
                              <td>
                                <MobileDisclosure title="تعديل الصلاحيات">
                                  <AgentReviewForm
                                    key={`${row.id}-${row.position}-${row.status}-${row.canRead}-${row.canEdit}-${row.canPublish}`}
                                    agent={row}
                                  />
                                </MobileDisclosure>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {!team.length && <p>لم يُضف مسؤولو اتحاد أو أنشطة لهذه الكلية بعد.</p>}
                  </div>
                </div>
              )}
            </>
          )}
          <div className="panel">
            <h2>بيانات حساب {accountRoleLabel(agent?.department)}</h2>
            <p dir="ltr" style={{ textAlign: 'right' }}>
              {v.user.email}
            </p>
            <MobileDisclosure title="تعديل بيانات حسابي">
              <ProfileForm name={v.user.name} />
            </MobileDisclosure>
          </div>
        </div>
      </section>
    </div>
  );
}
