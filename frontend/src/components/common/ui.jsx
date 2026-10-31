import { AnimatePresence, motion } from 'framer-motion';
import { Droplets, Flame, Car, HeartPulse, Activity, AlertTriangle, X, Inbox } from 'lucide-react';
import { PRIORITY_COLOR } from '../../utils/format';

export const CAT_ICON = { Flood: Droplets, Fire: Flame, 'Road Accident': Car, Medical: HeartPulse, Earthquake: Activity, Other: AlertTriangle };
export const CategoryIcon = ({ type, size = 16, className = '' }) => { const I = CAT_ICON[type] || AlertTriangle; return <I size={size} className={className} />; };

export const PriorityBadge = ({ priority }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: PRIORITY_COLOR[priority] + '1A', color: PRIORITY_COLOR[priority] }}>
    <span className="h-1.5 w-1.5 rounded-full" style={{ background: PRIORITY_COLOR[priority] }} />{priority}
  </span>
);
const STATUS_STYLE = { Reported: 'bg-slate-100 text-slate-600', 'Under Verification': 'bg-amber-50 text-amber-700', Verified: 'bg-accent-soft text-accent', Assigned: 'bg-indigo-50 text-indigo-600', 'Response in Progress': 'bg-orange-50 text-orange-600', Resolved: 'bg-emerald-50 text-emerald-700',
  Available: 'bg-emerald-50 text-emerald-700', Busy: 'bg-orange-50 text-orange-600', Offline: 'bg-slate-100 text-slate-500' };
export const StatusBadge = ({ status }) => <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[status] || STATUS_STYLE.Reported}`}>{status}</span>;

export const PageHeader = ({ title, desc, children }) => (
  <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
    <div><h1 className="text-xl">{title}</h1>{desc && <p className="mt-0.5 text-neutral">{desc}</p>}</div>
    <div className="flex flex-wrap items-center gap-2">{children}</div>
  </div>
);

export const Skeleton = ({ className = '' }) => <div className={`skeleton ${className}`} />;

export const Empty = ({ title, desc, children }) => (
  <div className="flex flex-col items-center py-12 text-center">
    <Inbox className="mb-2 text-[#A0AEC0]" size={28} />
    <p className="font-medium text-navy">{title}</p>{desc && <p className="mt-0.5 max-w-xs text-neutral">{desc}</p>}
    <div className="mt-3">{children}</div>
  </div>
);

export const Modal = ({ open, onClose, title, children, wide }) => (
  <AnimatePresence>
    {open && (
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
        <div className="absolute inset-0 bg-navy/40" onClick={onClose} />
        <motion.div role="dialog" aria-modal="true" aria-label={title} className={`card relative max-h-[90vh] w-full overflow-auto p-5 ${wide ? 'max-w-2xl' : 'max-w-md'}`} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 8, opacity: 0 }} transition={{ duration: 0.2 }}>
          <div className="mb-4 flex items-center justify-between"><h2 className="text-base">{title}</h2><button className="btn-ghost !p-1.5" onClick={onClose} aria-label="Close"><X size={16} /></button></div>
          {children}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export const Drawer = ({ open, onClose, title, children }) => (
  <AnimatePresence>
    {open && (
      <div className="fixed inset-0 z-50">
        <motion.div className="absolute inset-0 bg-navy/40" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} />
        <motion.aside role="dialog" aria-label={title} className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-xl" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.22, ease: 'easeOut' }}>
          <div className="flex items-center justify-between border-b border-line p-4"><h2 className="text-base">{title}</h2><button className="btn-ghost !p-1.5" onClick={onClose} aria-label="Close"><X size={16} /></button></div>
          <div className="flex-1 overflow-auto p-4">{children}</div>
        </motion.aside>
      </div>
    )}
  </AnimatePresence>
);

export const Field = ({ label, children }) => <div><label className="label">{label}</label>{children}</div>;
export const Disclaimer = () => (
  <p className="flex items-start gap-2 rounded-lg bg-accent-soft p-2.5 text-xs text-navy"><AlertTriangle size={14} className="mt-0.5 shrink-0 text-accent" />AI-generated assessment. Human verification is required before operational decisions.</p>
);
export const Bar = ({ value, max = 5, color = '#3978C5' }) => (
  <div className="h-1.5 w-full rounded-full bg-line"><div className="h-full rounded-full" style={{ width: `${(value / max) * 100}%`, background: color }} /></div>
);
