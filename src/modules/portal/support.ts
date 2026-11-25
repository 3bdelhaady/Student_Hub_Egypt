import { db } from '@/db';
import {
  institutions,
  institutionAgents,
  studentOrganizations,
  supportDestinations,
  faculties,
} from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { activeEntryScope } from './queries';
import { sameDomain, activeAgent } from '../institution/policy';
import type { viewer } from '@/lib/session';
import type { Tx } from '../institution/service';
type Viewer = NonNullable<Awaited<ReturnType<typeof viewer>>>;
export async function studentSupportRecipients(v: Viewer, tx: Tx | typeof db = db) {
  const m = v.membership;
  if (
    !m ||
    m.role !== 'student' ||
    !['active', 'pending'].includes(m.status) ||
    !m.facultyId ||
    v.activeMode === 'agent'
  )
    return [];
  const [faculty] = await tx
    .select()
    .from(faculties)
    .where(and(eq(faculties.id, m.facultyId), eq(faculties.active, true)))
    .limit(1);
  if (!faculty) return [];
  const agents = await tx
    .select()
    .from(institutionAgents)
    .where(
      and(
        eq(institutionAgents.universityId, m.universityId),
        eq(institutionAgents.facultyId, m.facultyId),
        eq(institutionAgents.status, 'active'),
        eq(institutionAgents.canRead, true),
      ),
    );
  const result: {
    id: string;
    label: string;
    institutionId: string;
    universityId: string;
    facultyId: string;
    organizationId: string | null;
    department: string;
  }[] = [];
  for (const a of agents) {
    if (a.department !== 'student_affairs' || !(await activeEntryScope(a, tx))) continue;
    const id = [a.institutionId, a.facultyId, a.department, a.organizationId || ''].join(':');
    if (!result.some((r) => r.id === id))
      result.push({
        id,
        label: 'شؤون الطلاب · ' + faculty.name,
        institutionId: a.institutionId,
        universityId: m.universityId,
        facultyId: m.facultyId,
        organizationId: a.organizationId,
        department: a.department,
      });
  }
  if (!result.some((r) => r.department === 'student_affairs')) {
    const [institution] = await tx
      .select()
      .from(institutions)
      .where(and(eq(institutions.universityId, m.universityId), eq(institutions.active, true)))
      .limit(1);
    if (institution)
      result.push({
        id: [institution.id, m.facultyId, 'student_affairs', ''].join(':'),
        label: 'شؤون الطلاب · ' + faculty.name,
        institutionId: institution.id,
        universityId: m.universityId,
        facultyId: m.facultyId,
        organizationId: null,
        department: 'student_affairs',
      });
  }
  const organizations = await tx
    .select()
    .from(studentOrganizations)
    .where(
      and(
        eq(studentOrganizations.universityId, m.universityId),
        eq(studentOrganizations.active, true),
      ),
    );
  for (const o of organizations) {
    if (
      o.kind !== 'student_activity' &&
      !(o.kind === 'student_union' && o.facultyId === m.facultyId)
    )
      continue;
    const scope = {
      institutionId: o.institutionId,
      universityId: o.universityId,
      facultyId: o.facultyId,
      organizationId: o.id,
      department: o.kind,
    };
    if (!scope.facultyId || !(await activeEntryScope(scope, tx))) continue;
    const [targetFaculty] = await tx
      .select({ name: faculties.name })
      .from(faculties)
      .where(eq(faculties.id, scope.facultyId))
      .limit(1);
    result.push({
      ...scope,
      facultyId: scope.facultyId,
      id: [o.institutionId, o.facultyId, o.kind, o.id].join(':'),
      label:
        (o.kind === 'student_union' ? 'اتحاد الطلاب' : 'نشاط طلابي') +
        ' · ' +
        o.name +
        (targetFaculty ? ' · ' + targetFaculty.name : ''),
    });
  }
  return result;
}
export async function supportAccess(
  v: Viewer,
  requestId: string,
  edit = false,
  tx: Tx | typeof db = db,
) {
  const [target] = await tx
    .select()
    .from(supportDestinations)
    .where(eq(supportDestinations.requestId, requestId))
    .limit(1);
  if (!target) return v.platformAdmin;
  const query = tx.select().from(institutionAgents).where(eq(institutionAgents.userId, v.user.id));
  const [a] = await (edit ? query.for('share') : query).limit(1);
  return (
    !!a &&
    activeAgent(a, await activeEntryScope(target, tx)) &&
    sameDomain(a, target) &&
    (!edit || a.canEdit)
  );
}
