import { Link } from 'react-router-dom';
import { CategoryIcon, PriorityBadge, StatusBadge } from '../common/ui';
import { fmtDateTime } from '../../utils/format';
export default function IncidentDrawerBody({ inc }) {
  const rows = [['Category', inc.type], ['Location', inc.location], ['Reported', fmtDateTime(inc.time)], ['Reported by', inc.reporter], ['People affected', inc.people || 'Not stated']];
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2"><CategoryIcon type={inc.type} className="text-accent" /><span className="font-medium text-navy">{inc.id}</span><PriorityBadge priority={inc.priority} /><StatusBadge status={inc.status} /></div>
      <p className="text-navy">{inc.description}</p>
      <dl className="divide-y divide-line rounded-lg border border-line">{rows.map(([k, v]) => <div key={k} className="flex justify-between px-3 py-2"><dt className="text-neutral">{k}</dt><dd className="text-right text-navy">{v}</dd></div>)}</dl>
      <Link to={`/incidents/${inc.id}`} className="btn-primary w-full">Open full incident</Link>
    </div>
  );
}
