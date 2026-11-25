'use server';
import { reportFailure } from '@/lib/diagnostics';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { requireViewer } from '@/lib/session';
import { createStudentCode, parseGender } from './student-code';
import { refresh, type FormState } from '../shared/form-state';
export async function generateStudentCode(_: FormState, form: FormData): Promise<FormState> {
  const v = await requireViewer();
  const [record] = await db
    .select({ code: user.studentCode, kind: user.signupKind })
    .from(user)
    .where(eq(user.id, v.user.id))
    .limit(1);
  if (!record) return { error: 'تعذر العثور على الحساب.' };
  if (record.code) return { success: 'كود حسابك مسجل بالفعل ولا يتغير.' };
  const kind = v.platformAdmin
    ? 'admin'
    : record.kind === 'student' &&
        v.membership?.role !== 'student' &&
        v.institutionAgent &&
        ['student_affairs', 'private_sector'].includes(v.institutionAgent.department)
      ? v.institutionAgent.department
      : record.kind;
  const gender = parseGender(form.get('gender'));
  if ((kind === 'student' && !gender) || (form.get('gender') && !gender))
    return { error: 'اختر النوع: ولد أو بنت.' };
  try {
    await db
      .update(user)
      .set({ gender, studentCode: createStudentCode(kind, gender) })
      .where(and(eq(user.id, v.user.id), isNull(user.studentCode)));
    refresh();
    return { success: 'تم إنشاء كود حسابك الثابت.' };
  } catch {
    reportFailure('modules.identity.student-code-actions');
    return { error: 'تعذر إنشاء الكود، حاول مرة أخرى.' };
  }
}
