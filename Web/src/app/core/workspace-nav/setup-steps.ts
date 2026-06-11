export interface NavItem {
  label: string;
  step?: string;
  path: string;
}

// Linear, gated setup flow — mirrors STEP_ORDER from the guided onboarding wizard.
export const SETUP_STEPS: NavItem[] = [
  { label: 'Overview', step: 'ComplianceAttestation', path: '' },
  { label: 'Facility Info', step: 'FacilityInfo', path: 'facility-info' },
  { label: 'Server Info', step: 'ServerInfo', path: 'server-info' },
  { label: 'Authorization', step: 'Authorization', path: 'authorization' },
  { label: 'Connection Test', step: 'ConnectionTest', path: 'connection-test' },
  { label: 'Patients of Interest', step: 'PatientsOfInterest', path: 'patients-of-interest' },
  { label: 'Location.type Mapping', step: 'LocationTypeMapping', path: 'location-type-mapping' },
  { label: 'Encounter.type Mapping', step: 'EncounterTypeMapping', path: 'encounter-type-mapping' },
  { label: 'Validation Report', step: 'VerifyPoi', path: 'verify-poi' },
  { label: 'Test Reports', step: 'TestReport', path: 'test-reports' },
  { label: 'Operations', step: 'Operations', path: 'operations' },
];

// Direct management links for ongoing edits once setup is underway.
// `step` reuses the same SessionService.isStepAccessible() gating as the
// corresponding Setup item, so a page only appears here once a user could
// also reach it via the guided flow. Normalizations has no dedicated step,
// so it's gated on EncounterTypeMapping (the last mapping step it depends on).
export const MANAGE_ITEMS: NavItem[] = [
  { label: 'Facility Info', step: 'FacilityInfo', path: 'facility-info' },
  { label: 'Server Info', step: 'ServerInfo', path: 'server-info' },
  { label: 'Authorization', step: 'Authorization', path: 'authorization' },
  { label: 'Connection Test', step: 'ConnectionTest', path: 'connection-test' },
  { label: 'Patients of Interest', step: 'PatientsOfInterest', path: 'patients-of-interest' },
  { label: 'Location.type Mapping', step: 'LocationTypeMapping', path: 'location-type-mapping' },
  { label: 'Encounter.type Mapping', step: 'EncounterTypeMapping', path: 'encounter-type-mapping' },
  { label: 'Normalizations', step: 'EncounterTypeMapping', path: 'normalizations' },
  { label: 'Operations', step: 'Operations', path: 'operations' },
  { label: 'Test Reports', step: 'TestReport', path: 'test-reports' },
];
