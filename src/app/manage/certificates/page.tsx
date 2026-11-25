import Certificates from '@/components/certificate-management';
export const metadata = { title: 'سجل الشهادات' };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; new?: string; csv?: string; q?: string }>;
}) {
  return <Certificates searchParams={searchParams} />;
}
