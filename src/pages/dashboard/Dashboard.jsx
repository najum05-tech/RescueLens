import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Siren, AlertOctagon, LifeBuoy, CheckCircle2, Sparkles, UserPlus, RefreshCw, FilePlus2 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useApp } from '../../context/AppContext';
import StatCard from '../../components/dashboard/StatCard';
import IncidentTable from '../../components/incidents/IncidentTable';
import IncidentMap from '../../components/maps/IncidentMap';
import { Skeleton } from '../../components/common/ui';
import usePageLoad from '../../hooks/usePageLoad';
import { PRIORITIES, PRIORITY_COLOR, timeAgo } from '../../utils/format';

const kindIcon = (t) => (/assigned/i.test(t) ? UserPlus : /received/i.test(t) ? FilePlus2 : /resolved/i.test(t) ? CheckCircle2 : RefreshCw);

export default function Dashboard() {
  const { incidents, activity } = useApp();
  const nav = useNavigate();
  const loading = usePageLoad();
  const open = incidents.filter((i) => i.status !== 'Resolved');
  const recent = useMemo(() => [...incidents].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 6), [incidents]);
  const dist = PRIORITIES.map((p) => ({ name: p, value: open.filter((i) => i.priority === p).length }));
  const stats = [
    { icon: Siren, label: 'Total Incidents', value: incidents.length, trend: 12, desc: 'Reports in this demo period' },
    { icon: AlertOctagon, label: 'Critical Incidents', value: open.filter((i) => i.priority === 'Critical').length, trend: 8, desc: 'Open and need attention', tint: '#DC4545' },
    { icon: LifeBuoy, label: 'Active Responses', value: incidents.filter((i) => ['Assigned', 'Response in Progress'].includes(i.status)).length, trend: 5, desc: 'Teams currently deployed', tint: '#E58A35' },
    { icon: CheckCircle2, label: 'Resolved Incidents', value: incidents.filter((i) => i.status === 'Resolved').length, trend: -3, desc: 'Closed after response', tint: '#429B75' },
  ];
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  return (
    <div className="space-y-5">
      <div><h1 className="text-xl">{greet}, Emergency Operator</h1><p className="text-neutral">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · Demonstration data</p></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{loading ? [0, 1, 2, 3].map((k) => <Skeleton key={k} className="h-28" />) : stats.map((s) => <StatCard key={s.label} {...s} />)}</div>
      <div className="grid gap-5 xl:grid-cols-3">
        <section className="card xl:col-span-2">
          <div className="flex items-center justify-between p-4 pb-2"><h2 className="text-[15px]">Live Incident Overview</h2><Link to="/incidents" className="text-xs font-medium text-accent">View all</Link></div>
          {loading ? <div className="space-y-2 p-4">{[0, 1, 2, 3].map((k) => <Skeleton key={k} className="h-9" />)}</div> : <IncidentTable rows={recent} compact onOpen={(i) => nav(`/incidents/${i.id}`)} />}
        </section>
        <section className="card p-4">
          <h2 className="text-[15px]">Priority Distribution</h2>
          <div className="relative h-52">
            <ResponsiveContainer><PieChart><Pie data={dist} dataKey="value" innerRadius={55} outerRadius={80} paddingAngle={3} animationDuration={600}>{dist.map((d) => <Cell key={d.name} fill={PRIORITY_COLOR[d.name]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-center"><div><div className="text-2xl font-semibold text-navy">{open.length}</div><div className="text-xs text-neutral">Open</div></div></div>
          </div>
          <ul className="grid grid-cols-2 gap-1.5">{dist.map((d) => <li key={d.name} className="flex items-center justify-between text-xs"><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: PRIORITY_COLOR[d.name] }} />{d.name}</span><b className="text-navy">{d.value}</b></li>)}</ul>
        </section>
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        <section className="card overflow-hidden xl:col-span-2">
          <div className="flex items-center justify-between p-4 pb-2"><h2 className="text-[15px]">Emergency Map Preview</h2><Link to="/map" className="text-xs font-medium text-accent">Open map</Link></div>
          <div className="h-80 p-2 pt-0"><IncidentMap incidents={open} scroll={false} /></div>
        </section>
        <div className="space-y-5">
          <section className="card p-4">
            <h2 className="flex items-center gap-2 text-[15px]"><Sparkles size={16} className="text-accent" />AI Intelligence Summary</h2>
            <p className="mt-2 text-navy">Flood-related reports are increasing in the northern sector of Rawalpindi near Nullah Lai. Three reports appear to describe a similar incident.</p>
            <p className="mt-2 text-xs text-neutral">AI-generated assessment. Human verification is required before operational decisions.</p>
            <Link to="/intelligence" className="btn-outline mt-3 w-full">Review related reports</Link>
          </section>
          <section className="card p-4">
            <h2 className="text-[15px]">Recent Activity</h2>
            <ol className="mt-3 space-y-3 border-s border-line ps-4">{activity.slice(0, 5).map((a, k) => { const I = kindIcon(a.text); return (
              <li key={k} className="relative"><span className="absolute -start-[25px] grid h-5 w-5 place-items-center rounded-full border border-line bg-white text-accent"><I size={11} /></span>
                <p className="text-[13px] text-navy"><Link to={`/incidents/${a.id}`} className="font-medium hover:text-accent">{a.id}</Link> {a.text}</p><p className="text-xs text-neutral">{timeAgo(a.time)}</p></li>); })}</ol>
          </section>
        </div>
      </div>
    </div>
  );
}
