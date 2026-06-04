import { Routes } from '@angular/router';
import { tokenGuard } from './guards/token.guard';

export const routes: Routes = [
  {
    path: 'admin',
    loadComponent: () => import('./admin/admin.component').then(m => m.AdminComponent)
  },
  {
    path: 'onboarding/:token',
    loadComponent: () => import('./onboarding/onboarding-shell/onboarding-shell.component').then(m => m.OnboardingShellComponent),
    canActivate: [tokenGuard],
    children: [
      { path: '', loadComponent: () => import('./onboarding/compliance-attestation/compliance-attestation.component').then(m => m.ComplianceAttestationComponent) },
      { path: 'overview', loadComponent: () => import('./onboarding/overview/overview.component').then(m => m.OverviewComponent) },
      { path: 'facility-info', loadComponent: () => import('./onboarding/facility-info/facility-info.component').then(m => m.FacilityInfoComponent) },
      { path: 'server-info', loadComponent: () => import('./onboarding/server-info/server-info.component').then(m => m.ServerInfoComponent) },
      { path: 'authorization', loadComponent: () => import('./onboarding/authorization/authorization.component').then(m => m.AuthorizationComponent) },
      { path: 'connection-test', loadComponent: () => import('./onboarding/connection-test/connection-test.component').then(m => m.ConnectionTestComponent) },
      { path: 'patients-of-interest', loadComponent: () => import('./onboarding/patients-of-interest/patients-of-interest.component').then(m => m.PatientsOfInterestComponent) },
      { path: 'location-type-mapping', loadComponent: () => import('./onboarding/location-type-mapping/location-type-mapping.component').then(m => m.LocationTypeMappingComponent) },
      { path: 'encounter-type-mapping', loadComponent: () => import('./onboarding/encounter-type-mapping/encounter-type-mapping.component').then(m => m.EncounterTypeMappingComponent) },
      { path: 'poi-compiling', loadComponent: () => import('./onboarding/poi-compiling/poi-compiling.component').then(m => m.PoiCompilingComponent) },
      { path: 'verify-poi', loadComponent: () => import('./onboarding/verify-poi/verify-poi.component').then(m => m.VerifyPoiComponent) },
      { path: 'test-reports', loadComponent: () => import('./onboarding/test-reports/test-reports.component').then(m => m.TestReportsComponent) },
      { path: 'run-test-report', loadComponent: () => import('./onboarding/run-test-report/run-test-report.component').then(m => m.RunTestReportComponent) },
      { path: 'prequalification/:reportId', loadComponent: () => import('./onboarding/prequalification-report/prequalification-report.component').then(m => m.PrequalificationReportComponent) },
      { path: 'prequalification/:reportId/category/:categoryId', loadComponent: () => import('./onboarding/category-details/category-details.component').then(m => m.CategoryDetailsComponent) },
      { path: 'normalizations', loadComponent: () => import('./onboarding/normalizations/normalizations.component').then(m => m.NormalizationsComponent) },
      { path: 'normalizations/code-map', loadComponent: () => import('./onboarding/code-map/code-map.component').then(m => m.CodeMapComponent) },
      { path: 'normalizations/code-map/:id', loadComponent: () => import('./onboarding/code-map/code-map.component').then(m => m.CodeMapComponent) },
      { path: 'normalizations/copy-property', loadComponent: () => import('./onboarding/copy-property/copy-property.component').then(m => m.CopyPropertyComponent) },
      { path: 'normalizations/copy-property/:id', loadComponent: () => import('./onboarding/copy-property/copy-property.component').then(m => m.CopyPropertyComponent) },
      { path: 'normalizations/conditional', loadComponent: () => import('./onboarding/conditional-transformation/conditional-transformation.component').then(m => m.ConditionalTransformationComponent) },
      { path: 'normalizations/conditional/:id', loadComponent: () => import('./onboarding/conditional-transformation/conditional-transformation.component').then(m => m.ConditionalTransformationComponent) },
      { path: 'operations', loadComponent: () => import('./onboarding/operations/operations.component').then(m => m.OperationsComponent) },
    ]
  },
  { path: '', redirectTo: 'admin', pathMatch: 'full' },
  { path: '**', redirectTo: 'admin' }
];
