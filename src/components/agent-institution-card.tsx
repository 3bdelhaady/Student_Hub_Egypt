import { withInstitutionRestaurant } from '@/modules/institution/restaurant-info';
import { db } from '@/db';
import { institutions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { restaurantDetails, restaurantHours } from '@/modules/portal/restaurants';
import { type PortalEntry } from '@/modules/portal/queries';
export async function AgentInstitutionCard({
  institutionId,
  entries,
  kind,
  entryId,
}: {
  institutionId: string;
  entries: PortalEntry[];
  kind: string;
  entryId?: string;
}) {
  const [i] = await db
    .select()
    .from(institutions)
    .where(eq(institutions.id, institutionId))
    .limit(1);
  if (!i) return null;
  const restaurants =
    kind === 'restaurant'
      ? entries.filter((e) => e.kind === 'restaurant' && (!entryId || e.id === entryId))
      : [];
  return (
    <section className="portal-form-section agent-institution-card" aria-label="بيانات المؤسسة">
      <h2>بيانات المؤسسة</h2>
      <h3>{i.name}</h3>
      {i.restaurantInfo?.logo && (
        <img
          src={i.restaurantInfo.logo}
          alt="لوجو المطعم"
          style={{ maxWidth: 100, maxHeight: 100 }}
        />
      )}
      {i.restaurantInfo?.cover && (
        <img
          src={i.restaurantInfo.cover}
          alt="كافر المطعم"
          style={{ maxWidth: '100%', maxHeight: 220, objectFit: 'cover' }}
        />
      )}
      {i.restaurantInfo && !restaurants.length && (
        <dl>
          <div>
            <dt>مواعيد العمل</dt>
            <dd>
              {i.restaurantInfo.opensAt && i.restaurantInfo.closesAt
                ? i.restaurantInfo.opensAt + ' - ' + i.restaurantInfo.closesAt
                : 'لم تحدد الإدارة المواعيد بعد'}
            </dd>
          </div>
          {i.restaurantInfo.phone && (
            <div>
              <dt>هاتف التواصل</dt>
              <dd>{i.restaurantInfo.phone}</dd>
            </div>
          )}
          {i.restaurantInfo.location && (
            <div>
              <dt>العنوان</dt>
              <dd>{i.restaurantInfo.location}</dd>
            </div>
          )}
          {i.restaurantInfo.delivery && (
            <div>
              <dt>التوصيل</dt>
              <dd>{i.restaurantInfo.delivery === 'yes' ? 'متاح' : 'غير متاح'}</dd>
            </div>
          )}
          {i.restaurantInfo.mapUrl && (
            <div>
              <dt>الموقع</dt>
              <dd>
                <a href={i.restaurantInfo.mapUrl} target="_blank" rel="noopener noreferrer">
                  عرض الموقع
                </a>
              </dd>
            </div>
          )}
        </dl>
      )}
      <dl>
        <div>
          <dt>نوع المؤسسة</dt>
          <dd>
            {i.category === 'restaurant'
              ? 'مطعم'
              : i.kind === 'private_sector'
                ? 'شركة أو مؤسسة قطاع خاص'
                : 'جهة جامعية'}
          </dd>
        </div>
        {i.governorate && (
          <div>
            <dt>المحافظة</dt>
            <dd>{i.governorate}</dd>
          </div>
        )}
        {i.description && (
          <div>
            <dt>نبذة عن المؤسسة</dt>
            <dd>{i.description}</dd>
          </div>
        )}
        {i.website && (
          <div>
            <dt>الموقع الإلكتروني</dt>
            <dd>
              <a href={i.website} target="_blank" rel="noopener noreferrer">
                {i.website}
              </a>
            </dd>
          </div>
        )}
      </dl>
      {kind === 'restaurant' && (
        <details open={Boolean(entryId)}>
          <summary>بيانات المطاعم</summary>
          {restaurants.map((e) => {
            const effective = withInstitutionRestaurant(e, i.restaurantInfo, i.website);
            const r = restaurantDetails(effective.restaurantDetails);
            return (
              <section key={e.id}>
                <h4>{e.title}</h4>
                <dl>
                  {effective.location && (
                    <div>
                      <dt>الموقع</dt>
                      <dd>{effective.location}</dd>
                    </div>
                  )}
                  <div>
                    <dt>مواعيد العمل</dt>
                    <dd>{restaurantHours(r) || 'لم تحدد الإدارة المواعيد بعد'}</dd>
                  </div>
                  {r.delivery && (
                    <div>
                      <dt>التوصيل</dt>
                      <dd>{r.delivery === 'yes' ? 'متاح' : 'غير متاح'}</dd>
                    </div>
                  )}
                  {r.phone && (
                    <div>
                      <dt>هاتف التواصل</dt>
                      <dd>
                        <a href={'tel:' + r.phone}>{r.phone}</a>
                      </dd>
                    </div>
                  )}
                  {r.mapUrl && (
                    <div>
                      <dt>موقع المطعم</dt>
                      <dd>
                        <a href={r.mapUrl} target="_blank" rel="noopener noreferrer">
                          عرض الموقع
                        </a>
                      </dd>
                    </div>
                  )}
                  {r.website && (
                    <div>
                      <dt>الموقع الإلكتروني</dt>
                      <dd>
                        <a href={r.website} target="_blank" rel="noopener noreferrer">
                          {r.website}
                        </a>
                      </dd>
                    </div>
                  )}
                </dl>
              </section>
            );
          })}
        </details>
      )}
    </section>
  );
}
