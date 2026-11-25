'use server';
import { reportFailure } from '@/lib/diagnostics';
import { requireViewer } from '@/lib/session';
import { db } from '@/db';
import { platformAdmins } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { commitRequestedCleanup } from '@/modules/institution/requested-cleanup';
import { refresh, type FormState } from '@/modules/shared/form-state';
export async function requestedCleanup(_: FormState, form: FormData): Promise<FormState> {
  const v = await requireViewer();
  const admins = await db.select().from(platformAdmins).where(eq(platformAdmins.userId, v.user.id));
  if (!v.platformAdmin || !admins.length || form.get('confirm') !== 'حذف الحسابات غير المحددة')
    return { error: 'راجع الصلاحيات وعبارة التأكيد.' };
  try {
    const result = await commitRequestedCleanup(String(form.get('digest') || ''), v.user.id);
    refresh();
    return {
      success: `تم حذف ${result.accounts} حسابات و${result.institutions} مؤسسات غير مستخدمة.`,
    };
  } catch {
    reportFailure('app.admin.cleanup.actions');
    return { error: 'تغيرت القائمة أو اكتمل التنظيف بالفعل. أعد تحميل المعاينة.' };
  }
}
