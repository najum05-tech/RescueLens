import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import useLocalStorage from '../hooks/useLocalStorage';
import { buildIncidents } from '../data/mockIncidents';
import { buildTeams } from '../data/mockTeams';
import { newIncident } from '../services/incidentService';
import { strings } from '../data/i18n';
import { api, getIncidents, getTeams } from '../services/api';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);
const log = (text) => ({ text, time: new Date().toISOString() });
export const ROLES = { citizen: 'Citizen', operator: 'Emergency Operator', admin: 'Administrator' };
const toUiStatus = { Submitted: 'Reported', 'Under Review': 'Under Verification', 'In Progress': 'Response in Progress' };
const toApiStatus = { Reported: 'Submitted', 'Under Verification': 'Under Review', 'Response in Progress': 'In Progress' };
const normalizeIncident = (item) => ({ ...item, status: toUiStatus[item.status] || item.status, type: item.type || item.category, location: item.location || '', reporter: item.reporter || 'Database record', grouped: item.grouped || [], history: item.history || [{ text: 'Report received', time: item.time }], lat: item.lat || 0, lng: item.lng || 0, evidence: item.evidence || 'none', mine: Boolean(item.mine) });

export function AppProvider({ children }) {
  const [incidents, setIncidents] = useLocalStorage('rl.incidents.v1', buildIncidents);
  const [teams, setTeams] = useLocalStorage('rl.teams.v1', buildTeams);
  const [role, setRole] = useLocalStorage('rl.role', 'operator');
  const [lang, setLang] = useLocalStorage('rl.lang', 'en');
  const [settings, setSettings] = useLocalStorage('rl.settings', { sound: false, email: true, autoRefresh: true, compact: false });
  const [seenAt, setSeenAt] = useLocalStorage('rl.seen', 0);
  const [accessToken, setAccessToken] = useLocalStorage('rl.access_token', null);
  const [user, setUser] = useLocalStorage('rl.user', null);
  const t = strings[lang];
  const canOperate = role === 'operator' || role === 'admin';

  useEffect(() => {
    getIncidents().then((rows) => setIncidents(rows.map(normalizeIncident))).catch(() => {});
    getTeams().then((rows) => setTeams(rows)).catch(() => {});
  }, [setIncidents, setTeams]);

  const login = useCallback(async (email, password) => {
    const result = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    setAccessToken(result.access_token); setUser(result.user); setRole(result.user.role); return result.user;
  }, [setAccessToken, setUser, setRole]);
  const register = useCallback(async (body) => {
    const result = await api('/auth/register', { method: 'POST', body: JSON.stringify(body) });
    setAccessToken(result.access_token); setUser(result.user); setRole(result.user.role); return result.user;
  }, [setAccessToken, setUser, setRole]);
  const logout = useCallback(() => { setAccessToken(null); setUser(null); setRole('citizen'); }, [setAccessToken, setUser, setRole]);

  const update = useCallback(async (id, patch, text) => {
    const current = incidents.find((item) => item.id === id);
    if (current?.database_id) {
      try {
        const remotePatch = { ...patch };
        if (remotePatch.status) remotePatch.status = toApiStatus[remotePatch.status] || remotePatch.status;
        await api(`/incidents/${id}`, { method: 'PATCH', body: JSON.stringify(remotePatch) });
      } catch (e) { toast.error(e.message || 'Incident update failed'); return false; }
    }
    setIncidents((list) => list.map((i) => (i.id === id ? { ...i, ...patch, history: text ? [...i.history, log(text)] : i.history } : i)));
    return true;
  }, [incidents, setIncidents]);

  const addIncident = useCallback((data) => {
    let created;
    setIncidents((list) => { created = newIncident(list, data); return [created, ...list]; });
    return created;
  }, [setIncidents]);

  const submitReport = useCallback(async (data) => {
    const result = await api('/reports', { method: 'POST', body: JSON.stringify(data) });
    const created = normalizeIncident({ ...result.incident, mine: Boolean(user) });
    setIncidents((list) => [created, ...list.filter((item) => item.id !== created.id)]);
    return created;
  }, [setIncidents, user]);

  const assignTeam = useCallback(async (incidentId, teamId) => {
    const team = teams.find((x) => x.id === teamId);
    const inc = incidents.find((i) => i.id === incidentId);
    if (!team || !inc) return;
    if (inc.database_id && typeof team.id === 'number') {
      try { await api('/assignments', { method: 'POST', body: JSON.stringify({ incidentId: inc.database_id, teamId: team.id }) }); } catch (e) { toast.error(e.message); return; }
    }
    setTeams((l) => l.map((x) => (x.id === teamId ? { ...x, availability: 'Busy', incidentId, location: inc.location } : x.incidentId === incidentId ? { ...x, availability: 'Available', incidentId: null } : x)));
    update(incidentId, { teamId, status: 'Assigned', verified: true }, `${team.name} assigned`);
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

  const setAvailability = useCallback(async (teamId, availability) => {
    if (typeof teamId === 'number') { try { await api(`/teams/${teamId}`, { method: 'PATCH', body: JSON.stringify({ availability }) }); } catch (e) { toast.error(e.message); return; } }
    setTeams((l) => l.map((x) => (x.id === teamId ? { ...x, availability } : x)));
  }, [setTeams]);

  const groupReports = useCallback((id, otherId) => {
    setIncidents((list) => list.map((i) => (i.id === id ? { ...i, grouped: [...new Set([...i.grouped, otherId])], history: [...i.history, log(`Grouped with ${otherId} after verification`)] } : i)));
  }, [setIncidents]);

  const resetDemo = useCallback(() => { setIncidents(buildIncidents()); setTeams(buildTeams()); toast.success('Demo data reset'); }, [setIncidents, setTeams]);

  const activity = useMemo(() => incidents.flatMap((i) => i.history.map((h) => ({ ...h, id: i.id, type: i.type }))).sort((a, b) => new Date(b.time) - new Date(a.time)), [incidents]);
  const unread = activity.filter((a) => new Date(a.time).getTime() > seenAt).length;

  const value = { incidents, teams, role, setRole, lang, setLang, t, settings, setSettings, canOperate, user, accessToken, login, register, logout, update, addIncident, submitReport, assignTeam, resolve, setAvailability, groupReports, resetDemo, activity, unread, markSeen: () => setSeenAt(Date.now()) };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
