import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PageHeader, Empty, Drawer, Skeleton } from '../../components/common/ui';
import IncidentTable from '../../components/incidents/IncidentTable';
import IncidentDrawerBody from '../../components/incidents/IncidentDrawerBody';
import NewReportModal from '../../components/incidents/NewReportModal';
import { filterIncidents } from '../../services/incidentService';
import { CATEGORIES } from '../../utils/format';
import usePageLoad from '../../hooks/usePageLoad';

const FILTERS = ['All', 'Critical', 'High', 'Medium', 'Low', 'Pending Verification', 'In Progress', 'Resolved'];
const PAGE = 8;
export default function Incidents() {
  const { incidents } = useApp();
  const [sp] = useSearchParams();
  const [q, setQ] = useState(sp.get('q') || '');
  const [filter, setFilter] = useState('All');
  const [type, setType] = useState('All');
  const [sort, setSort] = useState('newest');
  const [shown, setShown] = useState(PAGE);
  const [drawer, setDrawer] = useState(null);
  const [newOpen, setNewOpen] = useState(false);
  const loading = usePageLoad();
  useEffect(() => { setQ(sp.get('q') || ''); }, [sp]);
  useEffect(() => setShown(PAGE), [q, filter, type, sort]);
  const rows = useMemo(() => filterIncidents(incidents, { q, filter, type, sort }), [incidents, q, filter, type, sort]);
  const current = drawer && incidents.find((i) => i.id === drawer);
  return (
    <div>
      <PageHeader title="Live Incidents" desc="Monitor, review and manage incoming emergency reports.">
        <div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral" /><input className="input !w-56 !pl-9" placeholder="Search incidents" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search incidents" /></div>
        <button className="btn-primary" onClick={() => setNewOpen(true)}><Plus size={15} />New Report</button>
      </PageHeader>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => <button key={f} onClick={() => setFilter(f)} className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${filter === f ? 'border-accent bg-accent-soft text-accent' : 'border-line bg-white text-neutral hover:text-navy'}`}>{f}</button>)}
        <div className="ml-auto flex gap-2">
          <select className="input !w-auto" value={type} onChange={(e) => setType(e.target.value)} aria-label="Filter by category"><option value="All">All categories</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
          <select className="input !w-auto" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort"><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select>
        </div>
      </div>
      <div className="card">
        {loading ? <div className="space-y-2 p-4">{[0, 1, 2, 3, 4].map((k) => <Skeleton key={k} className="h-10" />)}</div>
          : rows.length === 0 ? <Empty title="No incidents match" desc="Try a different search or clear the filters."><button className="btn-outline" onClick={() => { setQ(''); setFilter('All'); setType('All'); }}>Clear filters</button></Empty>
          : <IncidentTable rows={rows.slice(0, shown)} onOpen={(i) => setDrawer(i.id)} />}
        {!loading && rows.length > 0 && <div className="flex items-center justify-between border-t border-line p-3 text-xs text-neutral"><span>Showing {Math.min(shown, rows.length)} of {rows.length}</span>{shown < rows.length && <button className="btn-outline" onClick={() => setShown(shown + PAGE)}>Load more</button>}</div>}
      </div>
      <Drawer open={!!current} onClose={() => setDrawer(null)} title="Incident summary">{current && <IncidentDrawerBody inc={current} />}</Drawer>
      <NewReportModal open={newOpen} onClose={() => setNewOpen(false)} />
    </div>
  );
}
