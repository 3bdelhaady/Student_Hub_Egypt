import { restaurantDetails } from '../portal/restaurants';
export type InstitutionRestaurantInfo = {
  opensAt: string;
  closesAt: string;
  phone: string;
  delivery: '' | 'yes' | 'no';
  mapUrl: string;
  location: string;
  logo: string;
  cover: string;
};
export function institutionRestaurantDefaults(
  info: InstitutionRestaurantInfo | null | undefined,
  entry?: { restaurantDetails: unknown; location: string },
) {
  const r = restaurantDetails(entry?.restaurantDetails);
  return (
    info || {
      opensAt: r.opensAt,
      closesAt: r.closesAt,
      phone: r.phone,
      delivery: r.delivery,
      mapUrl: r.mapUrl,
      location: entry?.location || '',
      logo: '',
      cover: '',
    }
  );
}
export function withInstitutionRestaurant<
  T extends { restaurantDetails: unknown; location: string },
>(entry: T, info: InstitutionRestaurantInfo | null | undefined, website = '') {
  if (!info) return entry;
  return {
    ...entry,
    location: info.location,
    restaurantDetails: { ...restaurantDetails(entry.restaurantDetails), ...info, website },
  };
}
