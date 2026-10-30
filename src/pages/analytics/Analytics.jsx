import { Link } from 'react-router-dom';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Clock, Timer, Percent, LifeBuoy } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/common/ui';
import StatCard from '../../components/dashboard/StatCard';
import { byArea, byCategory, hotspots, kpis, resolutionStats, trend } from '../../data/mockAnalytics';
import { PRIORITIES, PRIORITY_COLOR } from '../../utils/format';

const C = ['#3978C5', '#E58A35', '#DC4545', '#429B75', '#D6AE43', '#718096'];
const axis = { fontSize: 12, fill: '#718096' };
const Box = ({ title, children, h = 240 }) => <section className="card p-4"><h2 className="mb-3 text-[15px]">{title}</h2><div style={{ height: h }}><ResponsiveContainer>{children}</ResponsiveContainer></div></section>;

export default function Analytics() {
  const { role, setRole, incidents, teams } = useApp();
  if (role !== 'admin') return (
    <div className="card mx-auto mt-10 max-w-md p-8 text-center"><h1 className="text-lg">Administrator access required</h1><p className="mt-1 text-neutral">Analytics is available to the Administrator role in this demo.</p><button className="btn-primary mt-4" onClick={() => setRole('admin')}>Switch to Administrator</button></div>);
  const prio = PRIORITIES.map((p) => ({ name: p, value: incidents.filter((i) => i.priority === p).length }));
  return (
    <div>
      <PageHeader title="Analytics" desc="Demonstration data only. Figures do not represent real emergencies." />
      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <section className="card p-4"><div className="flex justify-between text-neutral">Avg. time to assignment<Clock size={16} /></div><p className="mt-2 text-2xl font-semibold text-navy">{kpis.avgAssign}</p><p className="text-xs text-neutral">Reported to team assigned</p></section>
        <section className="card p-4"><div className="flex justify-between text-neutral">Avg. time to resolution<Timer size={16} /></div><p className="mt-2 text-2xl font-semibold text-navy">{kpis.avgResolve}</p><p className="text-xs text-neutral">Reported to resolved</p></section>
        <StatCard icon={LifeBuoy} label="Active teams" value={teams.filter((t) => t.availability !== 'Offline').length} trend={3} desc="Available or busy" tint="#E58A35" />
        <section className="card p-4"><div className="flex justify-between text-neutral">Resolution rate<Percent size={16} /></div><p className="mt-2 text-2xl font-semibold text-navy">{kpis.resolutionRate}</p><p className="text-xs text-neutral">Resolved of all reports</p></section>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Box title="Incidents over time"><AreaChart data={trend}><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3978C5" stopOpacity={0.25} /><stop offset="100%" stopColor="#3978C5" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#E5EAF0" vertical={false} /><XAxis dataKey="day" tick={axis} axisLine={false} tickLine={false} /><YAxis tick={axis} axisLine={false} tickLine={false} width={30} /><Tooltip /><Legend /><Area type="monotone" dataKey="incidents" name="Reported" stroke="#3978C5" fill="url(#g)" strokeWidth={2} animationDuration={600} /><Area type="monotone" dataKey="resolved" name="Resolved" stroke="#429B75" fill="none" strokeWidth={2} animationDuration={600} /></AreaChart></Box>
        <Box title="Incidents by category"><BarChart data={byCategory}><CartesianGrid stroke="#E5EAF0" vertical={false} /><XAxis dataKey="name" tick={axis} axisLine={false} tickLine={false} /><YAxis tick={axis} axisLine={false} tickLine={false} width={30} /><Tooltip cursor={{ fill: '#F6F8FB' }} /><Bar dataKey="value" name="Incidents" radius={[6, 6, 0, 0]} animationDuration={600}>{byCategory.map((_, k) => <Cell key={k} fill={C[k]} />)}</Bar></BarChart></Box>
        <Box title="Priority distribution (current demo data)"><PieChart><Pie data={prio} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={3} animationDuration={600}>{prio.map((d) => <Cell key={d.name} fill={PRIORITY_COLOR[d.name]} />)}</Pie><Tooltip /><Legend /></PieChart></Box>
        <Box title="Resolution statistics"><PieChart><Pie data={resolutionStats} dataKey="value" nameKey="name" outerRadius={85} animationDuration={600}>{resolutionStats.map((_, k) => <Cell key={k} fill={['#429B75', '#E58A35', '#718096'][k]} />)}</Pie><Tooltip /><Legend /></PieChart></Box>
        <Box title="Category distribution by area" h={280}><BarChart data={byArea} layout="vertical"><CartesianGrid stroke="#E5EAF0" horizontal={false} /><XAxis type="number" tick={axis} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="area" tick={axis} axisLine={false} tickLine={false} width={80} /><Tooltip cursor={{ fill: '#F6F8FB' }} /><Legend />{['Flood', 'Fire', 'Road Accident', 'Medical'].map((k, n) => <Bar key={k} dataKey={k} stackId="a" fill={C[n]} animationDuration={600} />)}</BarChart></Box>
        <section className="card p-4"><h2 className="mb-3 text-[15px]">Incident hotspots</h2><ul className="space-y-4">{hotspots.map((h, k) => <li key={h.name}><div className="flex justify-between"><span className="font-medium text-navy">{h.name}</span><b className="text-navy">{h.reports} reports</b></div><div className="my-1 h-1.5 rounded-full bg-line"><div className="h-full rounded-full bg-accent" style={{ width: `${(h.reports / 36) * 100}%` }} /></div><p className="text-xs text-neutral">{h.note}</p></li>)}</ul><Link to="/map" className="btn-outline mt-4 w-full">View on map</Link></section>
      </div>
    </div>
  );
}
