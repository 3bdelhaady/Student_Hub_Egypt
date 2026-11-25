import Link from 'next/link';
import { BookOpen, Users, Compass } from 'lucide-react';
export const metadata = { title: 'عن مجتمعنا' };
export default function About() {
  return (
    <>
      <div className="page-top">
        <div className="container narrow">
          <span className="eyebrow">Student Hub — الطلاب أولًا</span>
          <h1>الجامعة مجتمع، وليست مجرد مكان.</h1>
          <p>
            نبني مساحة يقودها الطلاب، تربط المعرفة بالفرص، وتقرب مجتمعات الحرم الجامعي من بعضها.
          </p>
        </div>
      </div>
      <section className="section container narrow">
        <div className="prose">
          <h2>رسالتنا</h2>
          <p>
            بناء مجتمع جامعي مترابط، يتمتع فيه كل طالب بفرص متساوية للوصول إلى الموارد والخبرات التي
            تساعده على النمو أكاديميًا ومهنيًا وشخصيًا.
          </p>
          <hr className="divider" />
          <h2>بداية صغيرة، فكرة أكبر.</h2>
          <p>
            تجمع المنصة المقررات والموارد الأكاديمية ومقالات التعلم في مساحة واحدة، وتساعد الطلاب
            على تنظيم وقتهم ومتابعة تقدمهم.
          </p>
        </div>
        <div className="help-list">
          <div className="panel">
            <BookOpen />
            <h3>معرفة أسهل وصولًا</h3>
            <p>محتوى مرتب يساعدك تركز على فهمك وتعلّمك.</p>
          </div>
          <div className="panel">
            <Users />
            <h3>مجتمع يبدأ بالطلاب</h3>
            <p>المشاركة والمسؤولية والمساواة أساس التجربة.</p>
          </div>
          <div className="panel">
            <Compass />
            <h3>فرص تفتح لك طريق</h3>
            <p>مساحة تحريرية لاكتشاف أفكار جديدة للتعلم والمشاركة.</p>
          </div>
        </div>

        <Link href="/register" className="button primary">
          ابدأ رحلتك
        </Link>
      </section>
    </>
  );
}
