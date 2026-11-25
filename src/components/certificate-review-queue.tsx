import { db } from '@/db';
import { certificateChanges, certificateRecords } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { CertificateReviewForm } from './certificate-review-form';
export async function CertificateReviewQueue({
  universityId,
  facultyId,
}: {
  universityId: string;
  facultyId: string;
}) {
  const changes = await db
    .select()
    .from(certificateChanges)
    .where(
      and(
        eq(certificateChanges.universityId, universityId),
        eq(certificateChanges.facultyId, facultyId),
        eq(certificateChanges.status, 'pending'),
      ),
    )
    .orderBy(desc(certificateChanges.createdAt))
    .limit(200);
  return (
    <section className="certificate-review-queue">
      <h2>طلبات توثيق الشهادات</h2>
      <p>
        الإضافات والتعديلات المقترحة لا تغيّر سجل الشهادة حتى موافقتك، راجع البيانات الأصلية
        والمقترحة.
      </p>
      {changes.map(async (c) => {
        const [old] = c.recordId
          ? await db
              .select()
              .from(certificateRecords)
              .where(eq(certificateRecords.id, c.recordId))
              .limit(1)
          : [];
        return (
          <article key={c.id} className="portal-form-section">
            <h3>{c.certificateTitle}</h3>
            <p>
              السيريال: <span dir="ltr">{c.serial}</span>
            </p>
            <p>الجهة: {c.department === 'student_union' ? 'اتحاد الطلاب' : 'النشاط الطلابي'}</p>
            {old && (
              <div>
                <h4>البيانات الحالية</h4>
                <p>
                  {old.recipientName} · {old.certificateTitle} · {old.issuedOn}
                </p>
              </div>
            )}
            <h4>البيانات المقترحة</h4>
            <p>
              {c.recipientName} · {c.certificateTitle} · {c.issuedOn}
            </p>
            <CertificateReviewForm id={c.id} />
          </article>
        );
      })}
      {!changes.length && <p>لا توجد طلبات شهادات قيد المراجعة.</p>}
    </section>
  );
}
