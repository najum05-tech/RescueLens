import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Clock, Timer, Percent, LifeBuoy } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/common/ui';
import StatCard from '../../components/dashboard/StatCard';
import { PRIORITIES, PRIORITY_COLOR } from '../../utils/format';
import { getAnalytics } from '../../services/api';

const C = ['#3978C5', '#E58A35', '#DC4545', '#429B75', '#D6AE43', '#718096'];
const axis = { fontSize: 12, fill: '#718096' };
const Box = ({ title, children, h = 240 }) => <section className="card p-4"><h2 className="mb-3 text-[15px]">{title}</h2><div style={{ height: h }}><ResponsiveContainer>{children}</ResponsiveContainer></div></section>;

export default function Analytics() {
  const { role, setRole, incidents, teams } = useApp();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { getAnalytics().then(setData).catch((e) => setError(e.message)); }, []);
  if (role !== 'admin') return (
    <div className="card mx-auto mt-10 max-w-md p-8 text-center"><h1 className="text-lg">Administrator access required</h1><p className="mt-1 text-neutral">Analytics is available to the Administrator role in this demo.</p><button className="btn-primary mt-4" onClick={() => setRole('admin')}>Switch to Administrator</button></div>);
  if (error) return <div className="card p-6 text-center"><h1 className="text-lg">Analytics unavailable</h1><p className="mt-1 text-neutral">{error}</p></div>;
  if (!data) return <div className="card p-6 text-neutral">Loading database analytics…</div>;
  const prio = PRIORITIES.map((p) => ({ name: p, value: data.byPriority?.[p] || 0 }));
  const byCategory = Object.entries(data.byCategory || {}).map(([name, value]) => ({ name, value }));
  const trend = Object.entries(data.byDay || {}).map(([day, value]) => ({ day, incidents: value, resolved: 0 }));
  const resolutionStats = [{ name: 'Resolved', value: data.resolved }, { name: 'Unresolved', value: data.unresolved }];
  const activeTeams = teams.filter((t) => t.availability !== 'Offline' && t.availability !== 'Unavailable').length;
  const resolutionRate = data.totalIncidents ? `${Math.round((data.resolved / data.totalIncidents) * 100)}%` : '—';
  return (
    <div>
      <PageHeader title="Analytics" desc="Counts and trends are calculated from database records. Empty results are shown as zero." />
      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <section className="card p-4"><div className="flex justify-between text-neutral">Total reports<Clock size={16} /></div><p className="mt-2 text-2xl font-semibold text-navy">{data.totalReports}</p><p className="text-xs text-neutral">Database reports</p></section>
        <section className="card p-4"><div className="flex justify-between text-neutral">Total incidents<Timer size={16} /></div><p className="mt-2 text-2xl font-semibold text-navy">{data.totalIncidents}</p><p className="text-xs text-neutral">Deduplicated events</p></section>
        <StatCard icon={LifeBuoy} label="Active teams" value={activeTeams} trend={0} desc="Available or busy" tint="#E58A35" />
        <section className="card p-4"><div className="flex justify-between text-neutral">Resolution rate<Percent size={16} /></div><p className="mt-2 text-2xl font-semibold text-navy">{resolutionRate}</p><p className="text-xs text-neutral">Resolved incidents</p></section>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Box title="Incidents over time"><AreaChart data={trend}><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3978C5" stopOpacity={0.25} /><stop offset="100%" stopColor="#3978C5" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#E5EAF0" vertical={false} /><XAxis dataKey="day" tick={axis} axisLine={false} tickLine={false} /><YAxis tick={axis} axisLine={false} tickLine={false} width={30} /><Tooltip /><Legend /><Area type="monotone" dataKey="incidents" name="Reported" stroke="#3978C5" fill="url(#g)" strokeWidth={2} animationDuration={600} /><Area type="monotone" dataKey="resolved" name="Resolved" stroke="#429B75" fill="none" strokeWidth={2} animationDuration={600} /></AreaChart></Box>
        <Box title="Incidents by category"><BarChart data={byCategory}><CartesianGrid stroke="#E5EAF0" vertical={false} /><XAxis dataKey="name" tick={axis} axisLine={false} tickLine={false} /><YAxis tick={axis} axisLine={false} tickLine={false} width={30} /><Tooltip cursor={{ fill: '#F6F8FB' }} /><Bar dataKey="value" name="Incidents" radius={[6, 6, 0, 0]} animationDuration={600}>{byCategory.map((_, k) => <Cell key={k} fill={C[k]} />)}</Bar></BarChart></Box>
        <Box title="Priority distribution"><PieChart><Pie data={prio} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={3} animationDuration={600}>{prio.map((d) => <Cell key={d.name} fill={PRIORITY_COLOR[d.name]} />)}</Pie><Tooltip /><Legend /></PieChart></Box>
        <Box title="Resolution statistics"><PieChart><Pie data={resolutionStats} dataKey="value" nameKey="name" outerRadius={85} animationDuration={600}>{resolutionStats.map((_, k) => <Cell key={k} fill={['#429B75', '#E58A35', '#718096'][k]} />)}</Pie><Tooltip /><Legend /></PieChart></Box>
        <Box title="Category distribution" h={280}><BarChart data={byCategory} layout="vertical"><CartesianGrid stroke="#E5EAF0" horizontal={false} /><XAxis type="number" tick={axis} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="name" tick={axis} axisLine={false} tickLine={false} width={100} /><Tooltip cursor={{ fill: '#F6F8FB' }} /><Bar dataKey="value" name="Incidents" fill={C[0]} animationDuration={600} /></BarChart></Box>
        <section className="card p-4"><h2 className="mb-3 text-[15px]">Geographic insights</h2><p className="text-neutral">Area-level hotspots are shown when incident records contain location data. No geographic aggregation is available for the current records.</p><Link to="/map" className="btn-outline mt-4 w-full">View on map</Link></section>
      </div>
    </div>
  );
}
