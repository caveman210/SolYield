const EARTH_RADIUS_KM = 6371;
const CHECK_IN_RADIUS_METERS = 500;

const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c * 1000; // Convert to meters
};

export const isWithinCheckInRadius = (
  userLat: number,
  userLon: number,
  siteLat: number,
  siteLon: number
): boolean => {
  const distance = calculateDistance(userLat, userLon, siteLat, siteLon);
  return distance <= CHECK_IN_RADIUS_METERS;
};

export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
};
