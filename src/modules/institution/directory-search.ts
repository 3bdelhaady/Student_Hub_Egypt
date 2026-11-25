'use server';
import { requireViewer } from '@/lib/session';
import { db } from '@/db';
import {
  institutions,
  institutionAgents,
  memberships,
  faculties,
  universities,
  user,
} from '@/db/schema';
import { eq, and, or, ilike, isNull, desc, sql } from 'drizzle-orm';
import { institutionKinds, departmentLabels, agentStatusLabels, accountRoleLabel } from './policy';
import type { DirectoryRow } from '@/components/console-directory';
export async function searchAdminDirectory(kind: string, query: string): Promise<DirectoryRow[]> {
  const v = await requireViewer();
  if (!v.platformAdmin) return [];
  const q = query.trim().slice(0, 160);
  if (!q) return [];
  const pattern = '%' + q.replace(/[\\%_]/g, '\\$&') + '%';
  const labelConditions = <T extends string>(
    labels: Record<string, string>,
    column: Parameters<typeof eq>[0],
  ) =>
    Object.entries(labels)
      .filter(([, label]) => label.toLocaleLowerCase('ar').includes(q.toLocaleLowerCase('ar')))
      .map(([key]) => eq(column, key as T));
  if (kind === 'institutions') {
    const rows = await db
      .select({
        i: institutions,
        agentCount: sql<number>`(select count(*)::int from institution_agents a where a.institution_id=${institutions.id})`,
      })
      .from(institutions)
      .where(
        and(
          isNull(institutions.deletedAt),
          or(
            ilike(institutions.name, pattern),
            ...labelConditions(institutionKinds, institutions.kind),
            ...['منشط', 'غير منشط']
              .filter((label) => label.includes(q))
              .map((label) => eq(institutions.active, label === 'منشط')),
            ilike(
              sql<string>`(select count(*)::text || ' وكلاء' from institution_agents a where a.institution_id=${institutions.id})`,
              pattern,
            ),
          ),
        ),
      )
      .orderBy(desc(institutions.createdAt))
      .limit(100);
    return rows.map(({ i, agentCount }) => ({
      id: i.id,
      title: i.name,
      category: institutionKinds[i.kind],
      status: i.active ? 'منشط' : 'غير منشط',
      cells: [institutionKinds[i.kind], `${agentCount} وكلاء`, i.active ? 'منشط' : 'غير منشط'],
      href: `/admin?tab=institutions&edit=${i.id}`,
      institutionState: { active: i.active },
    }));
  }
  if (kind === 'agents') {
    const rows = await db
      .select({
        a: institutionAgents,
        name: user.name,
        email: user.email,
        institution: institutions.name,
      })
      .from(institutionAgents)
      .innerJoin(user, eq(user.id, institutionAgents.userId))
      .innerJoin(institutions, eq(institutions.id, institutionAgents.institutionId))
      .where(
        and(
          or(
            eq(institutionAgents.department, 'student_affairs'),
            eq(institutionAgents.department, 'private_sector'),
          ),
          or(
            ilike(user.name, pattern),
            ilike(user.email, pattern),
            ilike(institutions.name, pattern),
            ...labelConditions(departmentLabels, institutionAgents.department),
            ...labelConditions(agentStatusLabels, institutionAgents.status),
            ...['student_affairs', 'private_sector']
              .filter((d) =>
                accountRoleLabel(d as 'student_affairs' | 'private_sector')
                  .toLocaleLowerCase('ar')
                  .includes(q.toLocaleLowerCase('ar')),
              )
              .map((d) =>
                eq(institutionAgents.department, d as 'student_affairs' | 'private_sector'),
              ),
          ),
        ),
      )
      .orderBy(desc(institutionAgents.createdAt))
      .limit(100);
    return rows.map(({ a, name, email, institution }) => ({
      id: a.id,
      title: name,
      subtitle: `${email} · ${accountRoleLabel(a.department)}`,
      category: institution,
      status: agentStatusLabels[a.status],
      cells: [departmentLabels[a.department], institution, agentStatusLabels[a.status]],
      href: `/admin?tab=agents&edit=${a.id}`,
      accountToggle: { id: a.id, kind: 'agent', active: a.status === 'active' },
    }));
  }
  if (kind === 'students') {
    const rows = await db
      .select({
        m: memberships,
        name: user.name,
        email: user.email,
        university: universities.name,
        faculty: faculties.name,
        coordinator: sql<boolean>`exists(select 1 from institution_agents a where a.user_id=${user.id} and a.department in ('student_union','student_activity'))`,
      })
      .from(memberships)
      .innerJoin(user, eq(user.id, memberships.userId))
      .innerJoin(universities, eq(universities.id, memberships.universityId))
      .leftJoin(faculties, eq(faculties.id, memberships.facultyId))
      .where(
        and(
          eq(memberships.role, 'student'),
          or(
            ilike(user.name, pattern),
            ilike(user.email, pattern),
            ilike(universities.name, pattern),
            ilike(faculties.name, pattern),
            ...labelConditions(agentStatusLabels, memberships.status),
            ...('دون كلية (قطاع خاص)'.includes(q) ? [isNull(faculties.id)] : []),
            ...('coordinator'.includes(q.toLowerCase())
              ? [
                  sql<boolean>`exists(select 1 from institution_agents a where a.user_id=${user.id} and a.department in ('student_union','student_activity'))`,
                ]
              : []),
          ),
        ),
      )
      .orderBy(desc(memberships.createdAt))
      .limit(100);
    return rows.map(({ m, name, email, university, faculty, coordinator }) => ({
      id: m.userId,
      title: name,
      subtitle: email + (coordinator ? ' · Coordinator' : ''),
      category: university,
      status: agentStatusLabels[m.status] || m.status,
      cells: [
        university,
        faculty || 'دون كلية (قطاع خاص)',
        agentStatusLabels[m.status] || m.status,
      ],
      accountToggle: { id: m.id, kind: 'student', active: m.status === 'active' },
    }));
  }

  return [];
}
