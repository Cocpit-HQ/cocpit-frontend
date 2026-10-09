export const COMPANY_STAGES = {
  0: { id: 'choose-type',    label: 'Choose Organization', next: 1,    prev: null },
  1: { id: 'identity',       label: 'Stage 1: Identity',   next: 2,    prev: 0 },
  2: { id: 'presence',       label: 'Stage 2: Presence',   next: 3,    prev: 1 },
  3: { id: 'verification',   label: 'Stage 3: Verification', next: 4,    prev: 2 },
  4: { id: 'live',           label: 'Live',                  next: null, prev: 3 },
  5: { id: 'error',          label: 'Error',                 next: null, prev: 3 },
};

// Re-exported from the shared module so the wizard and the profile edit form
// (CompanyEditProfileTab) can't drift apart on option casing/shape again.
export {
  INDUSTRY_OPTIONS,
  INSTITUTION_INDUSTRY_OPTIONS,
  COMPANY_SIZE_OPTIONS,
} from '@/constants/organizationOptions';
