import { db } from '@/db';
import { socialPosts, socialPostMedia } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { viewer } from '@/lib/session';
import { isAgentMode } from '@/modules/identity/mode-policy';
import { activeEntryScope } from '@/modules/portal/queries';
import { socialAccess, sameSocialScope } from '@/modules/social/policy';
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const v = await viewer();
  const a = v?.institutionAgent;
  const denied = () =>
    new Response(null, { status: 404, headers: { 'Cache-Control': 'private, no-store' } });
  if (!v || !a || !isAgentMode(v) || !socialAccess(a, await activeEntryScope(a))) return denied();
  const { id } = await params;
  const [post] = await db.select().from(socialPosts).where(eq(socialPosts.id, id)).limit(1);
  if (
    !post ||
    !sameSocialScope(a, post) ||
    (a.department !== 'student_affairs' && post.authorId !== v.user.id) ||
    !post.mediaType
  )
    return denied();
  const [media] = await db
    .select()
    .from(socialPostMedia)
    .where(eq(socialPostMedia.postId, id))
    .limit(1);
  if (!media) return denied();
  const bytes = Buffer.from(media.data, 'base64');
  const headers = {
    'Content-Type': post.mediaType,
    'Content-Length': String(bytes.length),
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
    'Content-Disposition': 'inline',
    'Accept-Ranges': 'bytes',
  };
  const range = request.headers.get('range');
  if (range) {
    const m = /^bytes=(\d+)-(\d*)$/.exec(range);
    if (!m)
      return new Response(null, {
        status: 416,
        headers: { ...headers, 'Content-Range': `bytes */${bytes.length}`, 'Content-Length': '0' },
      });
    const start = Number(m[1]),
      end = m[2] ? Math.min(Number(m[2]), bytes.length - 1) : bytes.length - 1;
    if (start > end || start >= bytes.length)
      return new Response(null, {
        status: 416,
        headers: { ...headers, 'Content-Range': `bytes */${bytes.length}`, 'Content-Length': '0' },
      });
    return new Response(bytes.subarray(start, end + 1), {
      status: 206,
      headers: {
        ...headers,
        'Content-Length': String(end - start + 1),
        'Content-Range': `bytes ${start}-${end}/${bytes.length}`,
      },
    });
  }
  return new Response(bytes, { headers });
}
