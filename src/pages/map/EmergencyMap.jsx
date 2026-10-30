import { useMemo, useState } from 'react';
import { List, MapPin, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import IncidentMap from '../../components/maps/IncidentMap';
import { CategoryIcon, PriorityBadge, PageHeader } from '../../components/common/ui';
import { useApp } from '../../context/AppContext';
import { CATEGORIES, PRIORITIES, PRIORITY_COLOR, timeAgo } from '../../utils/format';
import { SECTORS } from '../../utils/geo';

export default function EmergencyMap() {
  const { incidents } = useApp();
  const [type, setType] = useState('All');
  const [sev, setSev] = useState('All');
  const [sel, setSel] = useState(null);
  const [sheet, setSheet] = useState(false);
  const [loc, setLoc] = useState('');
  const [center, setCenter] = useState(null);
  const list = useMemo(() => incidents.filter((i) => i.status !== 'Resolved' && (type === 'All' || i.type === type) && (sev === 'All' || i.priority === sev)).sort((a, b) => PRIORITIES.indexOf(a.priority) - PRIORITIES.indexOf(b.priority)), [incidents, type, sev]);
  const matches = loc.trim() ? SECTORS.filter((s) => s.name.toLowerCase().includes(loc.toLowerCase())) : [];
  const goto = (s) => { setCenter([s.lat, s.lng]); setLoc(s.name); toast.success(`Centered on ${s.name}`); };
  const panel = (
    <ul className="divide-y divide-line overflow-auto">
      {list.length === 0 && <li className="p-6 text-center text-neutral">No open incidents match these filters.</li>}
      {list.map((i) => (
        <li key={i.id}><button onClick={() => { setSel(i.id); setSheet(false); }} className={`flex w-full items-start gap-3 p-3 text-left transition-colors hover:bg-canvas ${sel === i.id ? 'bg-accent-soft' : ''}`}>
          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full text-white" style={{ background: PRIORITY_COLOR[i.priority] }}><CategoryIcon type={i.type} size={15} /></span>
          <span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><b className="text-navy">{i.type}</b><PriorityBadge priority={i.priority} /></span><span className="block truncate text-xs text-neutral">{i.location}</span><span className="block text-xs text-neutral">{i.id} · {timeAgo(i.time)}</span></span>
        </button></li>))}
    </ul>
  );
  return (
    <div>
      <PageHeader title="Emergency Map" desc="Mock incidents in the Islamabad–Rawalpindi area for demonstration only." />
      <div className="mb-3 flex flex-wrap gap-2">
        <div className="relative w-full sm:w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral" />
          <input className="input !pl-9" placeholder="Search location" value={loc} onChange={(e) => setLoc(e.target.value)} aria-label="Search location" />
          {matches.length > 0 && <ul className="card absolute z-[1000] mt-1 w-full overflow-hidden">{matches.slice(0, 5).map((s) => <li key={s.name}><button className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-canvas" onClick={() => goto(s)}><MapPin size={13} className="text-neutral" />{s.name}</button></li>)}</ul>}
        </div>
        <select className="input !w-auto" value={type} onChange={(e) => setType(e.target.value)} aria-label="Incident type"><option value="All">All types</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
        <select className="input !w-auto" value={sev} onChange={(e) => setSev(e.target.value)} aria-label="Severity"><option value="All">All severities</option>{PRIORITIES.map((c) => <option key={c}>{c}</option>)}</select>
        <button className="btn-outline lg:hidden" onClick={() => setSheet(true)}><List size={15} />Incidents ({list.length})</button>
      </div>
      <div className="grid h-[calc(100vh-14rem)] min-h-[420px] gap-4 lg:grid-cols-[7fr_3fr]">
        <div className="card relative overflow-hidden p-1">
          <IncidentMap incidents={list} selectedId={sel} onSelect={setSel} center={center} />
          <div className="absolute bottom-4 left-4 z-[500] rounded-lg border border-line bg-white/95 p-2.5 text-xs shadow-soft">
            <p className="mb-1 font-medium text-navy">Priority</p>
            {PRIORITIES.map((p) => <p key={p} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: PRIORITY_COLOR[p] }} />{p}</p>)}
            <p className="mt-1.5 text-neutral">Icon shows incident type</p>
          </div>
        </div>
        <aside className="card hidden flex-col overflow-hidden lg:flex"><div className="border-b border-line p-3 font-medium text-navy">Open incidents ({list.length})</div>{panel}</aside>
      </div>
      {sheet && <div className="fixed inset-0 z-[1100] lg:hidden"><div className="absolute inset-0 bg-navy/40" onClick={() => setSheet(false)} />
        <div className="absolute inset-x-0 bottom-0 flex max-h-[70vh] flex-col rounded-t-2xl bg-white"><div className="flex items-center justify-between border-b border-line p-3 font-medium text-navy">Open incidents ({list.length})<button onClick={() => setSheet(false)} aria-label="Close"><X size={16} /></button></div>{panel}</div></div>}
    </div>
  );
}
