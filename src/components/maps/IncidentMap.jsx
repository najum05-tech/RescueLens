import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { renderToStaticMarkup } from 'react-dom/server';
import { Link } from 'react-router-dom';
import { CAT_ICON, PriorityBadge } from '../common/ui';
import { PRIORITY_COLOR } from '../../utils/format';
import { ISLAMABAD } from '../../utils/geo';
import { AlertTriangle } from 'lucide-react';

const cache = {};
export const markerIcon = (type, priority, selected) => {
  const key = `${type}-${priority}-${selected}`;
  if (cache[key]) return cache[key];
  const I = CAT_ICON[type] || AlertTriangle, size = selected ? 40 : 30;
  const html = `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${PRIORITY_COLOR[priority]};display:grid;place-items:center;border:3px solid #fff;box-shadow:0 2px 6px rgba(20,36,58,.35);${selected ? 'outline:3px solid ' + PRIORITY_COLOR[priority] + '55;' : ''}transition:all .2s">${renderToStaticMarkup(<I size={selected ? 18 : 14} color="#fff" />)}</div>`;
  return (cache[key] = L.divIcon({ html, className: 'rl-marker', iconSize: [size, size], iconAnchor: [size / 2, size / 2], popupAnchor: [0, -size / 2] }));
};

function Controller({ selected, center, refs }) {
  const map = useMap();
  useEffect(() => { setTimeout(() => map.invalidateSize(), 250); }, [map]);
  useEffect(() => {
    if (!selected) return;
    map.flyTo([selected.lat, selected.lng], Math.max(map.getZoom(), 14), { duration: 0.6 });
    setTimeout(() => refs.current[selected.id]?.openPopup(), 650);
  }, [selected?.id]); // eslint-disable-line
  useEffect(() => { if (center) map.flyTo(center, 15, { duration: 0.6 }); }, [center, map]);
  return null;
}

export default function IncidentMap({ incidents, selectedId, onSelect, center, zoom = 12, className = 'h-full w-full', scroll = true }) {
  const refs = useRef({});
  const selected = useMemo(() => incidents.find((i) => i.id === selectedId), [incidents, selectedId]);
  return (
    <MapContainer center={ISLAMABAD} zoom={zoom} scrollWheelZoom={scroll} className={className}>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Controller selected={selected} center={center} refs={refs} />
      {incidents.map((i) => (
        <Marker key={i.id} position={[i.lat, i.lng]} icon={markerIcon(i.type, i.priority, i.id === selectedId)} ref={(m) => { if (m) refs.current[i.id] = m; }} eventHandlers={{ click: () => onSelect?.(i.id) }}>
          <Popup>
            <div className="min-w-[190px] space-y-1">
              <div className="flex items-center justify-between gap-2"><b className="text-navy">{i.type}</b><PriorityBadge priority={i.priority} /></div>
              <p className="!my-1 text-xs text-slate-600">{i.description.length > 90 ? i.description.slice(0, 87) + '...' : i.description}</p>
              <p className="!my-0 text-xs text-neutral">{i.id} · {i.location}</p>
              <Link to={`/incidents/${i.id}`} className="text-xs font-medium text-accent">View details</Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
