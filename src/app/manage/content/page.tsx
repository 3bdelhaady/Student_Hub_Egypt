import AgentPage from '@/app/agent/page';
export const metadata = { title: 'إدارة محتوى الجهة' };
export default async function Content({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; new?: string }>;
}) {
  return (
    <AgentPage searchParams={Promise.resolve({ ...(await searchParams), manage: 'content' })} />
  );
}
