import { redirect } from 'next/navigation';
import { requireViewer } from '@/lib/session';
import { ManagementWorkspace } from '@/components/management-workspace';
export const metadata = { title: 'إدارة الخدمات والطلبات' };
export default async function Manage(props: Parameters<typeof ManagementWorkspace>[0]) {
  const v = await requireViewer();
  if (!v.platformAdmin && v.institutionAgent?.department === 'private_sector') {
    const p = await props.searchParams;
    const query = new URLSearchParams(
      Object.entries(p).filter((pair): pair is [string, string] => typeof pair[1] === 'string'),
    );
    redirect('/agent' + (query.size ? '?' + query.toString() : ''));
  }
  return <ManagementWorkspace {...props} />;
}
