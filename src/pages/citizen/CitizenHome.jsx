import { Link } from 'react-router-dom';
import { Siren, ShieldCheck, Languages, Camera, MapPin, Info } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function CitizenHome() {
  const { t, lang } = useApp();
  const ur = lang === 'ur';
  const feats = [[Camera, 'Share evidence', 'Add a photo, a short video or a voice note to help responders understand the scene.'], [MapPin, 'Share your location', 'Use your current position with your permission, or choose a place manually.'], [Languages, 'Report in your language', 'Write in Urdu, English or Roman Urdu. Operators see a structured summary.']];
  return (
    <div className="space-y-10">
      <section className="mx-auto max-w-3xl py-8 text-center sm:py-14">
        <h1 className={`text-3xl leading-tight sm:text-4xl ${ur ? 'urdu' : ''}`}>{t.heroTitle}</h1>
        <p className={`mx-auto mt-4 max-w-xl text-base text-neutral ${ur ? 'urdu' : ''}`}>{t.heroDesc}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link to="/citizen/report" className="btn-primary !px-5 !py-2.5 text-sm"><Siren size={16} />{t.cta1}</Link>
          <Link to="/citizen/safety" className="btn-outline !px-5 !py-2.5 text-sm"><ShieldCheck size={16} />{t.cta2}</Link>
        </div>
        <p className={`mx-auto mt-8 flex max-w-xl items-start gap-2 rounded-lg border border-high/30 bg-high/10 p-3 text-start text-xs text-navy ${ur ? 'urdu' : ''}`}><Info size={15} className="mt-0.5 shrink-0 text-high" />{t.notice}</p>
      </section>
      <section className="grid gap-4 sm:grid-cols-3">{feats.map(([I, h, d]) => <div key={h} className="card p-5"><span className="mb-3 grid h-9 w-9 place-items-center rounded-lg bg-accent-soft text-accent"><I size={18} /></span><h2 className="text-[15px]">{h}</h2><p className="mt-1 text-neutral">{d}</p></div>)}</section>
    </div>
  );
}
