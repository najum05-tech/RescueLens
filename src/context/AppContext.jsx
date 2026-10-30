import { createContext, useCallback, useContext, useMemo } from 'react';
import toast from 'react-hot-toast';
import useLocalStorage from '../hooks/useLocalStorage';
import { buildIncidents } from '../data/mockIncidents';
import { buildTeams } from '../data/mockTeams';
import { newIncident } from '../services/incidentService';
import { strings } from '../data/i18n';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);
const log = (text) => ({ text, time: new Date().toISOString() });
export const ROLES = { citizen: 'Citizen', operator: 'Emergency Operator', admin: 'Administrator' };

export function AppProvider({ children }) {
  const [incidents, setIncidents] = useLocalStorage('rl.incidents.v1', buildIncidents);
  const [teams, setTeams] = useLocalStorage('rl.teams.v1', buildTeams);
  const [role, setRole] = useLocalStorage('rl.role', 'operator');
  const [lang, setLang] = useLocalStorage('rl.lang', 'en');
  const [settings, setSettings] = useLocalStorage('rl.settings', { sound: false, email: true, autoRefresh: true, compact: false });
  const [seenAt, setSeenAt] = useLocalStorage('rl.seen', 0);
  const t = strings[lang];
  const canOperate = role === 'operator' || role === 'admin';

  const update = useCallback((id, patch, text) => {
    setIncidents((list) => list.map((i) => (i.id === id ? { ...i, ...patch, history: text ? [...i.history, log(text)] : i.history } : i)));
  }, [setIncidents]);

  const addIncident = useCallback((data) => {
    let created;
    setIncidents((list) => { created = newIncident(list, data); return [created, ...list]; });
    return created;
  }, [setIncidents]);

  const assignTeam = useCallback((incidentId, teamId) => {
    const team = teams.find((x) => x.id === teamId);
    const inc = incidents.find((i) => i.id === incidentId);
    if (!team || !inc) return;
    setTeams((l) => l.map((x) => (x.id === teamId ? { ...x, availability: 'Busy', incidentId, location: inc.location } : x.incidentId === incidentId ? { ...x, availability: 'Available', incidentId: null } : x)));
    update(incidentId, { teamId, status: 'Assigned', verified: true }, `${team.name} assigned (demo)`);
    toast.success(`${team.name} assigned to ${incidentId}`);
  }, [teams, incidents, setTeams, update]);

  const releaseTeam = useCallback((teamId) => {
    setTeams((l) => l.map((x) => (x.id === teamId ? { ...x, availability: 'Available', incidentId: null } : x)));
  }, [setTeams]);

  const resolve = useCallback((id) => {
    const inc = incidents.find((i) => i.id === id);
    if (inc?.teamId) releaseTeam(inc.teamId);
    update(id, { status: 'Resolved' }, 'Marked as resolved');
    toast.success(`${id} marked as resolved`);
  }, [incidents, releaseTeam, update]);

  const setAvailability = useCallback((teamId, availability) => {
    setTeams((l) => l.map((x) => (x.id === teamId ? { ...x, availability } : x)));
  }, [setTeams]);

  const groupReports = useCallback((id, otherId) => {
    setIncidents((list) => list.map((i) => (i.id === id ? { ...i, grouped: [...new Set([...i.grouped, otherId])], history: [...i.history, log(`Grouped with ${otherId} after verification`)] } : i)));
  }, [setIncidents]);

  const resetDemo = useCallback(() => { setIncidents(buildIncidents()); setTeams(buildTeams()); toast.success('Demo data reset'); }, [setIncidents, setTeams]);

  const activity = useMemo(() => incidents.flatMap((i) => i.history.map((h) => ({ ...h, id: i.id, type: i.type }))).sort((a, b) => new Date(b.time) - new Date(a.time)), [incidents]);
  const unread = activity.filter((a) => new Date(a.time).getTime() > seenAt).length;

  const value = { incidents, teams, role, setRole, lang, setLang, t, settings, setSettings, canOperate, update, addIncident, assignTeam, resolve, setAvailability, groupReports, resetDemo, activity, unread, markSeen: () => setSeenAt(Date.now()) };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
