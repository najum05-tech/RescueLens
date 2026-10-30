import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/common/ui';
import IncidentTable from '../../components/incidents/IncidentTable';
import { filterIncidents } from '../../services/incidentService';

export default function History() {
  const { incidents } = useApp();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [scope, setScope] = useState('Resolved');
  const rows = useMemo(() => filterIncidents(incidents, { q, filter: scope }), [incidents, q, scope]);
  const exportCsv = () => {
    const head = ['ID', 'Type', 'Location', 'Reporter', 'Priority', 'Status', 'Reported'];
    const csv = [head, ...rows.map((i) => [i.id, i.type, i.location, i.reporter, i.priority, i.status, i.time])].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'rescuelens-demo-reports.csv'; a.click();
    toast.success(`Exported ${rows.length} reports`);
  };
  return (
    <div>
      <PageHeader title="Reports History" desc="Review past reports and export demo data.">
        <div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral" /><input className="input !w-52 !pl-9" placeholder="Search history" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search history" /></div>
        <select className="input !w-auto" value={scope} onChange={(e) => setScope(e.target.value)} aria-label="Scope"><option value="Resolved">Resolved</option><option value="All">All reports</option></select>
        <button className="btn-outline" onClick={exportCsv} disabled={!rows.length}><Download size={15} />Export CSV</button>
      </PageHeader>
      <div className="card">{rows.length ? <IncidentTable rows={rows} onOpen={(i) => nav(`/incidents/${i.id}`)} /> : <p className="py-10 text-center text-neutral">No reports in this view.</p>}</div>
    </div>
  );
}
