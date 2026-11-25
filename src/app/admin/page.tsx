import Link from 'next/link';
import { PlatformAdmin } from '@/components/platform-admin';
import { requireViewer } from '@/lib/session';
import { canManageContent, canManageMembers } from '@/lib/policy';
import { db } from '@/db';
import { courses, posts, resources, memberships, user, auditEvents, faculties } from '@/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import {
  FacultyForm,
  ActivationCsvForm,
  CourseForm,
  PostForm,
  ResourceForm,
  MemberDecision,
} from '@/components/forms';
import { Empty, Stat } from '@/components/ui';
import {
  ShieldCheck,
  BookOpen,
  Newspaper,
  Users,
  History,
  Files,
  LayoutDashboard,
} from 'lucide-react';
export const metadata = { title: 'إدارة المجتمع' };
const tabs = [
  ['overview', 'نظرة عامة', LayoutDashboard],
  ['courses', 'المقررات', BookOpen],
  ['resources', 'الموارد', Files],
  ['posts', 'الأخبار والفرص', Newspaper],
  ['faculties', 'الكليات المتاحة', ShieldCheck],
  ['members', 'العضويات', Users],
  ['audit', 'سجل النشاط', History],
] as const;
export default async function Admin({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; edit?: string; new?: string }>;
}) {
  const v = await requireViewer();
  const platformParams = await searchParams;
  if (
    v.platformAdmin &&
    (!platformParams.tab ||
      [
        'institutions',
        'agents',
        'students',
        'institution-audit',
        'organizations',
        'domain-content',
      ].includes(platformParams.tab))
  )
    return (
      <PlatformAdmin
        tab={platformParams.tab || 'institutions'}
        edit={platformParams.edit}
        create={platformParams.new === '1'}
      />
    );
  const m = v.membership;
  if (!m || !canManageContent(m, m.universityId))
    return (
      <section className="section container">
        <Empty
          title="هذه المساحة لفريق الإدارة."
          body="حسابك لا يملك صلاحية إدارة المحتوى، الصلاحيات تُراجع على الخادم، ولا تُمنح من نموذج التسجيل."
          href="/account"
          label="العودة لحسابي"
        />
      </section>
    );
  const params = await searchParams;
  const tab = params.tab || 'overview';
  const scope = m.universityId;
  const editableCourseScope = v.platformAdmin
    ? undefined
    : sql`NOT EXISTS(SELECT 1 FROM agent_course_scopes s WHERE s.course_id=${courses.id})`;
  const [cc, pp, rr, mm, aa, ff] = await Promise.all([
    db
      .select()
      .from(courses)
      .where(and(eq(courses.universityId, scope), editableCourseScope)),
    db.select().from(posts).where(eq(posts.universityId, scope)),
    db
      .select({ resource: resources, courseTitle: courses.title })
      .from(resources)
      .innerJoin(courses, eq(resources.courseId, courses.id))
      .where(and(eq(courses.universityId, scope), editableCourseScope)),
    v.platformAdmin && canManageMembers(m, scope)
      ? db
          .select({ membership: memberships, name: user.name, email: user.email })
          .from(memberships)
          .innerJoin(user, eq(memberships.userId, user.id))
          .where(eq(memberships.universityId, scope))
      : Promise.resolve([]),
    db
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.universityId, scope))
      .orderBy(desc(auditEvents.createdAt))
      .limit(40),
    v.platformAdmin && canManageMembers(m, scope)
      ? db.select().from(faculties).where(eq(faculties.universityId, scope)).orderBy(faculties.name)
      : Promise.resolve([]),
  ]);
  const editCourse = cc.find((c) => c.id === params.edit);
  const editPost = pp.find((p) => p.id === params.edit);
  const editResource = rr.find((r) => r.resource.id === params.edit)?.resource;
  const editing = params.new === '1' || !!params.edit;
  return (
    <>
      <div className="page-top">
        <div className="container">
          <span className="eyebrow">
            <ShieldCheck size={15} /> مساحة الإدارة
          </span>
          <h1>مجتمع منظم، أثر أكبر.</h1>
          <p>إدارة محتوى وعضويات مجتمعك فقط، كل التغييرات الحساسة مسجلة في سجل النشاط.</p>
        </div>
      </div>
      <section className="section container dashboard-grid">
        <aside className="dashboard-nav">
          {tabs
            .filter(
              ([key]) =>
                !['members', 'faculties'].includes(key) ||
                (v.platformAdmin && canManageMembers(m, scope)),
            )
            .map(([key, label, Icon]) => (
              <Link key={key} href={`/admin?tab=${key}`}>
                <Icon size={17} />
                {label}
              </Link>
            ))}
          {v.platformAdmin && <Link href="/admin?tab=institutions">إدارة المؤسسات والوكلاء</Link>}
          <Link href="/account">العودة لحسابي</Link>
        </aside>
        <div>
          {tab === 'overview' && (
            <>
              <div className="stats">
                <Stat value={cc.length} label="مقررات" />
                <Stat value={pp.length} label="أخبار وفرص" />
                <Stat value={rr.length} label="موارد تعليمية" />
              </div>
              <div className="panel">
                <h2>أهلًا بفريق المجتمع.</h2>
                <p>
                  ابدأ بإضافة مقرر وموارده، أو نشر خبر، المحتوى غير المنشور لا يظهر للعامة، والموارد
                  الأكاديمية محمية بعضوية مفعّلة.
                </p>
                <Link href="/admin?tab=courses&new=1" className="button primary">
                  إضافة مقرر
                </Link>
              </div>
              <div className="notice warning">
                تُراجع طلبات العضوية داخل نطاق المجتمع، وتُسجّل قرارات الإدارة في سجل النشاط.
              </div>
            </>
          )}
          {tab === 'faculties' && v.platformAdmin && canManageMembers(m, scope) && (
            <div className="panel">
              <div className="section-heading">
                <h2>الكليات المتاحة</h2>
                <Link
                  className="text-link"
                  href={editing ? '/admin?tab=faculties' : '/admin?tab=faculties&new=1'}
                >
                  {editing ? 'رجوع للقائمة' : '+ إضافة كلية'}
                </Link>
              </div>
              <p>
                قائمة كليات مجتمعك فقط، تعطيل كلية يمنع الطلبات الجديدة ولا يغيّر عضويات الطلاب
                الحاليين.
              </p>
              {editing ? (
                params.edit && !ff.some((f) => f.id === params.edit) ? (
                  <p>الكلية غير موجودة في نطاقك.</p>
                ) : (
                  <FacultyForm
                    key={params.edit || 'new'}
                    value={ff.find((f) => f.id === params.edit)}
                  />
                )
              ) : (
                <div className="table-wrap" tabIndex={0} aria-label="قائمة الكليات">
                  <table>
                    <thead>
                      <tr>
                        <th>الكلية</th>
                        <th>الحالة</th>
                        <th>إدارة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ff.map((f) => (
                        <tr key={f.id}>
                          <td>{f.name}</td>
                          <td>{f.active ? 'متاحة' : 'غير متاحة'}</td>
                          <td>
                            <Link className="text-link" href={`/admin?tab=faculties&edit=${f.id}`}>
                              تعديل
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!ff.length && <p>لم تُضف كليات بعد، أضف كلية حتى يستطيع الطلاب اختيارها.</p>}
                </div>
              )}
            </div>
          )}
          {tab === 'courses' && (
            <div className="panel">
              <div className="section-heading">
                <h2>{editing ? 'محرر المقرر' : 'المقررات'}</h2>
                <Link
                  className="text-link"
                  href={editing ? '/admin?tab=courses' : '/admin?tab=courses&new=1'}
                >
                  {editing ? 'رجوع للقائمة' : '+ إضافة مقرر'}
                </Link>
              </div>
              {editing ? (
                params.edit && !editCourse ? (
                  <p>المقرر غير موجود في نطاقك.</p>
                ) : (
                  <CourseForm
                    key={params.edit || 'new'}
                    value={editCourse}
                    categories={cc.map((c) => c.category)}
                  />
                )
              ) : (
                <div className="table-wrap" tabIndex={0} aria-label="جدول بيانات قابل للتمرير">
                  <table>
                    <thead>
                      <tr>
                        <th>المقرر</th>
                        <th>التصنيف</th>
                        <th>الحالة</th>
                        <th>إدارة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cc.map((c) => (
                        <tr key={c.id}>
                          <td>{c.title}</td>
                          <td>{c.category}</td>
                          <td>
                            <span className="tag">{c.published ? 'منشور' : 'مسودة'}</span>
                          </td>
                          <td>
                            <Link className="text-link" href={`/admin?tab=courses&edit=${c.id}`}>
                              تعديل
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          {tab === 'posts' && (
            <div className="panel">
              <div className="section-heading">
                <h2>{editing ? 'محرر المحتوى' : 'الأخبار والفرص'}</h2>
                <Link
                  className="text-link"
                  href={editing ? '/admin?tab=posts' : '/admin?tab=posts&new=1'}
                >
                  {editing ? 'رجوع للقائمة' : '+ إضافة محتوى'}
                </Link>
              </div>
              {editing ? (
                params.edit && !editPost ? (
                  <p>المحتوى غير موجود في نطاقك.</p>
                ) : (
                  <PostForm
                    key={params.edit || 'new'}
                    value={editPost}
                    categories={pp.map((p) => p.category)}
                  />
                )
              ) : (
                <div className="table-wrap" tabIndex={0} aria-label="جدول بيانات قابل للتمرير">
                  <table>
                    <thead>
                      <tr>
                        <th>العنوان</th>
                        <th>النوع</th>
                        <th>الحالة</th>
                        <th>إدارة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pp.map((p) => (
                        <tr key={p.id}>
                          <td>{p.title}</td>
                          <td>{p.kind === 'news' ? 'خبر' : 'فرصة'}</td>
                          <td>
                            <span className="tag">{p.published ? 'منشور' : 'مسودة'}</span>
                          </td>
                          <td>
                            <Link className="text-link" href={`/admin?tab=posts&edit=${p.id}`}>
                              تعديل
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          {tab === 'resources' && (
            <div className="panel">
              <div className="section-heading">
                <h2>{editing ? 'محرر المورد' : 'الموارد'}</h2>
                <Link
                  className="text-link"
                  href={editing ? '/admin?tab=resources' : '/admin?tab=resources&new=1'}
                >
                  {editing ? 'رجوع للقائمة' : '+ إضافة مورد'}
                </Link>
              </div>
              {editing ? (
                params.edit && !editResource ? (
                  <p>المورد غير موجود في نطاقك.</p>
                ) : cc.length ? (
                  <ResourceForm key={params.edit || 'new'} courses={cc} value={editResource} />
                ) : (
                  <p>أضف مقررًا أولًا.</p>
                )
              ) : (
                <div className="table-wrap" tabIndex={0} aria-label="جدول بيانات قابل للتمرير">
                  <table>
                    <thead>
                      <tr>
                        <th>العنوان</th>
                        <th>المقرر</th>
                        <th>إدارة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rr.map((r) => (
                        <tr key={r.resource.id}>
                          <td>{r.resource.title}</td>
                          <td>{r.courseTitle}</td>
                          <td>
                            <Link
                              className="text-link"
                              href={`/admin?tab=resources&edit=${r.resource.id}`}
                            >
                              تعديل
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          {tab === 'members' &&
            (v.platformAdmin && canManageMembers(m, scope) ? (
              <div className="panel">
                <h2>مراجعة العضويات</h2>
                <details className="resource">
                  <summary>استيراد تفعيل من CSV</summary>
                  <div style={{ padding: 20 }}>
                    <ActivationCsvForm />
                  </div>
                </details>
                <p>راجع الطلب قبل تغيير الحالة، بيانات الهوية الخاصة لا تظهر في قوائم العضوية.</p>
                <div className="table-wrap" tabIndex={0} aria-label="جدول بيانات قابل للتمرير">
                  <table>
                    <thead>
                      <tr>
                        <th>الاسم</th>
                        <th>الكلية</th>
                        <th>الحالة</th>
                        <th>قرار المراجعة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mm.map((row) => (
                        <tr key={row.membership.id}>
                          <td>
                            {row.name}
                            <small className="table-email">{row.email}</small>
                          </td>
                          <td>{row.membership.faculty || '—'}</td>
                          <td>
                            {
                              (
                                {
                                  pending: 'قيد المراجعة',
                                  active: 'مفعّل',
                                  rejected: 'مرفوض',
                                  suspended: 'موقوف',
                                } as Record<string, string>
                              )[row.membership.status]
                            }
                          </td>
                          <td>
                            {row.membership.role === 'student' ? (
                              <MemberDecision
                                id={row.membership.id}
                                status={row.membership.status}
                              />
                            ) : (
                              <span className="tag">فريق الإدارة</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <Empty title="صلاحية غير متاحة" body="مراجعة العضويات لمسؤول المجتمع فقط." />
            ))}
          {tab === 'audit' && (
            <div className="panel">
              <h2>سجل النشاط</h2>
              <p>آخر ٤٠ عملية في مجتمعك، السجل لا يحتوي كلمات مرور أو نصوص موارد.</p>
              <div className="table-wrap" tabIndex={0} aria-label="جدول بيانات قابل للتمرير">
                <table>
                  <thead>
                    <tr>
                      <th>العملية</th>
                      <th>المرجع</th>
                      <th>التوقيت</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aa.map((a) => (
                      <tr key={a.id}>
                        <td dir="ltr">{a.action}</td>
                        <td>
                          <code>{a.entityId.slice(0, 16)}</code>
                        </td>
                        <td>{a.createdAt.toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {!tabs.some(([key]) => key === tab) && (
            <Empty
              title="القسم غير موجود"
              body="اختر قسمًا من قائمة الإدارة."
              href="/admin"
              label="نظرة عامة"
            />
          )}
        </div>
      </section>
    </>
  );
}
