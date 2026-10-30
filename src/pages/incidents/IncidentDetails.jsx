import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BadgeCheck, UserPlus, Flag, CheckCheck, ImageIcon, MapPin, Copy, Link2, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useApp } from '../../context/AppContext';
import { Bar, CategoryIcon, Disclaimer, Modal, PriorityBadge, StatusBadge, Empty } from '../../components/common/ui';
import AssignModal from '../../components/teams/AssignModal';
import { analyzeIncident, findRelated } from '../../services/mockAIService';
import { PRIORITIES, PRIORITY_COLOR, STATUSES, fmtDateTime, timeAgo } from '../../utils/format';

export default function IncidentDetails() {
  const { id } = useParams();
  const nav = useNavigate();
  const { incidents, teams, update, resolve, groupReports, canOperate } = useApp();
  const [assign, setAssign] = useState(false);
  const [prioOpen, setPrioOpen] = useState(false);
  const inc = incidents.find((i) => i.id === id);
  if (!inc) return <Empty title="Incident not found" desc={`No incident with ID ${id}.`}><Link to="/incidents" className="btn-primary">Back to incidents</Link></Empty>;
  const ai = analyzeIncident(inc);
  const related = findRelated(inc, incidents);
  const team = teams.find((t) => t.id === inc.teamId);
  const stepIdx = STATUSES.indexOf(inc.status);
  const guard = (fn) => () => (canOperate ? fn() : toast.error('Operator or administrator role required'));
  const verify = guard(() => { update(inc.id, { status: stepIdx < 2 ? 'Verified' : inc.status, verified: true }, 'Verified by operator'); toast.success('Incident verified'); });
  const start = guard(() => { update(inc.id, { status: 'Response in Progress' }, 'Response in progress'); toast.success('Response marked in progress'); });
  const setPriority = (p) => { update(inc.id, { priority: p }, `Priority changed to ${p}`); toast.success(`Priority set to ${p}`); setPrioOpen(false); };
  const done = inc.status === 'Resolved';
  return (
    <div className="space-y-5">
      <button className="btn-ghost !px-2" onClick={() => nav(-1)}><ArrowLeft size={15} />Back</button>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><div className="flex flex-wrap items-center gap-2"><h1 className="text-xl">{inc.id}</h1><PriorityBadge priority={inc.priority} /><StatusBadge status={inc.status} /></div><p className="mt-0.5 flex items-center gap-1.5 text-neutral"><CategoryIcon type={inc.type} size={14} />{inc.type} · {inc.location}</p></div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-outline" disabled={done || inc.verified} onClick={verify}><BadgeCheck size={15} />Verify Incident</button>
          <button className="btn-outline" disabled={done} onClick={guard(() => setAssign(true))}><UserPlus size={15} />Assign Rescue Team</button>
          <button className="btn-outline" disabled={done} onClick={guard(() => setPrioOpen(true))}><Flag size={15} />Change Priority</button>
          <button className="btn-primary" disabled={done} onClick={guard(() => resolve(inc.id))}><CheckCheck size={15} />Mark as Resolved</button>
        </div>
      </div>
      <section className="card p-4">
        <h2 className="mb-3 text-[15px]">Incident Status</h2>
        <ol className="grid gap-2 sm:grid-cols-6">{STATUSES.map((s, k) => (
          <li key={s} className="flex items-center gap-2 sm:block"><div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium sm:mb-1.5 ${k <= stepIdx ? 'bg-accent text-white' : 'bg-line text-neutral'}`}>{k < stepIdx ? <Check size={13} /> : k + 1}</div><span className={`text-xs ${k === stepIdx ? 'font-medium text-navy' : 'text-neutral'}`}>{s}</span></li>))}</ol>
        {inc.status === 'Assigned' && canOperate && <button className="btn-outline mt-3" onClick={start}>Mark response in progress</button>}
      </section>
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <section className="card p-4">
            <h2 className="mb-3 text-[15px]">Incident Information</h2>
            <p className="mb-4 text-navy">{inc.description}</p>
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">{[['Incident ID', inc.id], ['Category', inc.type], ['Reported', `${fmtDateTime(inc.time)} (${timeAgo(inc.time)})`], ['Location', inc.location], ['Coordinates', `${inc.lat.toFixed(4)}, ${inc.lng.toFixed(4)}`], ['Reporter', inc.reporter], ['Assigned team', team ? `${team.name} (${team.id})` : 'None yet']].map(([k, v]) => <div key={k}><dt className="text-xs text-neutral">{k}</dt><dd className="text-navy">{v}</dd></div>)}</dl>
            <div className="mt-4">
              <p className="mb-1.5 text-xs text-neutral">Attachment</p>
              {inc.preview ? <img src={inc.preview} alt="Attached evidence" className="max-h-56 rounded-lg border border-line" />
                : inc.evidence !== 'none' ? <div className="grid h-36 place-items-center rounded-lg border border-dashed border-line bg-canvas text-center text-neutral"><div><ImageIcon className="mx-auto mb-1" size={22} />Demo {inc.evidence} attachment<br /><span className="text-xs">Preview unavailable in demo data</span></div></div>
                : <p className="text-neutral">No image or video attached.</p>}
            </div>
          </section>
          <section className="card p-4">
            <h2 className="mb-1 text-[15px]">Duplicate Reports</h2>
            <p className="mb-3 text-xs text-neutral">Potentially related reports of the same type nearby. Group only after verification.</p>
            {related.length === 0 ? <p className="text-neutral">No related reports found.</p> : <ul className="divide-y divide-line">{related.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1"><Link to={`/incidents/${r.id}`} className="font-medium text-navy hover:text-accent">{r.id}</Link><p className="truncate text-xs text-neutral">{r.incident.description}</p></div>
                <div className="text-right text-xs"><b className="text-navy">{r.similarity}% similar</b><br /><span className="text-neutral">{r.distance.toFixed(1)} km apart</span></div>
                {inc.grouped.includes(r.id) ? <span className="inline-flex items-center gap-1 text-xs font-medium text-low"><Link2 size={13} />Grouped</span>
                  : <button className="btn-outline !py-1" onClick={guard(() => { if (!inc.verified) return toast.error('Verify this incident before grouping'); groupReports(inc.id, r.id); toast.success(`Grouped with ${r.id}`); })}><Copy size={13} />Group</button>}
              </li>))}</ul>}
          </section>
          <section className="card p-4"><h2 className="mb-3 text-[15px]">Timeline</h2>
            <ol className="space-y-2 border-s border-line ps-4">{[...inc.history].reverse().map((h, k) => <li key={k} className="relative"><span className="absolute -start-[21px] top-1.5 h-2 w-2 rounded-full bg-accent" /><span className="text-navy">{h.text}</span> <span className="text-xs text-neutral">· {timeAgo(h.time)}</span></li>)}</ol></section>
        </div>
        <div className="space-y-5">
          <section className="card p-4">
            <h2 className="mb-3 text-[15px]">AI Analysis</h2>
            <dl className="space-y-2">{[['Detected category', ai.category], ['Estimated severity', ai.severity], ['Safety risk', ai.safetyRisk], ['Recommended department', ai.department]].map(([k, v]) => <div key={k} className="flex justify-between"><dt className="text-neutral">{k}</dt><dd className="font-medium text-navy">{v}</dd></div>)}</dl>
            <div className="mt-3"><div className="mb-1 flex justify-between text-xs"><span className="text-neutral">Confidence</span><b className="text-navy">{ai.confidence}%</b></div><Bar value={ai.confidence} max={100} /></div>
            <p className="mt-3 text-navy">{ai.summary}</p>
            <ul className="mt-3 space-y-1 text-xs">{ai.extracted.map(([k, v]) => <li key={k} className="flex justify-between"><span className="text-neutral">{k}</span><span className="text-navy">{v}</span></li>)}</ul>
            <div className="mt-3"><Disclaimer /></div>
          </section>
          <section className="card p-4">
            <h2 className="mb-1 text-[15px]">Priority Assessment</h2>
            <p className="mb-3 text-xs text-neutral">Current: <b style={{ color: PRIORITY_COLOR[inc.priority] }}>{inc.priority}</b> · Suggested: <b style={{ color: PRIORITY_COLOR[ai.priority.suggested] }}>{ai.priority.suggested}</b></p>
            <div className="space-y-2.5">{ai.priority.factors.map((f) => <div key={f.name}><div className="flex justify-between text-xs"><span className="text-navy">{f.name}</span><span className="text-neutral">{f.note}</span></div><Bar value={f.score} /></div>)}</div>
            <p className="mt-3 text-xs text-neutral">The number of duplicate reports is not a factor.</p>
          </section>
        </div>
      </div>
      <AssignModal open={assign} onClose={() => setAssign(false)} incidentId={inc.id} />
      <Modal open={prioOpen} onClose={() => setPrioOpen(false)} title="Change priority">
        <div className="space-y-2">{PRIORITIES.map((p) => <button key={p} onClick={() => setPriority(p)} className={`flex w-full items-center justify-between rounded-lg border p-3 hover:bg-canvas ${inc.priority === p ? 'border-accent bg-accent-soft' : 'border-line'}`}><PriorityBadge priority={p} />{ai.priority.suggested === p && <span className="text-xs text-neutral">AI suggested</span>}</button>)}</div>
      </Modal>
    </div>
  );
}
