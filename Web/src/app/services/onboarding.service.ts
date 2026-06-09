import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  SessionResponse,
  CreateSessionRequest,
  CreateSessionResponse,
  ConnectionTestResponse,
  TestReport,
  PrequalificationReport,
  NormalizationItem,
  EncounterTypeMappingData,
  LocationTypeMappingData
} from '../interfaces/onboarding.interfaces';
import { AppConfigService } from './app-config.service';

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private get base(): string {
    return this.config.config?.apiUrl ?? '/api';
  }

  constructor(private http: HttpClient, private config: AppConfigService) {}

  // ---- Admin ----------------------------------------------------------------

  createSession(request: CreateSessionRequest): Observable<CreateSessionResponse> {
    return this.http.post<CreateSessionResponse>(`${this.base}/admin/sessions`, request);
  }

  getSessions(): Observable<SessionResponse[]> {
    return this.http.get<SessionResponse[]>(`${this.base}/admin/sessions`);
  }

  // ---- Session --------------------------------------------------------------

  getSession(token: string): Observable<SessionResponse> {
    return this.http.get<SessionResponse>(`${this.base}/onboarding/${token}`);
  }

  completeAttestation(token: string): Observable<void> {
    return this.http.post<void>(`${this.base}/onboarding/${token}/compliance-attestation`, {});
  }

  saveFacilityInfo(token: string, data: {
    organizationNames: string;
    timeZone: string;
    physicalAddress: string;
    technicalContactPhone?: string;
  }): Observable<{ facilityId: string }> {
    return this.http.post<{ facilityId: string }>(`${this.base}/onboarding/${token}/facility-info`, data);
  }

  saveServerInfo(token: string, data: { fhirBaseUrl: string; ehrVendor: string }): Observable<void> {
    return this.http.post<void>(`${this.base}/onboarding/${token}/server-info`, data);
  }

  completeAuthorization(token: string): Observable<void> {
    return this.http.post<void>(`${this.base}/onboarding/${token}/authorization`, {});
  }

  testConnection(token: string, patientFhirId: string): Observable<ConnectionTestResponse> {
    return this.http.post<ConnectionTestResponse>(`${this.base}/onboarding/${token}/connection-test`, { patientFhirId });
  }

  savePatientsOfInterestEpic(token: string, patientListIds: string): Observable<void> {
    return this.http.post<void>(`${this.base}/onboarding/${token}/patients-of-interest`, { patientListIds });
  }

  savePatientsOfInterestCerner(token: string, data: { sftpUrl: string; sftpUsername: string; sftpPassword: string }): Observable<void> {
    return this.http.post<void>(`${this.base}/onboarding/${token}/patients-of-interest`, data);
  }

  // ---- Location Type Mapping (Option A — guided HSLOC code map) ------------

  getLocationTypeMapping(token: string): Observable<LocationTypeMappingData> {
    return this.http.get<LocationTypeMappingData>(`${this.base}/onboarding/${token}/location-type-mapping`);
  }

  saveLocationTypeMapping(token: string, data: LocationTypeMappingData): Observable<void> {
    return this.http.post<void>(`${this.base}/onboarding/${token}/location-type-mapping`, data);
  }

  // ---- Encounter Type Mapping -----------------------------------------------

  getEncounterTypeMapping(token: string): Observable<EncounterTypeMappingData> {
    return this.http.get<EncounterTypeMappingData>(`${this.base}/onboarding/${token}/encounter-type-mapping`);
  }

  saveEncounterTypeMapping(token: string, data: EncounterTypeMappingData): Observable<void> {
    return this.http.post<void>(`${this.base}/onboarding/${token}/encounter-type-mapping`, data);
  }

  // ---- POI / report steps ---------------------------------------------------

  startPoiCompiling(token: string): Observable<void> {
    return this.http.post<void>(`${this.base}/onboarding/${token}/poi-compiling`, {});
  }

  verifyPoi(token: string): Observable<void> {
    return this.http.post<void>(`${this.base}/onboarding/${token}/verify-poi`, {});
  }

  getReports(token: string): Observable<TestReport[]> {
    return this.http.get<TestReport[]>(`${this.base}/onboarding/${token}/reports`);
  }

  generateReport(token: string, startDate: Date, endDate: Date): Observable<any> {
    return this.http.post<any>(`${this.base}/onboarding/${token}/reports`, { startDate, endDate });
  }

  getReport(token: string, reportId: string): Observable<PrequalificationReport> {
    return this.http.get<PrequalificationReport>(`${this.base}/onboarding/${token}/reports/${reportId}`);
  }

  // ---- Normalizations -------------------------------------------------------

  getNormalizations(token: string): Observable<NormalizationItem[]> {
    return this.http.get<NormalizationItem[]>(`${this.base}/onboarding/${token}/normalizations`);
  }

  getResourceTypes(token: string): Observable<{ name: string }[]> {
    return this.http.get<{ name: string }[]>(`${this.base}/onboarding/${token}/normalizations/resource-types`);
  }

  createCodeMap(token: string, data: object): Observable<any> {
    return this.http.post<any>(`${this.base}/onboarding/${token}/normalizations/code-map`, data);
  }

  updateCodeMap(token: string, id: string, data: object): Observable<any> {
    return this.http.put<any>(`${this.base}/onboarding/${token}/normalizations/code-map/${id}`, data);
  }

  createCopyProperty(token: string, data: object): Observable<any> {
    return this.http.post<any>(`${this.base}/onboarding/${token}/normalizations/copy-property`, data);
  }

  updateCopyProperty(token: string, id: string, data: object): Observable<any> {
    return this.http.put<any>(`${this.base}/onboarding/${token}/normalizations/copy-property/${id}`, data);
  }

  createConditional(token: string, data: object): Observable<any> {
    return this.http.post<any>(`${this.base}/onboarding/${token}/normalizations/conditional`, data);
  }

  updateConditional(token: string, id: string, data: object): Observable<any> {
    return this.http.put<any>(`${this.base}/onboarding/${token}/normalizations/conditional/${id}`, data);
  }

  deleteNormalization(token: string, id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/onboarding/${token}/normalizations/${id}`);
  }

  completeOnboarding(token: string): Observable<void> {
    return this.http.post<void>(`${this.base}/onboarding/${token}/complete`, {});
  }
}
