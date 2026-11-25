import { redirect } from 'next/navigation';
export default async function Settings({
  searchParams,
}: {
  searchParams: Promise<{ modeError?: string }>;
}) {
  const p = await searchParams;
  redirect('/profile' + (p.modeError ? '?modeError=' + encodeURIComponent(p.modeError) : ''));
}
