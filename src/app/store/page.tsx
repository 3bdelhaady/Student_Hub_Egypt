import { redirect } from 'next/navigation';
import { PortalCatalog } from '@/components/portal-catalog';
export const metadata = { title: 'المتجر' };
export default async function Store({
  searchParams,
}: {
  searchParams: Promise<{
    kind?: string;
    ticketType?: string;
    housingType?: string;
    location?: string;
    maxPrice?: string;
    audience?: string;
    q?: string;
    category?: string;
    saved?: string;
    sort?: string;
  }>;
}) {
  const p = await searchParams;
  if (p.kind === 'trip') redirect('/store?kind=ticket&ticketType=trip');
  if (p.kind === 'training') redirect('/services');
  return <PortalCatalog params={p} />;
}
