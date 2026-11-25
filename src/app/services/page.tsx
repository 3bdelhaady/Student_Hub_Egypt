import { redirect } from 'next/navigation';
import { CertificateVerification } from '@/components/certificate-forms';
import { studentAreaViewer } from '@/lib/session';
import Link from 'next/link';
import { StudentLink } from '@/components/student-link';
import { Volunteering } from '@/components/volunteering';
import { AcademicTeams } from '@/components/academic-teams';
import { PortalCatalog } from '@/components/portal-catalog';
import { StudentVoice } from '@/components/student-voice';
import { LearningCenter } from '@/components/learning-center';
export const metadata = { title: 'الخدمات الأساسية' };
export default async function Services({
  searchParams,
}: {
  searchParams: Promise<{
    kind?: string;
    opportunity?: string;
    apply?: string;
    demos?: string;
    poll?: string;
    volunteer?: string;
    organization?: string;
    course?: string;
    teamPage?: string;
    q?: string;
    category?: string;
    saved?: string;
    sort?: string;
  }>;
}) {
  const params = await searchParams;
  if (params.kind === 'trip') redirect('/store?kind=ticket&ticketType=trip');
  if (params.kind === 'training') redirect('/services');
  if (params.kind === 'certificate') {
    const v = await studentAreaViewer();
    return v ? (
      <CertificateVerification />
    ) : (
      <section className="certificate-gate">
        <h1>بوابة التحقق من الشهادات</h1>
        <p>سجل الدخول للتحقق باستخدام السيريال الكامل.</p>
        <Link className="button primary" href="/login?next=%2Fservices%3Fkind%3Dcertificate">
          تسجيل الدخول للتحقق
        </Link>
      </section>
    );
  }
  if (params.kind === 'service') return <StudentLink params={params} />;
  if (params.kind === 'volunteer') return <Volunteering params={params} />;
  if (params.kind === 'team') return <AcademicTeams params={params} />;
  if (params.kind === 'poll') return <StudentVoice params={params} />;
  if (!params.kind && !params.q && !params.category && !params.saved && !params.sort)
    return <LearningCenter />;
  return <PortalCatalog service params={params} />;
}
