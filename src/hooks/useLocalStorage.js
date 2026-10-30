import { useEffect, useState } from 'react';
export default function useLocalStorage(key, init) {
  const [v, setV] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : typeof init === 'function' ? init() : init; }
    catch { return typeof init === 'function' ? init() : init; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* storage full */ } }, [key, v]);
  return [v, setV];
}
