import { STATUSES } from '../utils/format';
export const nextId = (list) => `INC-${Math.max(2000, ...list.map((i) => Number(i.id.split('-')[1]))) + 1}`;
export const newIncident = (list, data) => ({
  id: nextId(list), time: new Date().toISOString(), status: 'Reported', priority: 'Medium', verified: false,
  teamId: null, grouped: [], mine: false, people: 0, evidence: 'none', history: [{ text: 'Report received', time: new Date().toISOString() }], ...data,
});
export const nextStatus = (s) => STATUSES[Math.min(STATUSES.length - 1, STATUSES.indexOf(s) + 1)];
export const filterIncidents = (list, { q = '', filter = 'All', type = 'All', sort = 'newest' }) => {
  const s = q.trim().toLowerCase();
  const res = list.filter((i) => {
    if (s && !`${i.id} ${i.type} ${i.location} ${i.reporter} ${i.description}`.toLowerCase().includes(s)) return false;
    if (type !== 'All' && i.type !== type) return false;
    if (['Critical', 'High', 'Medium', 'Low'].includes(filter)) return i.priority === filter;
    if (filter === 'Pending Verification') return ['Reported', 'Under Verification'].includes(i.status);
    if (filter === 'In Progress') return ['Assigned', 'Response in Progress'].includes(i.status);
    if (filter === 'Resolved') return i.status === 'Resolved';
    return true;
  });
  return res.sort((a, b) => (sort === 'newest' ? new Date(b.time) - new Date(a.time) : new Date(a.time) - new Date(b.time)));
};
