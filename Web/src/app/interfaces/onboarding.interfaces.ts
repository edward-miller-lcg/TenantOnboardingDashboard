export interface SessionResponse {
  id: string;
  token: string;
  nhsnOrgId: string;
  healthSystemName: string;
  facilityId?: string;
  ehrVendor?: string;
  status: string;
  createdAt: string;
  completedAt?: string;
  stepProgress: Record<string, boolean>;
  formData: Record<string, string>;
}

export interface CreateSessionRequest {
  nhsnOrgId: string;
  healthSystemName: string;
}

export interface CreateSessionResponse {
  token: string;
  onboardingUrl: string;
  sessionId: string;
  nhsnOrgId: string;
  healthSystemName: string;
  createdAt: string;
}

export interface ConnectionTestResponse {
  success: boolean;
  errorDetails?: string;
}

export const STEP_ORDER = [
  'ComplianceAttestation',
  'FacilityInfo',
  'ServerInfo',
  'Authorization',
  'ConnectionTest',
  'PatientsOfInterest',
  'LocationTypeMapping',
  'EncounterTypeMapping',
  'PoiCompiling',
  'VerifyPoi',
  'TestReport',
  'Operations'
] as const;

export type StepName = typeof STEP_ORDER[number];

export interface TestReport {
  id: string;
  reportingPeriod: string;
  startDate: string;
  endDate: string;
  result: 'SUCCESS' | 'FAILED' | 'IN_PROGRESS';
  unacceptableIssues?: number;
  acceptableIssues?: number;
  totalPatients?: number;
}

export interface PrequalificationReport {
  reportingPeriod: string;
  status: string;
  unacceptableIssues: number;
  totalPatients: number;
  issuesSummary: IssueCategory[];
  unacceptableCategories: IssueCategory[];
  acceptableCategories: IssueCategory[];
}

export interface IssueCategory {
  id: string;
  category: string;
  numberOfIssues: number;
  guidance: string;
  acceptable: boolean;
}

export interface CategoryDetail {
  category: string;
  guidance: string;
  acceptable: boolean;
  issues: any[];
}

export interface CategoryIssue {
  message: string;
  expression: string;
  location: string;
}

// Returned from GET /normalizations — projected from OperationModel
export interface NormalizationItem {
  id: string;
  name: string;
  description: string;
  operationType: 'CodeMap' | 'CopyProperty' | 'ConditionalTransform' | 'CopyLocation' | 'RemoveExtensions';
  resourceTypes: string[];
  isDisabled: boolean;
  canDelete: boolean;
}

export interface CodeSystemMap {
  sourceSystem: string;
  targetSystem: string;
  codes: CodeEntry[];
}

export interface CodeEntry {
  sourceCode: string;
  targetCode: string;
  display: string;
}

export interface EncounterTypeMappingData {
  resourceType: string;
  fhirPath: string;
  codeSystemMaps: CodeSystemMap[];
}

export interface LocationTypeMappingData {
  sourceSystem: string;
  codes: CodeEntry[];
}

export type EhrTemplateCategory = 'Normalization' | 'QueryPlan';

export interface EhrVendorTemplate {
  id: string;
  vendor: string;
  category: EhrTemplateCategory;
  resourceType: string;
  name: string;
  description?: string | null;
  definitionJson: string;
  sequence: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

export interface EhrVendorTemplateRequest {
  vendor: string;
  category: EhrTemplateCategory;
  resourceType: string;
  name: string;
  description?: string | null;
  definitionJson: string;
  sequence: number;
  isActive: boolean;
}
