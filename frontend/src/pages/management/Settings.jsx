import { RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useApp, ROLES } from '../../context/AppContext';
import { PageHeader } from '../../components/common/ui';

const USERS = [['Ayesha Rehman', 'ayesha@demo.rescuelens', 'Administrator'], ['Emergency Operator', 'operator@demo.rescuelens', 'Emergency Operator'], ['Hamza Farooq', 'hamza@demo.rescuelens', 'Emergency Operator']];
const Toggle = ({ on, onChange, label }) => <button role="switch" aria-checked={on} aria-label={label} onClick={onChange} className={`relative h-6 w-10 rounded-full transition-colors ${on ? 'bg-accent' : 'bg-line'}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} /></button>;

export default function Settings() {
  const { settings, setSettings, role, setRole, resetDemo } = useApp();
  const opts = [['sound', 'Alert sound', 'Play a sound for new critical incidents'], ['email', 'Email summaries', 'Daily summary of open incidents'], ['autoRefresh', 'Auto-refresh incidents', 'Keep the incident list current'], ['compact', 'Compact tables', 'Use tighter row spacing']];
  return (
    <div className="max-w-3xl">
      <PageHeader title="Settings" desc="Platform preferences and demo controls. Stored in this browser only." />
      <section className="card mb-5 divide-y divide-line">{opts.map(([k, t, d]) => <div key={k} className="flex items-center justify-between p-4"><div><p className="font-medium text-navy">{t}</p><p className="text-xs text-neutral">{d}</p></div><Toggle label={t} on={settings[k]} onChange={() => { setSettings({ ...settings, [k]: !settings[k] }); toast.success(`${t} ${settings[k] ? 'off' : 'on'}`); }} /></div>)}</section>
      <section className="card mb-5 p-4"><h2 className="mb-1 text-[15px]">Demo role</h2><p className="mb-3 text-xs text-neutral">Roles are simulated. Real authentication will be added with the backend.</p>
        <div className="flex flex-wrap gap-2">{Object.entries(ROLES).filter(([k]) => k !== 'citizen').map(([k, v]) => <button key={k} className={role === k ? 'btn-primary' : 'btn-outline'} onClick={() => { setRole(k); toast.success(`Role: ${v}`); }}>{v}</button>)}</div></section>
      <section className="card mb-5 overflow-x-auto"><div className="p-4 pb-2"><h2 className="text-[15px]">Users</h2></div>
        {role !== 'admin' ? <p className="px-4 pb-4 text-neutral">Switch to the Administrator role to manage users.</p> :
          <table className="w-full text-left"><tbody>{USERS.map(([n, e, r]) => <tr key={e} className="border-t border-line"><td className="td font-medium text-navy">{n}</td><td className="td text-neutral">{e}</td><td className="td">{r}</td><td className="td text-right"><button className="btn-ghost !py-1" onClick={() => toast('User management is mocked in this demo')}>Manage</button></td></tr>)}</tbody></table>}</section>
      <section className="card flex items-center justify-between p-4"><div><p className="font-medium text-navy">Reset demo data</p><p className="text-xs text-neutral">Restore incidents and teams to their starting state.</p></div><button className="btn-danger" onClick={resetDemo}><RotateCcw size={14} />Reset</button></section>
    </div>
  );
}
