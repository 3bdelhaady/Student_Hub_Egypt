'use client';
import { useState, useEffect } from 'react';
import { SocialMediaPreview } from './social-media-preview';
import { validSocialMedia, socialMediaTypes, type SocialContentType } from '@/modules/social/media';
import { ActionForm } from './portal-forms';
import { submitSocialPost, reviewSocialPost } from '@/modules/social/actions';
import { socialChannels } from '@/modules/social/policy';
export function SocialPostForm({
  post,
}: {
  post?: {
    id: string;
    channel: string;
    scope: string;
    body: string;
    contentType: string;
    mediaName: string | null;
    status: string;
    reviewNote: string;
    revision: string;
    scheduledAt: string;
  };
}) {
  const [kind, setKind] = useState<SocialContentType>(
    (post?.contentType as SocialContentType) || 'text',
  );
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    if (!file) {
      setPreview('');
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return (
    <ActionForm
      action={post ? reviewSocialPost : submitSocialPost}
      label={post ? 'حفظ التعديلات وإعادة المراجعة' : 'إرسال إلى شؤون الطلاب'}
    >
      {post && (
        <>
          <input type="hidden" name="id" value={post.id} />
          <input type="hidden" name="revision" value={post.revision} />
        </>
      )}
      <label>
        قناة التواصل
        <select name="channel" defaultValue={post?.channel || 'facebook'}>
          {Object.entries(socialChannels).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label>
        القناة التابعة لـ
        <select name="scope" defaultValue={post?.scope || 'faculty'}>
          <option value="faculty">الكلية</option>
          <option value="university">الجامعة</option>
        </select>
      </label>
      <label>
        نوع محتوى المنشور
        <select
          name="contentType"
          value={kind}
          onChange={(e) => {
            setKind(e.target.value as SocialContentType);
            setFile(null);
            setError('');
          }}
        >
          <option value="text">نص</option>
          <option value="image">ملف صورة</option>
          <option value="video">ملف فيديو</option>
        </select>
      </label>
      {kind !== 'text' && (
        <>
          <label>
            {kind === 'image' ? 'ملف الصورة' : 'ملف الفيديو'}
            <input
              key={kind}
              type="file"
              name="media"
              accept={socialMediaTypes[kind].join(',')}
              required={post?.contentType !== kind}
              onChange={(e) => {
                const selected = e.target.files?.[0];
                if (selected && !validSocialMedia(kind, selected.type, selected.size)) {
                  setError('اختر ملفًا مدعومًا لا يتجاوز 3 ميجابايت.');
                  e.target.value = '';
                  setFile(null);
                  return;
                }
                setError('');
                setFile(selected || null);
              }}
            />
          </label>
          <p className="form-hint">
            الحد الأقصى 3 ميجابايت لكل ملف. الصور: JPG أو PNG أو WebP. الفيديو: MP4 أو WebM.{' '}
            {post?.contentType === kind && 'اترك الملف فارغًا للاحتفاظ بالمرفق الحالي.'}
          </p>
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          {(preview || post?.contentType === kind) && (
            <SocialMediaPreview
              kind={kind}
              src={
                preview || `/api/social/media/${post!.id}?v=${encodeURIComponent(post!.revision)}`
              }
              name={file?.name || post?.mediaName}
            />
          )}
        </>
      )}
      <label>
        {kind === 'text' ? 'محتوى المنشور' : 'وصف المرفق (اختياري)'}
        <textarea
          name="body"
          rows={6}
          minLength={kind === 'text' ? 10 : undefined}
          maxLength={10000}
          required={kind === 'text'}
          defaultValue={post?.body}
        />
      </label>
      {post && (
        <>
          <label>
            ملاحظة المراجعة
            <textarea name="reviewNote" rows={2} maxLength={2000} defaultValue={post.reviewNote} />
          </label>
          <label>
            موعد النشر بتوقيت القاهرة
            <input name="scheduledAt" type="datetime-local" defaultValue={post.scheduledAt} />
          </label>
          <p className="form-hint">
            الجدولة داخلية فقط، لا يوجد إرسال تلقائي أو نشر فعلي حتى ربط القنوات الرسمية.
          </p>
          <label>
            القرار
            <select name="intent" defaultValue="edit">
              <option value="edit">حفظ التعديلات وإعادة المراجعة</option>
              <option value="approve">قبول</option>
              <option value="reject">رفض</option>
              <option value="schedule">جدولة داخلية</option>
              {['approved', 'scheduled', 'ready'].includes(post.status) && (
                <option value="publish">نشر، غير متصل حاليًا</option>
              )}
            </select>
          </label>
        </>
      )}
    </ActionForm>
  );
}
