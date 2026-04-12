export const STATE_BENCH_MAP: Record<string, string[]> = {
  'Andhra Pradesh': ['Amaravati', 'Visakhapatnam'],
  'Assam': ['Guwahati'],
  'Bihar': ['Patna'],
  'Chhattisgarh': ['Bilaspur'],
  'Delhi': ['New Delhi'],
  'Goa': ['Panaji'],
  'Gujarat': ['Ahmedabad', 'Surat'],
  'Haryana': ['Chandigarh', 'Faridabad'],
  'Himachal Pradesh': ['Shimla'],
  'Jharkhand': ['Ranchi'],
  'Karnataka': ['Bengaluru', 'Dharwad', 'Kalaburagi'],
  'Kerala': ['Ernakulam', 'Thiruvananthapuram'],
  'Madhya Pradesh': ['Jabalpur', 'Gwalior', 'Indore'],
  'Maharashtra': ['Mumbai', 'Nagpur', 'Aurangabad', 'Pune'],
  'Manipur': ['Imphal'],
  'Meghalaya': ['Shillong'],
  'Odisha': ['Cuttack', 'Bhubaneswar'],
  'Punjab': ['Chandigarh', 'Ludhiana'],
  'Rajasthan': ['Jodhpur', 'Jaipur'],
  'Sikkim': ['Gangtok'],
  'Tamil Nadu': ['Chennai', 'Madurai'],
  'Telangana': ['Hyderabad'],
  'Tripura': ['Agartala'],
  'Uttar Pradesh': ['Allahabad', 'Lucknow'],
  'Uttarakhand': ['Nainital'],
  'West Bengal': ['Kolkata'],
}

export const STATES = Object.keys(STATE_BENCH_MAP).sort()

/** Flat list of all bench cities across all states */
export const ALL_BENCHES = STATES.flatMap((s) => STATE_BENCH_MAP[s])
