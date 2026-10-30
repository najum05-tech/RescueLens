import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { useApp } from '../../context/AppContext';
import { CategoryIcon, Empty, Modal, StatusBadge } from '../../components/common/ui';
import { STATUSES, fmtDateTime, timeAgo } from '../../utils/format';

export default function MyReports() {
  const { incidents, update } = useApp();
  const mine = incidents.filter((i) => i.mine).sort((a, b) => new Date(b.time) - new Date(a.time));
  const [view, setView] = useState(null);
  const [edit, setEdit] = useState(null);
  const [text, setText] = useState('');
  const vi = incidents.find((i) => i.id === view);
  const editable = (i) => ['Reported', 'Under Verification'].includes(i.status);
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-xl">My Reports</h1><p className="mb-5 text-neutral">Track the status of reports you submitted from this browser.</p>
      {mine.length === 0 ? <div className="card"><Empty title="No reports yet" desc="Reports you submit will appear here."><Link to="/citizen/report" className="btn-primary">Report an Emergency</Link></Empty></div> :
        <ul className="space-y-3">{mine.map((i) => (
          <li key={i.id} className="card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2"><span className="flex items-center gap-2 font-medium text-navy"><CategoryIcon type={i.type} className="text-accent" />{i.type} · {i.id}</span><StatusBadge status={i.status} /></div>
            <p className="mt-2 line-clamp-2 text-navy">{i.description}</p><p className="mt-1 text-xs text-neutral">{i.location} · {timeAgo(i.time)}</p>
            <div className="mt-3 h-1.5 rounded-full bg-line"><div className="h-full rounded-full bg-accent transition-all" style={{ width: `${((STATUSES.indexOf(i.status) + 1) / STATUSES.length) * 100}%` }} /></div>
            <div className="mt-3 flex gap-2"><button className="btn-outline !py-1" onClick={() => setView(i.id)}><Eye size={13} />View details</button>
              <button className="btn-outline !py-1" disabled={!editable(i)} title={editable(i) ? '' : 'Locked after verification'} onClick={() => { setEdit(i); setText(i.description); }}><Pencil size={13} />Edit</button></div>
          </li>))}</ul>}
      <Modal open={!!vi} onClose={() => setView(null)} title={vi ? `${vi.type} · ${vi.id}` : ''} wide>{vi && <div className="space-y-3">
        <p className="text-navy">{vi.description}</p>{vi.preview && <img src={vi.preview} alt="Attached" className="max-h-48 rounded-lg border border-line" />}
        <p className="text-xs text-neutral">{vi.location} · Submitted {fmtDateTime(vi.time)}</p>
        <h3 className="text-sm">Updates</h3><ol className="space-y-2 border-s border-line ps-4">{[...vi.history].reverse().map((h, k) => <li key={k} className="relative"><span className="absolute -start-[21px] top-1.5 h-2 w-2 rounded-full bg-accent" />{h.text} <span className="text-xs text-neutral">· {timeAgo(h.time)}</span></li>)}</ol></div>}</Modal>
      <Modal open={!!edit} onClose={() => setEdit(null)} title="Edit report">
        <textarea rows={4} className="input" value={text} onChange={(e) => setText(e.target.value)} aria-label="Description" />
        <div className="mt-4 flex justify-end gap-2"><button className="btn-outline" onClick={() => setEdit(null)}>Cancel</button><button className="btn-primary" onClick={() => { if (text.trim().length < 10) return toast.error('Use at least 10 characters'); update(edit.id, { description: text.trim() }, 'Description edited by reporter'); toast.success('Report updated'); setEdit(null); }}>Save changes</button></div>
      </Modal>
    </div>
  );
}
