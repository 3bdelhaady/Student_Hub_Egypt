import { PortalDetail } from '@/components/portal-detail';
export default async function Detail({ params }: { params: Promise<{ id: string }> }) {
  return <PortalDetail id={(await params).id} />;
}
