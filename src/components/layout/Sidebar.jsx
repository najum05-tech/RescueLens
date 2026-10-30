import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Siren, Map, Sparkles, LifeBuoy, ShieldCheck, BarChart3, History, Settings, LogOut, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Logo from './Logo';
import { useApp, ROLES } from '../../context/AppContext';

const MAIN = [['/dashboard', 'Overview', LayoutDashboard], ['/incidents', 'Live Incidents', Siren], ['/map', 'Emergency Map', Map], ['/intelligence', 'AI Intelligence', Sparkles], ['/teams', 'Rescue Teams', LifeBuoy], ['/safety', 'Safety Guidance', ShieldCheck], ['/analytics', 'Analytics', BarChart3]];
const MGMT = [['/history', 'Reports History', History], ['/settings', 'Settings', Settings]];

function Item({ to, label, icon: Icon, collapsed, onClick }) {
  return (
    <NavLink to={to} onClick={onClick} title={collapsed ? label : undefined}
      className={({ isActive }) => `relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors duration-150 ${isActive ? 'bg-accent/20 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'} ${collapsed ? 'justify-center' : ''}`}>
      {({ isActive }) => (<>
        {isActive && <motion.span layoutId="nav-indicator" className="absolute left-0 top-1.5 h-[calc(100%-12px)] w-[3px] rounded-r bg-accent" transition={{ duration: 0.2 }} />}
        <Icon size={18} className="shrink-0" />{!collapsed && <span className="truncate">{label}</span>}
      </>)}
    </NavLink>
  );
}

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const { role } = useApp();
  const nav = useNavigate();
  const close = () => setMobileOpen(false);
  const inner = (isCollapsed) => (
    <div className="flex h-full flex-col bg-navy p-3 text-white">
      <div className={`flex items-center py-2 ${isCollapsed ? 'justify-center' : 'justify-between px-1'}`}>
        {isCollapsed ? <Logo light sub={false} /> : <Logo light />}
        {mobileOpen && <button className="text-slate-400 lg:hidden" onClick={close} aria-label="Close menu"><X size={18} /></button>}
      </div>
      <nav className="mt-4 flex-1 space-y-1 overflow-y-auto">
        {!isCollapsed && <p className="px-3 pb-1 text-[11px] text-slate-500">Main</p>}
        {MAIN.map(([to, label, icon]) => <Item key={to} {...{ to, label, icon }} collapsed={isCollapsed} onClick={close} />)}
        {!isCollapsed ? <p className="px-3 pb-1 pt-4 text-[11px] text-slate-500">Management</p> : <div className="my-3 border-t border-white/10" />}
        {MGMT.map(([to, label, icon]) => <Item key={to} {...{ to, label, icon }} collapsed={isCollapsed} onClick={close} />)}
      </nav>
      <div className="border-t border-white/10 pt-3">
        <div className={`flex items-center gap-2.5 ${isCollapsed ? 'justify-center' : 'px-1'}`}>
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold">EO</div>
          {!isCollapsed && <div className="min-w-0 flex-1 leading-tight"><div className="truncate text-[13px] font-medium">Emergency Operator</div><div className="text-[11px] text-slate-400">{ROLES[role]}</div></div>}
          {!isCollapsed && <button className="rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Log out" onClick={() => { toast('Logged out of demo'); nav('/citizen'); }}><LogOut size={16} /></button>}
        </div>
        {isCollapsed && <button className="mx-auto mt-2 block rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Log out" onClick={() => { toast('Logged out of demo'); nav('/citizen'); }}><LogOut size={16} /></button>}
        <button className="mt-2 hidden w-full items-center justify-center gap-2 rounded-lg py-1.5 text-xs text-slate-400 hover:bg-white/5 hover:text-white lg:flex" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <PanelLeftOpen size={16} /> : <><PanelLeftClose size={16} />Collapse</>}
        </button>
      </div>
    </div>
  );
  return (<>
    <motion.aside className="fixed inset-y-0 left-0 z-30 hidden lg:block" animate={{ width: collapsed ? 76 : 256 }} transition={{ duration: 0.2 }}>{inner(collapsed)}</motion.aside>
    {mobileOpen && (
      <div className="fixed inset-0 z-40 lg:hidden">
        <motion.div className="absolute inset-0 bg-navy/50" onClick={close} initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
        <motion.div className="absolute inset-y-0 left-0 w-64" initial={{ x: -260 }} animate={{ x: 0 }} transition={{ duration: 0.2 }}>{inner(false)}</motion.div>
      </div>
    )}
  </>);
}
