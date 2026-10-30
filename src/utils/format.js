export const timeAgo = (iso) => {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 1) return 'Just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  return `${Math.floor(h / 24)} d ago`;
};
export const fmtDateTime = (iso) =>
  new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
export const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];
export const STATUSES = ['Reported', 'Under Verification', 'Verified', 'Assigned', 'Response in Progress', 'Resolved'];
export const CATEGORIES = ['Flood', 'Fire', 'Road Accident', 'Medical', 'Earthquake', 'Other'];
export const PRIORITY_COLOR = { Critical: '#DC4545', High: '#E58A35', Medium: '#D6AE43', Low: '#429B75' };
export const DEPT = { Flood: 'Flood Rescue', Fire: 'Fire Rescue', 'Road Accident': 'Medical', Medical: 'Medical', Earthquake: 'General Emergency Response', Other: 'General Emergency Response' };
export const resizeImage = (file, max = 360) =>
  new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        const s = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = img.width * s; c.height = img.height * s;
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = () => resolve(null);
      img.src = r.result;
    };
    r.onerror = () => resolve(null);
    r.readAsDataURL(file);
  });
