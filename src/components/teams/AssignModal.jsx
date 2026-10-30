import { useEffect, useState } from 'react';
import { Modal } from '../common/ui';
import { StatusBadge } from '../common/ui';
import { useApp } from '../../context/AppContext';
import { specsFor } from '../../services/teamService';

// Pass incidentId to choose a team, or teamId to choose an incident.
export default function AssignModal({ open, onClose, incidentId, teamId }) {
  const { teams, incidents, assignTeam } = useApp();
  const [sel, setSel] = useState(null);
  useEffect(() => { setSel(null); }, [open, incidentId, teamId]);
  const inc = incidents.find((i) => i.id === incidentId);
  const options = incidentId
    ? teams.filter((t) => t.availability === 'Available').sort((a, b) => (b.spec === specsFor(inc?.type)) - (a.spec === specsFor(inc?.type)))
    : incidents.filter((i) => !['Resolved'].includes(i.status) && !i.teamId);
  const confirm = () => { assignTeam(incidentId || sel, teamId || sel); onClose(); };
  return (
    <Modal open={open} onClose={onClose} title={incidentId ? `Assign team to ${incidentId}` : 'Assign to an incident'}>
      <p className="mb-3 text-xs text-neutral">Demo action only. No real rescue organization receives this assignment.</p>
      <div className="max-h-72 space-y-2 overflow-auto">
        {options.length === 0 && <p className="py-6 text-center text-neutral">{incidentId ? 'No teams are available right now.' : 'No unassigned incidents.'}</p>}
        {options.map((o) => (
          <label key={o.id} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${sel === o.id ? 'border-accent bg-accent-soft' : 'border-line hover:bg-canvas'}`}>
            <input type="radio" name="opt" className="accent-[#3978C5]" checked={sel === o.id} onChange={() => setSel(o.id)} />
            {incidentId ? <div className="flex-1"><div className="font-medium text-navy">{o.name}</div><div className="text-xs text-neutral">{o.spec} · {o.location}</div></div>
              : <div className="flex-1"><div className="font-medium text-navy">{o.id} · {o.type}</div><div className="text-xs text-neutral">{o.location} · {o.priority}</div></div>}
            {incidentId && o.spec === specsFor(inc?.type) && <StatusBadge status="Verified" />}
          </label>))}
      </div>
      <div className="mt-4 flex justify-end gap-2"><button className="btn-outline" onClick={onClose}>Cancel</button><button className="btn-primary" disabled={!sel} onClick={confirm}>Assign team</button></div>
    </Modal>
  );
}
