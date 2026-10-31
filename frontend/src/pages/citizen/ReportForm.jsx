import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Mic, MapPin, Upload, X, Video, CheckCircle2, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { Field, StatusBadge, CategoryIcon } from '../../components/common/ui';
import { useApp } from '../../context/AppContext';
import { CATEGORIES, resizeImage } from '../../utils/format';
import { SECTORS, ISLAMABAD } from '../../utils/geo';

const STEPS = ['Emergency', 'Evidence', 'Location', 'Contact', 'Review'];
export default function ReportForm() {
  const { submitReport } = useApp();
  const { register, watch, trigger, setValue, getValues, formState: { errors } } = useForm({ defaultValues: { type: '', description: '', language: 'English', anonymous: false, name: '', phone: '', sector: '', locDesc: '' } });
  const [step, setStep] = useState(0);
  const [preview, setPreview] = useState(null);
  const [video, setVideo] = useState(null);
  const [geo, setGeo] = useState(null);
  const [listening, setListening] = useState(false);
  const [done, setDone] = useState(null);
  const recRef = useRef(null);
  const v = watch();
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

  const next = async () => {
    if (step === 0 && !(await trigger(['type', 'description']))) return;
    if (step === 2 && !geo && !v.sector) return toast.error('Share your location or choose a place');
    if (step === 3 && !v.anonymous && !(await trigger('phone'))) return;
    setStep(step + 1);
  };
  const onImage = async (f) => { if (!f) return; if (!f.type.startsWith('image/')) return toast.error('Please choose an image'); setPreview(await resizeImage(f)); };
  const share = () => {
    if (!navigator.geolocation) return toast.error('Location is not supported in this browser');
    navigator.geolocation.getCurrentPosition((p) => { setGeo({ lat: p.coords.latitude, lng: p.coords.longitude }); toast.success('Location shared'); }, () => toast.error('Permission denied. Choose a place manually.'));
  };
  const voice = () => {
    if (!SR) return toast.error('Voice input is not supported in this browser');
    if (listening) { recRef.current?.stop(); return; }
    const r = new SR(); r.lang = v.language === 'English' ? 'en-US' : 'ur-PK'; r.interimResults = false;
    r.onresult = (e) => setValue('description', `${getValues('description')} ${e.results[0][0].transcript}`.trim(), { shouldValidate: true });
    r.onend = () => setListening(false); r.onerror = () => { setListening(false); toast.error('Voice input failed'); };
    recRef.current = r; setListening(true); r.start();
  };
  const submit = async () => {
    const s = SECTORS.find((x) => x.name === v.sector);
    const pos = geo || s || { lat: ISLAMABAD[0], lng: ISLAMABAD[1] };
    const label = [s?.name || (geo ? 'Shared location' : ''), v.locDesc].filter(Boolean).join(' · ');
    try {
      const inc = await submitReport({ category: v.type, description: v.description, language: v.language, location: label, lat: pos.lat, lng: pos.lng, contact: v.anonymous ? '' : v.phone, anonymous: v.anonymous });
      setDone(inc); toast.success(`Report ${inc.id} submitted`);
    } catch (e) { toast.error(e.message || 'Report could not be submitted'); }
  };

  if (done) return (
    <div className="card mx-auto max-w-lg p-6 text-center">
      <CheckCircle2 className="mx-auto mb-2 text-low" size={36} /><h1 className="text-lg">Report submitted</h1>
      <p className="mt-1 text-neutral">Your report ID is <b className="text-navy">{done.id}</b>. It is stored in RescueLens for review and has not been sent to any emergency service.</p>
      <div className="mt-4 rounded-lg bg-canvas p-3 text-start"><div className="mb-1 flex items-center justify-between"><span className="flex items-center gap-2 font-medium text-navy"><CategoryIcon type={done.type} />{done.type}</span><StatusBadge status={done.status} /></div><p className="text-navy">{done.description}</p><p className="mt-1 text-xs text-neutral">{done.location}</p></div>
      <p className="mt-3 flex items-start gap-2 text-start text-xs text-neutral"><Info size={14} className="mt-0.5 shrink-0" />For immediate danger, contact your local emergency service directly.</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2"><Link to="/citizen/reports" className="btn-primary">View My Reports</Link><button className="btn-outline" onClick={() => window.location.reload()}>Report another</button></div>
    </div>);

  const review = [['Category', v.type, 0], ['Description', v.description, 0], ['Language', v.language, 0], ['Evidence', [preview && 'Photo', video && `Video (${video})`].filter(Boolean).join(', ') || 'None', 1], ['Location', [geo && 'Current location shared', v.sector, v.locDesc].filter(Boolean).join(' · '), 2], ['Contact', v.anonymous ? 'Anonymous' : `${v.name || 'No name'} · ${v.phone}`, 3]];
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-xl">Report an Emergency</h1>
      <p className="mb-5 flex items-start gap-2 text-xs text-neutral"><Info size={14} className="mt-0.5 shrink-0" />Demonstration only. For immediate danger, contact your local emergency service directly.</p>
      <ol className="mb-5 flex items-center gap-2">{STEPS.map((s, k) => <li key={s} className="flex flex-1 items-center gap-2"><span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-medium ${k <= step ? 'bg-accent text-white' : 'bg-line text-neutral'}`}>{k < step ? <Check size={12} /> : k + 1}</span><span className={`hidden text-xs sm:block ${k === step ? 'font-medium text-navy' : 'text-neutral'}`}>{s}</span>{k < 4 && <span className={`h-px flex-1 ${k < step ? 'bg-accent' : 'bg-line'}`} />}</li>)}</ol>
      <div className="card p-5">
        <AnimatePresence mode="wait"><motion.div key={step} className="space-y-4" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
          {step === 0 && <>
            <Field label="What type of emergency is this?"><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{CATEGORIES.map((c) => <label key={c} className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 ${v.type === c ? 'border-accent bg-accent-soft text-accent' : 'border-line text-navy hover:bg-canvas'}`}><input type="radio" value={c} className="sr-only" {...register('type', { required: 'Choose a category' })} /><CategoryIcon type={c} />{c}</label>)}</div>{errors.type && <p className="mt-1 text-xs text-critical">{errors.type.message}</p>}</Field>
            <Field label="Describe what is happening"><div className="relative"><textarea rows={4} dir="auto" className="input" placeholder="Where are you, what do you see, is anyone hurt?" {...register('description', { required: 'Add a short description', minLength: { value: 10, message: 'Use at least 10 characters' } })} /></div>{errors.description && <p className="mt-1 text-xs text-critical">{errors.description.message}</p>}</Field>
            <Field label="Preferred language"><select className="input" {...register('language')}>{['English', 'اردو (Urdu)', 'Roman Urdu'].map((l) => <option key={l}>{l}</option>)}</select></Field>
          </>}
          {step === 1 && <>
            <Field label="Photo (optional)">{preview ? <div className="relative inline-block"><img src={preview} alt="Preview" className="max-h-48 rounded-lg border border-line" /><button className="absolute -right-2 -top-2 rounded-full border border-line bg-white p-1" onClick={() => setPreview(null)} aria-label="Remove photo"><X size={13} /></button></div> : <label className="grid h-32 cursor-pointer place-items-center rounded-lg border-2 border-dashed border-line text-center text-neutral hover:bg-canvas"><span><Upload className="mx-auto mb-1" size={20} />Choose a photo<input type="file" accept="image/*" hidden onChange={(e) => onImage(e.target.files[0])} /></span></label>}</Field>
            <Field label="Short video (optional)">{video ? <p className="flex items-center gap-2 text-navy"><Video size={15} />{video}<button className="text-neutral" onClick={() => setVideo(null)} aria-label="Remove video"><X size={14} /></button></p> : <label className="btn-outline cursor-pointer"><Video size={15} />Choose video<input type="file" accept="video/*" hidden onChange={(e) => { const f = e.target.files[0]; if (f) { if (f.size > 50e6) return toast.error('Video must be under 50 MB'); setVideo(f.name); } }} /></label>}</Field>
            <Field label="Voice input"><button type="button" className={listening ? 'btn-danger' : 'btn-outline'} onClick={voice}><Mic size={15} />{listening ? 'Listening… tap to stop' : 'Add to description by voice'}</button>{!SR && <p className="mt-1 text-xs text-neutral">Your browser does not support voice input.</p>}</Field>
          </>}
          {step === 2 && <>
            <Field label="Your location"><button type="button" className="btn-outline" onClick={share}><MapPin size={15} />{geo ? 'Location shared' : 'Share my current location'}</button><p className="mt-1 text-xs text-neutral">Only requested when you tap the button. You can choose a place instead.</p></Field>
            <Field label="Or choose a place"><select className="input" {...register('sector')}><option value="">Select a place</option>{SECTORS.map((s) => <option key={s.name}>{s.name}</option>)}</select></Field>
            <Field label="Describe the location (optional)"><input className="input" placeholder="Near the petrol pump, opposite the bank…" {...register('locDesc')} /></Field>
          </>}
          {step === 3 && <>
            <label className="flex items-center gap-2 text-navy"><input type="checkbox" className="accent-[#3978C5]" {...register('anonymous')} />Report anonymously</label>
            {!v.anonymous && <><Field label="Name (optional)"><input className="input" {...register('name')} /></Field>
              <Field label="Contact number"><input className="input" inputMode="tel" placeholder="03XX XXXXXXX" {...register('phone', { required: 'Add a contact number or report anonymously', pattern: { value: /^[0-9+\s-]{7,15}$/, message: 'Enter a valid phone number' } })} />{errors.phone && <p className="mt-1 text-xs text-critical">{errors.phone.message}</p>}</Field></>}
          </>}
          {step === 4 && <><h2 className="text-[15px]">Review your report</h2><dl className="divide-y divide-line rounded-lg border border-line">{review.map(([k, val, s]) => <div key={k} className="flex items-start justify-between gap-3 px-3 py-2"><div className="min-w-0"><dt className="text-xs text-neutral">{k}</dt><dd className="break-words text-navy">{val || 'Not provided'}</dd></div><button className="text-xs font-medium text-accent" onClick={() => setStep(s)}>Edit</button></div>)}</dl></>}
        </motion.div></AnimatePresence>
        <div className="mt-6 flex justify-between"><button className="btn-outline" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</button>{step < 4 ? <button className="btn-primary" onClick={next}>Continue</button> : <button className="btn-primary" onClick={submit}>Submit report</button>}</div>
      </div>
    </div>
  );
}
