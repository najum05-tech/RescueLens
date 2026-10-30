export default function Logo({ light = false, sub = true, size = 32 }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden><rect width="32" height="32" rx="8" fill={light ? '#3978C5' : '#14243A'} /><circle cx="16" cy="16" r="7" fill="none" stroke={light ? '#fff' : '#3978C5'} strokeWidth="3" /><circle cx="16" cy="16" r="2.5" fill="#fff" /></svg>
      <div className="leading-tight"><div className={`text-[15px] font-semibold ${light ? 'text-white' : 'text-navy'}`}>RescueLens AI</div>{sub && <div className={`text-[11px] ${light ? 'text-slate-400' : 'text-neutral'}`}>Emergency Intelligence</div>}</div>
    </div>
  );
}
