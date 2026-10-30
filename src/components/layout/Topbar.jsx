import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, Search, Bell, ChevronDown, Check, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { useApp, ROLES } from '../../context/AppContext';
import { timeAgo } from '../../utils/format';

function Menu_({ open, children, align = 'right' }) {
  return (
    <AnimatePresence>{open && (
      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}
        className={`card absolute top-full z-40 mt-2 w-72 overflow-hidden ${align === 'right' ? 'right-0' : 'left-0'}`}>{children}</motion.div>
    )}</AnimatePresence>
  );
}

export default function Topbar({ onMenu }) {
  const { role, setRole, activity, unread, markSeen } = useApp();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(null);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(null); };
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, []);
  const switchRole = (r) => { setRole(r); setOpen(null); toast.success(`Demo role: ${ROLES[r]}`); nav(r === 'citizen' ? '/citizen' : '/dashboard'); };
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-white/90 px-4 backdrop-blur lg:px-6" ref={ref}>
      <button className="btn-ghost !p-2 lg:hidden" onClick={onMenu} aria-label="Open menu"><Menu size={18} /></button>
      <form className="relative max-w-md flex-1" onSubmit={(e) => { e.preventDefault(); nav(`/incidents?q=${encodeURIComponent(q)}`); }}>
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral" />
        <input className="input !pl-9" placeholder="Search incidents, locations, IDs" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search incidents" />
      </form>
      <div className="ml-auto flex items-center gap-1.5">
        <div className="relative">
          <button className="btn-ghost relative !p-2" aria-label="Notifications" onClick={() => { setOpen(open === 'n' ? null : 'n'); markSeen(); }}>
            <Bell size={18} />{unread > 0 && <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-critical px-1 text-[10px] font-semibold text-white">{Math.min(unread, 9)}</span>}
          </button>
          <Menu_ open={open === 'n'}>
            <div className="border-b border-line px-3 py-2 text-xs font-medium text-neutral">Recent activity</div>
            <ul className="max-h-72 overflow-auto">{activity.slice(0, 6).map((a, i) => (
              <li key={i}><button className="w-full px-3 py-2 text-left hover:bg-canvas" onClick={() => { setOpen(null); nav(`/incidents/${a.id}`); }}><p className="text-[13px] text-navy">{a.id}: {a.text}</p><p className="text-xs text-neutral">{timeAgo(a.time)}</p></button></li>
            ))}</ul>
          </Menu_>
        </div>
        <div className="relative">
          <button className="btn-ghost !gap-2 !px-2" onClick={() => setOpen(open === 'p' ? null : 'p')} aria-label="Switch demo role">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-navy text-[11px] font-semibold text-white">EO</span>
            <span className="hidden text-left leading-tight sm:block"><span className="block text-[13px] font-medium text-navy">Emergency Operator</span><span className="block text-[11px] text-neutral">{ROLES[role]}</span></span>
            <ChevronDown size={14} />
          </button>
          <Menu_ open={open === 'p'}>
            <div className="flex items-center gap-2 border-b border-line px-3 py-2 text-xs font-medium text-neutral"><Users size={13} />Demo role switcher</div>
            {Object.entries(ROLES).map(([k, v]) => (
              <button key={k} className="flex w-full items-center justify-between px-3 py-2 text-left text-[13px] hover:bg-canvas" onClick={() => switchRole(k)}>{v}{role === k && <Check size={14} className="text-accent" />}</button>
            ))}
          </Menu_>
        </div>
      </div>
    </header>
  );
}
