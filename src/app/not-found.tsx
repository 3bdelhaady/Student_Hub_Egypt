import { Empty } from '@/components/ui';
export default function NotFound() {
  return (
    <section className="section container">
      <Empty
        title="هذه الصفحة غير موجودة."
        body="ربما تغيّر الرابط أو لم يُنشر المحتوى بعد، عد إلى الرئيسية واكتشف مساحتك."
        href="/"
        label="الصفحة الرئيسية"
      />
    </section>
  );
}
