import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { CategoryIcon, PriorityBadge, StatusBadge } from '../common/ui';
import { timeAgo } from '../../utils/format';

export default function IncidentTable({ rows, compact = false, onOpen }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left">
        <thead><tr className="border-b border-line">
          <th className="th">Incident ID</th><th className="th">Type</th><th className="th">Location</th>
          {!compact && <th className="th">Reported by</th>}<th className="th">Priority</th><th className="th">Reported</th><th className="th">Status</th><th className="th text-right">Actions</th>
        </tr></thead>
        <tbody>{rows.map((i) => (
          <tr key={i.id} className="cursor-pointer border-b border-line/70 last:border-0 hover:bg-canvas/70" onClick={() => onOpen(i)}>
            <td className="td font-medium text-navy">{i.id}</td>
            <td className="td"><span className="inline-flex items-center gap-2"><CategoryIcon type={i.type} className="text-neutral" />{i.type}</span></td>
            <td className="td max-w-[180px] truncate">{i.location}</td>
            {!compact && <td className="td text-neutral">{i.reporter}</td>}
            <td className="td"><PriorityBadge priority={i.priority} /></td>
            <td className="td text-neutral">{timeAgo(i.time)}</td>
            <td className="td"><StatusBadge status={i.status} /></td>
            <td className="td text-right" onClick={(e) => e.stopPropagation()}>
              <button className="btn-ghost !px-2 !py-1" onClick={() => onOpen(i)}><Eye size={14} />View Details</button>
            </td>
          </tr>))}
        </tbody>
      </table>
    </div>
  );
}
