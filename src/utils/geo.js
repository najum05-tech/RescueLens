export const SECTORS = [
  { name: 'F-6 Markaz', lat: 33.7294, lng: 73.0786 },
  { name: 'F-7 Jinnah Super', lat: 33.7215, lng: 73.0565 },
  { name: 'Blue Area', lat: 33.7077, lng: 73.0551 },
  { name: 'G-9 Markaz', lat: 33.6902, lng: 73.033 },
  { name: 'G-11 Markaz', lat: 33.67, lng: 72.987 },
  { name: 'I-8 Markaz', lat: 33.665, lng: 73.075 },
  { name: 'H-9 Sector', lat: 33.6544, lng: 72.999 },
  { name: 'E-11 Sector', lat: 33.7, lng: 72.976 },
  { name: 'Faizabad Interchange', lat: 33.658, lng: 73.083 },
  { name: 'Rawal Lake View', lat: 33.7, lng: 73.128 },
  { name: 'Margalla Trail 3', lat: 33.746, lng: 73.066 },
  { name: 'Bhara Kahu', lat: 33.725, lng: 73.167 },
  { name: 'Kashmir Highway', lat: 33.699, lng: 73.027 },
  { name: 'Saddar, Rawalpindi', lat: 33.5984, lng: 73.0441 },
  { name: 'Nullah Lai, Rawalpindi', lat: 33.6, lng: 73.06 },
];
export const ISLAMABAD = [33.6844, 73.0479];
export const distanceKm = (a, b) => {
  const R = 6371, rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};
