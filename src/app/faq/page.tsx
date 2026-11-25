import Link from 'next/link';
import { publicFaqItems } from '@/lib/faq';
export const metadata = { title: 'الأسئلة الشائعة' };
export default function FAQ() {
  return (
    <section className="reference-document faq-document container">
      <header>
        <h1>الأسئلة الشائعة</h1>
        <p>إليك بعض الأسئلة الأكثر شيوعًا لمساعدتك في استخدام منصة مركز الطلابية.</p>
      </header>
      <div className="reference-accordion">
        {publicFaqItems.map((item, index) => (
          <details key={item.question} open={index === 0}>
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
      <aside className="reference-document-callout">
        <h2>لم تجد إجابة لاستفسارك؟</h2>
        <p>تعرّف على خطوات الحساب والعضوية واستخدام المقررات.</p>
        <Link href="/help" className="button primary">
          تواصل معنا الآن ←
        </Link>
      </aside>
    </section>
  );
}
