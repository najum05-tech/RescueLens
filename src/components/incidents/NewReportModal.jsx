import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Modal, Field } from '../common/ui';
import { SECTORS } from '../../utils/geo';
import { CATEGORIES } from '../../utils/format';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';

export default function NewReportModal({ open, onClose }) {
  const { addIncident } = useApp();
  const nav = useNavigate();
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ defaultValues: { type: 'Flood', location: SECTORS[0].name, priority: 'Medium', people: 0 } });
  const submit = (d) => {
    const s = SECTORS.find((x) => x.name === d.location);
    const inc = addIncident({ type: d.type, description: d.description, location: s.name, lat: s.lat, lng: s.lng, reporter: d.reporter || 'Operator entry', priority: d.priority, people: Number(d.people) || 0 });
    toast.success(`Report ${inc.id} created`); reset(); onClose(); nav(`/incidents/${inc.id}`);
  };
  return (
    <Modal open={open} onClose={onClose} title="New report">
      <form className="space-y-3" onSubmit={handleSubmit(submit)}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category"><select className="input" {...register('type')}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
          <Field label="Priority"><select className="input" {...register('priority')}>{['Critical', 'High', 'Medium', 'Low'].map((c) => <option key={c}>{c}</option>)}</select></Field>
        </div>
        <Field label="Location"><select className="input" {...register('location')}>{SECTORS.map((s) => <option key={s.name}>{s.name}</option>)}</select></Field>
        <Field label="Description"><textarea rows={3} className="input" placeholder="What is happening?" {...register('description', { required: 'Add a short description', minLength: { value: 10, message: 'Use at least 10 characters' } })} />{errors.description && <p className="mt-1 text-xs text-critical">{errors.description.message}</p>}</Field>
        <div className="grid grid-cols-2 gap-3"><Field label="Reporter name"><input className="input" placeholder="Optional" {...register('reporter')} /></Field><Field label="People affected"><input type="number" min="0" className="input" {...register('people')} /></Field></div>
        <div className="flex justify-end gap-2 pt-1"><button type="button" className="btn-outline" onClick={onClose}>Cancel</button><button className="btn-primary">Create report</button></div>
      </form>
    </Modal>
  );
}
