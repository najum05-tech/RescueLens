import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Globe, Menu, X, Siren } from 'lucide-react';
import Logo from './Logo';
import { useApp } from '../../context/AppContext';

export default function CitizenLayout() {
  const { t, lang, setLang, role, setRole } = useApp();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const nav = useNavigate();
  const links = [['/citizen', t.home, true], ['/citizen/report', t.report], ['/citizen/safety', t.safety], ['/citizen/reports', t.myReports]];
  const cls = ({ isActive }) => `rounded-lg px-3 py-1.5 text-[13px] font-medium ${isActive ? 'bg-accent-soft text-accent' : 'text-neutral hover:text-navy'}`;
  return (
    <div className="min-h-full" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
          <Link to="/citizen"><Logo sub={false} /></Link>
          <nav className="hidden flex-1 items-center gap-1 md:flex">{links.map(([to, label, end]) => <NavLink key={to} to={to} end={end} className={cls}>{label}</NavLink>)}</nav>
          <div className="ms-auto flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-neutral"><Globe size={15} />
              <select className="rounded-md border border-line bg-white px-2 py-1 text-xs text-navy" value={lang} onChange={(e) => setLang(e.target.value)} aria-label="Language"><option value="en">English</option><option value="ur">اردو</option></select>
            </label>
            <button className="btn-outline hidden !py-1.5 sm:inline-flex" onClick={() => { setRole('operator'); nav('/dashboard'); }}>Command Center</button>
            <button className="btn-ghost !p-2 md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X size={18} /> : <Menu size={18} />}</button>
          </div>
        </div>
        {open && <nav className="flex flex-col gap-1 border-t border-line p-3 md:hidden">{links.map(([to, label, end]) => <NavLink key={to} to={to} end={end} className={cls} onClick={() => setOpen(false)}>{label}</NavLink>)}
          <button className="btn-outline mt-1" onClick={() => { setRole('operator'); nav('/dashboard'); }}>Switch to Command Center</button></nav>}
      </header>
      <AnimatePresence mode="wait">
        <motion.main key={pathname} className="mx-auto max-w-6xl px-4 py-8" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}><Outlet /></motion.main>
      </AnimatePresence>
      <footer className="border-t border-line py-6 text-center text-xs text-neutral"><Siren size={13} className="mr-1 inline" />Demonstration environment. Not connected to real emergency services.</footer>
    </div>
  );
}
