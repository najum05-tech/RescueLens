const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const trend = days.flatMap((d, i) => [d]).map((d, i) => ({ day: d, incidents: [14, 18, 12, 22, 26, 19, 31][i], resolved: [11, 15, 12, 17, 21, 16, 20][i] }));
export const byCategory = [
  { name: 'Flood', value: 48 }, { name: 'Road Accident', value: 36 }, { name: 'Fire', value: 22 },
  { name: 'Medical', value: 30 }, { name: 'Earthquake', value: 6 }, { name: 'Other', value: 14 },
];
export const byArea = [
  { area: 'Nullah Lai', Flood: 24, Fire: 1, 'Road Accident': 4, Medical: 3 },
  { area: 'Faizabad', Flood: 4, Fire: 2, 'Road Accident': 14, Medical: 5 },
  { area: 'F-7 / F-6', Flood: 2, Fire: 9, 'Road Accident': 6, Medical: 7 },
  { area: 'G-9 / G-11', Flood: 6, Fire: 3, 'Road Accident': 5, Medical: 8 },
  { area: 'I-8 / H-9', Flood: 3, Fire: 2, 'Road Accident': 4, Medical: 4 },
];
export const hotspots = [
  { name: 'Nullah Lai corridor', reports: 36, note: 'Flood reports concentrated along the channel' },
  { name: 'Faizabad Interchange', reports: 25, note: 'Repeated collisions at peak hours' },
  { name: 'F-7 Jinnah Super', reports: 19, note: 'Kitchen and electrical fire reports' },
];
export const resolutionStats = [
  { name: 'Resolved', value: 112 }, { name: 'In progress', value: 28 }, { name: 'Pending verification', value: 16 },
];
export const kpis = { avgAssign: '6.4 min', avgResolve: '48 min', resolutionRate: '72%' };
