import { OfficerAssignmentForm } from '@/components/officer-assignment-form';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireViewer } from '@/lib/session';
import { db } from '@/db';
import { institutionAgents, user, studentOrganizations } from '@/db/schema';
import { and, eq, inArray, desc } from 'drizzle-orm';
import { activeEntryScope } from '@/modules/portal/queries';
import {
  canManageOfficers,
  departmentLabels,
  agentStatusLabels,
} from '@/modules/institution/policy';
import { AgentReviewForm } from '@/components/institution-forms';
import { MobileDisclosure } from '@/components/mobile-disclosure';
export const metadata = { title: 'صلاحيات اتحاد وأنشطة الكلية' };
export default async function Access({
  searchParams,
}: {
  searchParams: Promise<{ assign?: string }>;
}) {
  const params = await searchParams;
  const v = await requireViewer(),
    a = v.institutionAgent;
  if (
    !a ||
    a.department !== 'student_affairs' ||
    !a.facultyId ||
    !a.universityId ||
    !canManageOfficers(a, { ...a, department: 'student_union' }, await activeEntryScope(a))
  )
    notFound();
  const rows = await db
    .select({
      agent: institutionAgents,
      name: user.name,
      email: user.email,
      organization: studentOrganizations.name,
    })
    .from(institutionAgents)
    .innerJoin(user, eq(user.id, institutionAgents.userId))
    .leftJoin(studentOrganizations, eq(studentOrganizations.id, institutionAgents.organizationId))
    .where(
      and(
        eq(institutionAgents.institutionId, a.institutionId),
        eq(institutionAgents.universityId, a.universityId),
        eq(institutionAgents.facultyId, a.facultyId),
        inArray(institutionAgents.department, ['student_union', 'student_activity']),
      ),
    )
    .orderBy(desc(institutionAgents.createdAt))
    .limit(100);
  const organizations = await db
    .select()
    .from(studentOrganizations)
    .where(
      and(
        eq(studentOrganizations.institutionId, a.institutionId),
        eq(studentOrganizations.facultyId, a.facultyId),
        eq(studentOrganizations.active, true),
        inArray(studentOrganizations.kind, ['student_union', 'student_activity']),
      ),
    );
  return (
    <section className="portal-screen officer-access-screen">
      <div className="section-heading">
        <div>
          <h1>صلاحيات اتحاد وأنشطة الكلية</h1>
          <p>إدارة القراءة والتعديل والنشر لـ Coordinator الاتحاد والأنشطة داخل كليتك فقط.</p>
        </div>
        <Link className="button secondary" href="/manage/access?assign=1">
          منح صلاحية Coordinator
        </Link>
      </div>
      {params.assign === '1' && (
        <section className="portal-form-section">
          <h2>منح صلاحية Coordinator</h2>
          <OfficerAssignmentForm organizations={organizations} />
        </section>
      )}
      <div className="notice officer-assignment-notice">
        <p>
          تُفعّل شؤون الطلاب حساب الطالب بصلاحية Coordinator للاتحاد أو النشاط داخل الكلية مباشرةً دون
          موافقة الأدمن، تفعيل صلاحية Coordinator لا يمنحه صلاحيات الأقسام تلقائيًا، ولا يغيّر كلمة
          المرور أو عضوية الطالب.
        </p>
      </div>
      <div className="portal-card-grid">
        {rows.map(({ agent: r, name, email, organization }) => (
          <article className="portal-form-section" key={r.id}>
            <h2>{name}</h2>
            <p dir="ltr">{email}</p>
            <p>
              {departmentLabels[r.department]} · {organization} · {agentStatusLabels[r.status]}
            </p>
            <MobileDisclosure title="تعديل صلاحيات الوصول">
              <AgentReviewForm agent={r} />
            </MobileDisclosure>
          </article>
        ))}
      </div>
      {!rows.length && (
        <div className="portal-empty">
          <h2>لا توجد تعيينات اتحاد أو أنشطة في كليتك بعد</h2>
          <p>أضف بريد حساب الطالب واختر الاتحاد أو النشاط من كليتك لتظهر بطاقته هنا.</p>
        </div>
      )}
    </section>
  );
}
