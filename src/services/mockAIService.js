import { SECTORS, distanceKm } from '../utils/geo';
import { DEPT } from '../utils/format';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const hash = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

const KEYWORDS = {
  Flood: ['flood', 'water', 'rain', 'drain', 'nullah', 'sailab', 'pani', 'سیلاب', 'پانی', 'بارش'],
  Fire: ['fire', 'smoke', 'flame', 'burn', 'aag', 'dhuan', 'آگ', 'دھواں'],
  'Road Accident': ['accident', 'crash', 'collision', 'car', 'bike', 'bus', 'road', 'hadsa', 'حادثہ', 'گاڑی', 'ٹکر'],
  Medical: ['injured', 'collapsed', 'fever', 'bleeding', 'heart', 'breath', 'zakhmi', 'bimar', 'زخمی', 'بیمار', 'سانس'],
  Earthquake: ['earthquake', 'tremor', 'quake', 'zalzala', 'زلزلہ', 'جھٹکے'],
};
const SEVERE = ['trapped', 'unconscious', 'collapsed', 'blocked', 'critical', 'severe', 'bleeding', 'phanse', 'پھنس', 'بے ہوش', 'شدید'];
const NUM = { one: 1, two: 2, three: 3, four: 4, five: 5, ek: 1, do: 2, teen: 3, char: 4, paanch: 5, ایک: 1, دو: 2, تین: 3, چار: 4, پانچ: 5 };
const LOC_URDU = { 'اسلام آباد': 'Islamabad', 'راولپنڈی': 'Rawalpindi', 'صدر': 'Saddar, Rawalpindi' };

export const detectLanguage = (t) => (/[\u0600-\u06FF]/.test(t) ? 'Urdu' : /\b(mein|hai|hua|hain|aur|ho|ki|ka|ko|se|nahi)\b/i.test(t) ? 'Roman Urdu' : 'English');

export async function analyzeText(text) {
  await wait(900);
  const lower = text.toLowerCase();
  let type = 'Other', best = 0;
  for (const [cat, words] of Object.entries(KEYWORDS)) {
    const n = words.filter((w) => lower.includes(w)).length;
    if (n > best) { best = n; type = cat; }
  }
  const sector = SECTORS.find((s) => lower.includes(s.name.toLowerCase().split(' ')[0].replace(',', '')) && s.name.split(' ')[0].length > 2);
  const urduLoc = Object.keys(LOC_URDU).find((k) => text.includes(k));
  const city = lower.includes('islamabad') ? 'Islamabad' : lower.includes('rawalpindi') ? 'Rawalpindi' : null;
  const location = sector?.name || (urduLoc && LOC_URDU[urduLoc]) || city || 'Not stated';
  const digit = text.match(/\b(\d{1,3})\b\s*(people|persons|log|injured|افراد|لوگ)?/i);
  const word = Object.keys(NUM).find((w) => new RegExp(`(^|\\s)${w}(\\s|$)`, 'i').test(text) && lower.includes(w) && (w !== 'do' || /\bdo\s+(log|people|افراد)/i.test(text) || /دو/.test(text)));
  const people = digit ? Number(digit[1]) : word ? NUM[word] : null;
  const severeHits = SEVERE.filter((w) => lower.includes(w)).length;
  const severity = severeHits >= 2 || (people && people >= 5) ? 'High' : severeHits === 1 || type === 'Fire' || type === 'Medical' || (people && people >= 2) ? 'Medium-High' : 'Medium';
  const safetyRisk = severity === 'High' ? 'Elevated: ongoing danger to life' : severity === 'Medium-High' ? 'Moderate: possible injuries' : 'Moderate: needs verification';
  return {
    language: detectLanguage(text), category: type, location, severity, people: people ?? 'Not stated', safetyRisk,
    department: DEPT[type],
    summary: `${type === 'Other' ? 'Unclassified emergency' : type} report${location !== 'Not stated' ? ` near ${location}` : ''}${people ? ` involving about ${people} people` : ''}. Verify details with the reporter before dispatch.`,
    confidence: 70 + (hash(text) % 24),
  };
}

export async function analyzeImage(file) {
  await wait(1200);
  const opts = [
    { label: 'Flooded street', category: 'Flood', hazards: ['Standing water', 'Stalled vehicles'], severity: 'Medium-High' },
    { label: 'Smoke and flames', category: 'Fire', hazards: ['Visible flames', 'Dense smoke'], severity: 'High' },
    { label: 'Vehicle collision', category: 'Road Accident', hazards: ['Blocked lane', 'Possible fuel leak'], severity: 'Medium-High' },
    { label: 'Damaged structure', category: 'Earthquake', hazards: ['Wall cracks', 'Debris'], severity: 'Medium' },
  ];
  const o = opts[hash(file.name + file.size) % opts.length];
  return { ...o, confidence: 72 + (hash(file.name) % 20), department: DEPT[o.category], note: 'Mock analysis for demonstration. No image data leaves your browser.' };
}

const tokens = (s) => new Set(s.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter((w) => w.length > 3));
export function findRelated(inc, all) {
  const a = tokens(inc.description);
  return all
    .filter((o) => o.id !== inc.id && o.type === inc.type && o.status !== 'Resolved')
    .map((o) => {
      const d = distanceKm(inc, o);
      const b = tokens(o.description);
      const j = [...a].filter((w) => b.has(w)).length / Math.max(1, new Set([...a, ...b]).size);
      const sim = Math.round(100 * (0.5 * Math.min(1, j * 3) + 0.5 * Math.max(0, 1 - d / 3)));
      return { id: o.id, incident: o, distance: d, similarity: sim };
    })
    .filter((r) => r.distance < 3 && r.similarity >= 45)
    .sort((x, y) => y.similarity - x.similarity);
}

// Duplicate reports are deliberately NOT a factor: many reports must not auto-raise priority.
export function suggestPriority(inc) {
  const sevMap = { Flood: 3, Fire: 4, 'Road Accident': 3, Medical: 4, Earthquake: 3, Other: 2 };
  const text = inc.description.toLowerCase();
  const severity = Math.min(5, sevMap[inc.type] + (SEVERE.some((w) => text.includes(w)) ? 1 : 0));
  const risk = /live wire|gas|flame|trapped|seizure|breath|collapsed|stuck|rising/.test(text) ? 4 : 2;
  const peopleScore = inc.people >= 10 ? 4 : inc.people >= 3 ? 3 : inc.people >= 1 ? 2 : 1;
  const verif = inc.verified ? 4 : 1;
  const evid = inc.evidence === 'video' ? 4 : inc.evidence === 'photo' ? 3 : 1;
  const factors = [
    { name: 'Severity', score: severity, weight: 0.35, note: 'Incident type and severity indicators in the description' },
    { name: 'Safety risk', score: risk, weight: 0.25, note: 'Immediate danger to life or property' },
    { name: 'People affected', score: peopleScore, weight: 0.2, note: inc.people ? `About ${inc.people} reported` : 'None stated' },
    { name: 'Verification', score: verif, weight: 0.1, note: inc.verified ? 'Verified by an operator' : 'Not yet verified' },
    { name: 'Evidence', score: evid, weight: 0.1, note: inc.evidence === 'none' ? 'No attachments' : `Attached ${inc.evidence}` },
  ];
  const total = factors.reduce((s, f) => s + f.score * f.weight, 0);
  const suggested = total >= 3.7 ? 'Critical' : total >= 3.0 ? 'High' : total >= 2.2 ? 'Medium' : 'Low';
  return { factors, total: Math.round(total * 10) / 10, suggested };
}

export function analyzeIncident(inc) {
  const p = suggestPriority(inc);
  return {
    category: inc.type,
    summary: inc.description.length > 110 ? inc.description.slice(0, 107) + '...' : inc.description,
    severity: p.suggested,
    safetyRisk: p.factors[1].score >= 4 ? 'Elevated' : 'Moderate',
    confidence: 74 + (hash(inc.id) % 21),
    extracted: [['Location', inc.location], ['People affected', inc.people || 'Not stated'], ['Evidence', inc.evidence === 'none' ? 'None' : inc.evidence]],
    department: DEPT[inc.type],
    priority: p,
  };
}
