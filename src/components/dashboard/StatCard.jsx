import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import useCountUp from '../../hooks/useCountUp';
export default function StatCard({ icon: Icon, label, value, trend, desc, tint = '#3978C5' }) {
  const n = useCountUp(value);
  const up = trend >= 0;
  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.15 }} className="card p-4">
      <div className="flex items-center justify-between">
        <span className="text-neutral">{label}</span>
        <span className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: tint + '1A', color: tint }}><Icon size={16} /></span>
      </div>
      <div className="mt-2 flex items-end gap-2">
        <span className="text-2xl font-semibold text-navy">{n}</span>
        <span className={`mb-1 inline-flex items-center gap-0.5 text-xs font-medium ${up ? 'text-low' : 'text-critical'}`}>{up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{Math.abs(trend)}%</span>
      </div>
      <p className="mt-0.5 text-xs text-neutral">{desc}</p>
    </motion.div>
  );
}
