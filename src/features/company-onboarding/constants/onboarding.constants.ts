export const COMPANY_STAGES = {
  0: { id: 'choose-type',    label: 'Choose Organization', next: 1,    prev: null },
  1: { id: 'identity',       label: 'Stage 1: Identity',   next: 2,    prev: 0 },
  2: { id: 'presence',       label: 'Stage 2: Presence',   next: 3,    prev: 1 },
  3: { id: 'verification',   label: 'Stage 3: Verification', next: 4,    prev: 2 },
  4: { id: 'live',           label: 'Live',                  next: null, prev: 3 },
};

export const INDUSTRY_OPTIONS = [
  { label: 'Information Technology', value: 'information_technology' },
  { label: 'Software & SaaS', value: 'software_saas' },
  { label: 'Healthcare', value: 'healthcare' },
  { label: 'Finance & Banking', value: 'finance_banking' },
  { label: 'Manufacturing', value: 'manufacturing' },
];

export const COMPANY_SIZE_OPTIONS = [
  { label: '1-10 Members', value: '1-10' },
  { label: '11-50 Members', value: '11-50' },
  { label: '51-200 Members', value: '51-200' },
  { label: '201-1000 Members', value: '201-1000' },
  { label: '1000+ Members', value: '1000+' },
];
