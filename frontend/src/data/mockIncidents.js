const ago = (min) => new Date(Date.now() - min * 60000).toISOString();
const mk = (n, type, description, location, lat, lng, reporter, priority, status, min, extra = {}) => ({
  id: `INC-${n}`, type, description, location, lat, lng, reporter, priority, status, time: ago(min),
  people: 0, verified: false, evidence: 'none', teamId: null, mine: false, grouped: [],
  history: [{ text: 'Report received', time: ago(min) }], ...extra,
});
export const buildIncidents = () => [
  mk(2041, 'Flood', 'Nullah Lai water level rising fast near the Saddar crossing. Several shops flooded and the road is blocked.', 'Nullah Lai, Rawalpindi', 33.6, 73.06, 'Ahsan Raza', 'Critical', 'Response in Progress', 38, { people: 12, verified: true, evidence: 'photo', teamId: 'TM-103' }),
  mk(2042, 'Flood', 'Flooding at Nullah Lai bridge, water entering houses near Saddar. Families on the ground floor need help.', 'Saddar, Rawalpindi', 33.5984, 73.0441, 'Sana Malik', 'High', 'Verified', 31, { people: 8, verified: true, evidence: 'photo' }),
  mk(2043, 'Flood', 'Heavy water flow near Nullah Lai, road closed and people stuck in vehicles.', 'Nullah Lai, Rawalpindi', 33.601, 73.058, 'Anonymous', 'Medium', 'Under Verification', 24, { people: 3 }),
  mk(2044, 'Road Accident', 'Two-car collision at Faizabad Interchange. Two people injured and one car blocking the left lane.', 'Faizabad Interchange', 33.658, 73.083, 'Bilal Hussain', 'High', 'Assigned', 55, { people: 2, verified: true, evidence: 'photo', teamId: 'TM-101' }),
  mk(2045, 'Fire', 'Smoke and flames coming from a restaurant kitchen in Jinnah Super Market. Staff have evacuated.', 'F-7 Jinnah Super', 33.7215, 73.0565, 'Farah Naeem', 'Critical', 'Response in Progress', 19, { people: 15, verified: true, evidence: 'video', teamId: 'TM-102' }),
  mk(2046, 'Medical', 'Elderly man collapsed outside the bank, conscious but struggling to breathe.', 'G-9 Markaz', 33.6902, 73.033, 'Usman Tariq', 'High', 'Verified', 14, { people: 1, verified: true }),
  mk(2047, 'Road Accident', 'Motorcycle skid on Kashmir Highway near the underpass. Rider on the road.', 'Kashmir Highway', 33.699, 73.027, 'Anonymous', 'Medium', 'Reported', 9, { people: 1 }),
  mk(2048, 'Fire', 'Grass fire spreading on Margalla Trail 3 near the picnic spot. Hikers are moving away.', 'Margalla Trail 3', 33.746, 73.066, 'Hira Aslam', 'High', 'Under Verification', 47, { people: 6, evidence: 'photo' }),
  mk(2049, 'Earthquake', 'Tremors felt in Blue Area offices. Cracks visible in one stairwell, building evacuated.', 'Blue Area', 33.7077, 73.0551, 'Kamran Sheikh', 'Medium', 'Verified', 72, { people: 40, verified: true }),
  mk(2050, 'Other', 'Fallen electric pole blocking the street in I-8. Live wires on the ground.', 'I-8 Markaz', 33.665, 73.075, 'Zainab Qureshi', 'High', 'Assigned', 63, { people: 0, verified: true, evidence: 'photo', teamId: 'TM-106' }),
  mk(2051, 'Medical', 'Child with high fever and seizure at home, parents need transport to hospital.', 'G-11 Markaz', 33.67, 72.987, 'Rubina Khan', 'Critical', 'Verified', 6, { people: 1, verified: true }),
  mk(2052, 'Flood', 'Water logging in underpass near E-11, two vehicles stalled.', 'E-11 Sector', 33.7, 72.976, 'Tahir Mehmood', 'Low', 'Reported', 28, { people: 2 }),
  mk(2053, 'Road Accident', 'Bus and rickshaw collision near Bhara Kahu chowk. Several passengers hurt.', 'Bhara Kahu', 33.725, 73.167, 'Imran Shah', 'Critical', 'Under Verification', 11, { people: 5 }),
  mk(2054, 'Other', 'Gas leak smell reported around an apartment block in H-9.', 'H-9 Sector', 33.6544, 72.999, 'Maryam Ali', 'Medium', 'Resolved', 310, { people: 20, verified: true, evidence: 'none' }),
  mk(2055, 'Fire', 'Electrical short circuit in a shop at F-6 Markaz, fire put out by shopkeepers.', 'F-6 Markaz', 33.7294, 73.0786, 'Adeel Javed', 'Low', 'Resolved', 420, { people: 0, verified: true }),
  mk(2056, 'Flood', 'Overflowing drain at Rawal Lake View road, ankle-deep water on the carriageway.', 'Rawal Lake View', 33.7, 73.128, 'Noor Fatima', 'Low', 'Resolved', 520, { verified: true }),
  mk(2057, 'Medical', 'Heat exhaustion reported at a public event, two attendees fainted.', 'Blue Area', 33.71, 73.06, 'Omar Siddiqui', 'Medium', 'Resolved', 680, { people: 2, verified: true }),
  mk(2058, 'Road Accident', 'Minor collision at G-9 signal, no injuries, traffic slow.', 'G-9 Markaz', 33.691, 73.034, 'Danish Iqbal', 'Low', 'Resolved', 800, { verified: true }),
  mk(2059, 'Flood', 'Rainwater entering the ground floor of my building near Saddar. Need advice and help.', 'Saddar, Rawalpindi', 33.599, 73.046, 'You', 'Medium', 'Under Verification', 20, { mine: true, people: 4, evidence: 'photo' }),
  mk(2060, 'Medical', 'Neighbour fell from stairs, possible fracture, needs assistance.', 'F-6 Markaz', 33.73, 73.079, 'You', 'Medium', 'Resolved', 900, { mine: true, people: 1, verified: true }),
];
