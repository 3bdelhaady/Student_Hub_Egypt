import { GraduationCap, Users, Building2 } from 'lucide-react';
export function PublicStatistics({
  faculties,
  students,
  institutions,
  locale = 'ar',
}: {
  faculties: number;
  students: number;
  institutions: number;
  locale?: 'ar' | 'en';
}) {
  const en = locale === 'en';
  const cards = [
    { title: en ? 'Faculties' : 'عدد الكليات', count: faculties, icon: GraduationCap },
    { title: en ? 'Students' : 'عدد الطلاب', count: students, icon: Users },
    { title: en ? 'Institutions' : 'عدد المؤسسات', count: institutions, icon: Building2 },
  ];
  return (
    <section className="reference-numbers" aria-labelledby="public-statistics-title">
      <div className="container">
        <div className="public-statistics-heading">
          <h2 id="public-statistics-title">
            {en ? 'Student Hub statistics' : 'إحصائيات مركز الطلاب'}
          </h2>
          <p>
            {en
              ? 'Our achievements are greater than numbers can capture, and our goal goes beyond statistics and contributions. We will keep working and making a difference, even in the life of just one student, because every student deserves our effort.'
              : 'إنجازاتنا أكبر من أن تختصرها الأرقام، وهدفنا أسمى من مجرد الإحصائيات والمساهمات. سنواصل العمل وصناعة الأثر، حتى لو كان أثرنا في حياة طالب واحد فقط؛ فكل طالب يستحق أن نبذل من أجله.'}
          </p>
        </div>
        <div className="reference-number-grid">
          {cards.map(({ title, count, icon: Icon }) => (
            <article className="public-statistics-card" key={title}>
              <div className="public-statistics-top">
                <div>
                  <h3>{title}</h3>
                  <strong>{count}</strong>
                </div>
                <Icon size={24} aria-hidden="true" />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
