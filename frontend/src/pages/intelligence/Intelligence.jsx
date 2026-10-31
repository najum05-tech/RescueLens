import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Upload, X, Loader2, ImageIcon, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { useApp } from '../../context/AppContext';
import { Bar, Disclaimer, PageHeader, PriorityBadge } from '../../components/common/ui';
import { analyzeImage, analyzeText, findRelated, suggestPriority } from '../../services/mockAIService';
import { decideDuplicate, getDuplicateSuggestions } from '../../services/api';
import { PRIORITY_COLOR } from '../../utils/format';

const SAMPLES = [
  ['Roman Urdu', 'Islamabad mein road accident hua hai aur do log injured hain.'],
  ['English', 'Fire in a shop at F-7 Jinnah Super, smoke is spreading and 5 people are trapped on the first floor.'],
  ['Urdu', 'راولپنڈی صدر میں نالہ لئی کا پانی سڑک پر آ گیا ہے اور تین لوگ پھنس گئے ہیں۔'],
];
const Card = ({ title, desc, children }) => <section className="card p-4"><h2 className="text-[15px]">{title}</h2><p className="mb-3 text-xs text-neutral">{desc}</p>{children}</section>;

function TextAnalysis() {
  const [text, setText] = useState(SAMPLES[0][1]);
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const run = async () => { if (!text.trim()) return toast.error('Enter a report to analyze'); setBusy(true); setRes(await analyzeText(text)); setBusy(false); };
  const rows = res && [['Incident category', res.category], ['Location', res.location], ['Severity', res.severity], ['People affected', res.people], ['Safety risk', res.safetyRisk], ['Recommended department', res.department], ['Detected language', res.language]];
  return (
    <Card title="Multilingual Emergency Understanding" desc="Paste a report in Urdu, English or Roman Urdu and get structured output.">
      <div className="mb-2 flex flex-wrap gap-2">{SAMPLES.map(([l, s]) => <button key={l} className="btn-outline !py-1 text-xs" onClick={() => { setText(s); setRes(null); }}>{l} sample</button>)}</div>
      <textarea rows={4} className="input" dir="auto" value={text} onChange={(e) => setText(e.target.value)} aria-label="Emergency report text" />
      <button className="btn-primary mt-3" onClick={run} disabled={busy}>{busy ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}Analyze Report</button>
      {res && <div className="mt-4 space-y-3">
        <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">{rows.map(([k, v]) => <div key={k} className="flex justify-between border-b border-line py-1.5"><dt className="text-neutral">{k}</dt><dd className="font-medium text-navy">{v}</dd></div>)}</dl>
        <p className="text-navy">{res.summary}</p>
        <div><div className="mb-1 flex justify-between text-xs"><span className="text-neutral">Confidence</span><b>{res.confidence}%</b></div><Bar value={res.confidence} max={100} /></div>
        <Disclaimer />
      </div>}
    </Card>
  );
}

function ImageAnalysis() {
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState(null);
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const input = useRef();
  const pick = (f) => { if (!f) return; if (!f.type.startsWith('image/')) return toast.error('Please choose an image file'); setFile(f); setUrl(URL.createObjectURL(f)); setRes(null); };
  const clear = () => { setFile(null); setUrl(null); setRes(null); if (input.current) input.current.value = ''; };
  return (
    <Card title="Image Analysis" desc="Upload a photo of the scene. Images stay in your browser in this demo.">
      {!url ? (
        <div onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]); }}
          className={`grid h-40 place-items-center rounded-lg border-2 border-dashed text-center ${drag ? 'border-accent bg-accent-soft' : 'border-line'}`}>
          <div><Upload className="mx-auto mb-1 text-neutral" size={22} /><p className="text-navy">Drag and drop an image</p><button className="mt-1 text-accent" onClick={() => input.current.click()}>or choose a file</button></div>
        </div>) : (
        <div className="relative inline-block"><img src={url} alt="Uploaded preview" className="max-h-48 rounded-lg border border-line" /><button className="absolute -right-2 -top-2 rounded-full border border-line bg-white p-1 shadow-soft" onClick={clear} aria-label="Remove image"><X size={13} /></button></div>)}
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files[0])} />
      <div><button className="btn-primary mt-3" disabled={!file || busy} onClick={async () => { setBusy(true); setRes(await analyzeImage(file)); setBusy(false); }}>{busy ? <Loader2 size={15} className="animate-spin" /> : <ImageIcon size={15} />}Analyze Image</button></div>
      {res && <div className="mt-4 space-y-2"><dl className="space-y-1.5">{[['Scene', res.label], ['Likely category', res.category], ['Estimated severity', res.severity], ['Visible hazards', res.hazards.join(', ')], ['Recommended department', res.department]].map(([k, v]) => <div key={k} className="flex justify-between border-b border-line py-1.5"><dt className="text-neutral">{k}</dt><dd className="font-medium text-navy">{v}</dd></div>)}</dl><div className="text-xs text-neutral">Confidence {res.confidence}% · {res.note}</div><Disclaimer /></div>}
    </Card>
  );
}

function Duplicates() {
  const { incidents, canOperate, user, update } = useApp();
  const [serverPairs, setServerPairs] = useState([]);
  useEffect(() => { if (!user || !canOperate) { setServerPairs([]); return; } getDuplicateSuggestions().then(setServerPairs).catch(() => setServerPairs([])); }, [incidents, user, canOperate]);
  const pairs = useMemo(() => {
    const seen = new Set(), out = [];
    incidents.filter((i) => i.status !== 'Resolved').forEach((i) => findRelated(i, incidents).forEach((r) => { const k = [i.id, r.id].sort().join(); if (!seen.has(k)) { seen.add(k); out.push({ a: i, ...r }); } }));
    return out.sort((x, y) => y.similarity - x.similarity).slice(0, 5);
  }, [incidents]);
  const serverByIncident = serverPairs.map((p) => ({ ...p, a: incidents.find((i) => i.database_id === p.reportId), incident: incidents.find((i) => i.database_id === p.incidentId) })).filter((p) => p.a && p.incident);
  return (
    <Card title="Duplicate Detection" desc="Semantic embedding suggestions are filtered by time, category, and geography. Grouping needs operator verification.">
      {serverByIncident.length > 0 && <ul className="mb-3 divide-y divide-line">{serverByIncident.map((p) => <li key={`server-${p.id}`} className="flex flex-wrap items-center gap-3 py-3"><div className="min-w-0 flex-1 text-xs"><p><span className="text-neutral">Possible duplicate</span> <Link className="font-medium text-navy hover:text-accent" to={`/incidents/${p.incident.id}`}>{p.incident.id}</Link></p><p className="truncate text-neutral">{p.reason}</p></div><div className="text-right text-xs"><b className="text-navy">{Math.round(p.score * 100)}%</b> similar</div><div className="flex gap-2"><button className="btn-outline !py-1" disabled={!canOperate} onClick={async () => { await decideDuplicate(p.id, 'confirmed'); toast.success('Duplicate suggestion confirmed'); setServerPairs((x) => x.filter((v) => v.id !== p.id)); }}>Confirm</button><button className="btn-ghost !py-1" disabled={!canOperate} onClick={async () => { await decideDuplicate(p.id, 'rejected'); toast.success('Suggestion rejected'); setServerPairs((x) => x.filter((v) => v.id !== p.id)); }}>Reject</button></div></li>)}</ul>}
      {pairs.length === 0 && <p className="text-neutral">No potential duplicates found.</p>}
      <ul className="divide-y divide-line">{pairs.map((p) => (
        <li key={p.a.id + p.id} className="flex flex-wrap items-center gap-3 py-3">
          <div className="min-w-0 flex-1 text-xs"><p><span className="text-neutral">Original</span> <Link className="font-medium text-navy hover:text-accent" to={`/incidents/${p.a.id}`}>{p.a.id}</Link> <span className="text-neutral">· possible duplicate</span> <Link className="font-medium text-navy hover:text-accent" to={`/incidents/${p.id}`}>{p.id}</Link></p><p className="truncate text-neutral">{p.a.location} / {p.incident.location}</p></div>
          <div className="text-right text-xs"><b className="text-navy">{p.similarity}%</b> similar<br /><span className="text-neutral">{p.distance.toFixed(1)} km apart</span></div>
          <button className="btn-outline !py-1" onClick={() => { if (!canOperate) return toast.error('Operator role required'); if (!p.a.verified) return toast.error(`Verify ${p.a.id} before grouping`); update(p.a.id, { grouped: [...new Set([...p.a.grouped, p.id])] }, `Grouped with ${p.id} after verification`); toast.success('Reports grouped'); }}><Copy size={13} />{p.a.grouped.includes(p.id) ? 'Grouped' : 'Suggested: group'}</button>
        </li>))}</ul>
    </Card>
  );
}

function PriorityEngine() {
  const { incidents } = useApp();
  const open = incidents.filter((i) => i.status !== 'Resolved');
  const [id, setId] = useState(open[0]?.id);
  const inc = incidents.find((i) => i.id === id) || open[0];
  const p = inc && suggestPriority(inc);
  return (
    <Card title="AI Priority Engine" desc="See why a priority was suggested. Duplicate report volume never raises priority.">
      <select className="input mb-4" value={inc?.id} onChange={(e) => setId(e.target.value)} aria-label="Choose incident">{open.map((i) => <option key={i.id} value={i.id}>{i.id} · {i.type} · {i.location}</option>)}</select>
      {p && <>
        <div className="mb-4 grid grid-cols-4 gap-2">{['Critical', 'High', 'Medium', 'Low'].map((priority) => <div key={priority} className="rounded-lg border border-line p-2 text-center"><div className="text-lg font-semibold text-navy">{incidents.filter((item) => item.priority === priority).length}</div><div className="text-[11px] text-neutral">{priority}</div></div>)}</div>
        <div className="mb-4 flex items-center justify-between rounded-lg bg-canvas p-3"><span className="text-neutral">Suggested priority</span><span className="flex items-center gap-2"><PriorityBadge priority={p.suggested} /><span className="text-xs text-neutral">score {p.total}/5</span></span></div>
        <div className="space-y-3">{p.factors.map((f) => <div key={f.name}><div className="mb-1 flex justify-between text-xs"><span className="font-medium text-navy">{f.name} <span className="font-normal text-neutral">({Math.round(f.weight * 100)}% weight)</span></span><span className="text-neutral">{f.note}</span></div><Bar value={f.score} color={PRIORITY_COLOR[p.suggested]} /></div>)}</div>
        <div className="mt-3"><Disclaimer /></div></>}
    </Card>
  );
}

export default function Intelligence() {
  return (
    <div>
      <PageHeader title="AI Intelligence" desc="AI assessments remain reviewable and never dispatch responders automatically." />
      <div className="grid gap-5 xl:grid-cols-2"><TextAnalysis /><ImageAnalysis /><Duplicates /><PriorityEngine /><Card title="Analysis Queue" desc="Reports that still need AI processing or human review."><AnalysisQueue /></Card></div>
    </div>
  );
}

function AnalysisQueue() {
  const { incidents } = useApp();
  const queue = incidents.filter((i) => ['Reported', 'Under Verification', 'Submitted', 'Under Review'].includes(i.status));
  if (!queue.length) return <p className="text-neutral">The analysis queue is empty.</p>;
  return <ul className="divide-y divide-line">{queue.slice(0, 8).map((i) => <li key={i.id} className="flex items-center justify-between gap-3 py-2"><div><Link className="font-medium text-navy hover:text-accent" to={`/incidents/${i.id}`}>{i.id}</Link><p className="text-xs text-neutral">{i.type} · awaiting review</p></div><span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">Pending</span></li>)}</ul>;
}
