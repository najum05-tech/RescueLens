import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, CheckCircle2, Timer, WifiOff, UserPlus, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { useApp } from '../../context/AppContext';
import { Drawer, PageHeader, StatusBadge, Skeleton } from '../../components/common/ui';
import StatCard from '../../components/dashboard/StatCard';
import AssignModal from '../../components/teams/AssignModal';
import usePageLoad from '../../hooks/usePageLoad';

const MISSION = { Assigned: 'En route (simulated)', 'Response in Progress': 'On scene (simulated)', Verified: 'Awaiting dispatch', Resolved: 'Mission complete' };
export default function Teams() {
  const { teams, incidents, setAvailability, role, canOperate } = useApp();
  const [open, setOpen] = useState(null);
  const [assign, setAssign] = useState(null);
  const loading = usePageLoad();
  const team = teams.find((t) => t.id === open);
  const inc = team && incidents.find((i) => i.id === team.incidentId);
  const count = (a) => teams.filter((t) => t.availability === a).length;
  const change = (t, a) => {
    if (role !== 'admin') return toast.error('Administrator role required to change availability');
    if (t.incidentId && a !== 'Busy') return toast.error('Resolve the assigned incident first');
    setAvailability(t.id, a); toast.success(`${t.name} is now ${a}`);
  };
  return (
    <div>
      <PageHeader title="Rescue Teams" desc="Manage demo teams and assign them to incidents. No real organizations are contacted." />
      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{loading ? [0, 1, 2, 3].map((k) => <Skeleton key={k} className="h-28" />) : <>
        <StatCard icon={Users} label="Total Teams" value={teams.length} trend={0} desc="Registered in demo" />
        <StatCard icon={CheckCircle2} label="Available" value={count('Available')} trend={4} desc="Ready for assignment" tint="#429B75" />
        <StatCard icon={Timer} label="Busy" value={count('Busy')} trend={6} desc="Currently on a mission" tint="#E58A35" />
        <StatCard icon={WifiOff} label="Offline" value={count('Offline')} trend={-2} desc="Not reachable" tint="#718096" /></>}</div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[820px] text-left"><thead><tr className="border-b border-line">{['Team name', 'Team ID', 'Specialization', 'Current location', 'Availability', 'Assigned incident', 'Actions'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
          <tbody>{teams.map((t) => (
            <tr key={t.id} className="cursor-pointer border-b border-line/70 last:border-0 hover:bg-canvas/70" onClick={() => setOpen(t.id)}>
              <td className="td font-medium text-navy">{t.name}</td><td className="td text-neutral">{t.id}</td><td className="td">{t.spec}</td><td className="td">{t.location}</td>
              <td className="td"><StatusBadge status={t.availability} /></td>
              <td className="td">{t.incidentId ? <Link to={`/incidents/${t.incidentId}`} onClick={(e) => e.stopPropagation()} className="font-medium text-accent">{t.incidentId}</Link> : <span className="text-neutral">None</span>}</td>
              <td className="td" onClick={(e) => e.stopPropagation()}>
                <button className="btn-outline !py-1" disabled={t.availability !== 'Available'} onClick={() => canOperate ? setAssign(t.id) : toast.error('Operator role required')}><UserPlus size={13} />Assign Team</button></td>
            </tr>))}</tbody></table>
      </div>
      <Drawer open={!!team} onClose={() => setOpen(null)} title={team?.name || ''}>
        {team && <div className="space-y-4">
          <div className="flex items-center gap-2"><StatusBadge status={team.availability} /><span className="text-neutral">{team.id} · {team.spec}</span></div>
          <dl className="divide-y divide-line rounded-lg border border-line"><div className="flex justify-between px-3 py-2"><dt className="text-neutral">Location</dt><dd>{team.location}</dd></div><div className="flex justify-between px-3 py-2"><dt className="text-neutral">Mission status</dt><dd>{inc ? MISSION[inc.status] || inc.status : 'No active mission'}</dd></div></dl>
          {inc && <Link to={`/incidents/${inc.id}`} className="card flex items-center justify-between p-3 hover:bg-canvas"><span><b className="text-navy">{inc.id}</b> · {inc.type}<br /><span className="text-xs text-neutral">{inc.location}</span></span><ExternalLink size={15} className="text-neutral" /></Link>}
          <div><label className="label" htmlFor="avail">Change availability</label>
            <select id="avail" className="input" value={team.availability} onChange={(e) => change(team, e.target.value)}>{['Available', 'Busy', 'Offline'].map((a) => <option key={a}>{a}</option>)}</select>
            {role !== 'admin' && <p className="mt-1 text-xs text-neutral">Switch to the Administrator role to change availability.</p>}</div>
          <button className="btn-primary w-full" disabled={team.availability !== 'Available'} onClick={() => setAssign(team.id)}>Assign to an incident</button>
        </div>}
      </Drawer>
      <AssignModal open={!!assign} onClose={() => setAssign(null)} teamId={assign} />
    </div>
  );
}
