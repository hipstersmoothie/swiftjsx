/// <reference types="@nativescript/objc-node-api" />
/// <reference path="./Runtime.d.ts" />

declare const ENRiskWeightMax: number;

declare const ENRiskWeightDefault: number;

declare const ENRiskScoreMin: number;

declare const ENRiskLevelValueMax: number;

declare const ENDaysSinceOnsetOfSymptomsUnknown: number;

declare const ENErrorDomain: string;

declare const ENRiskWeightDefaultV2: number;

declare const ENRiskLevelMax: number;

declare const ENRiskLevelMin: number;

declare const ENAttenuationMin: number;

declare const ENRiskLevelValueMin: number;

declare const ENAttenuationMax: number;

declare const ENRiskWeightMin: number;

declare const ENRiskScoreMax: number;

declare const ENRiskWeightMaxV2: number;

declare const ENStatus: {
  Unknown: 0,
  Active: 1,
  Disabled: 2,
  BluetoothOff: 3,
  Restricted: 4,
  Paused: 5,
  Unauthorized: 6,
};

declare const ENInfectiousness: {
  None: 0,
  Standard: 1,
  High: 2,
};

declare const ENErrorCode: {
  Unknown: 1,
  BadParameter: 2,
  NotEntitled: 3,
  NotAuthorized: 4,
  Unsupported: 5,
  Invalidated: 6,
  BluetoothOff: 7,
  InsufficientStorage: 8,
  NotEnabled: 9,
  APIMisuse: 10,
  Internal: 11,
  InsufficientMemory: 12,
  RateLimited: 13,
  Restricted: 14,
  BadFormat: 15,
  DataInaccessible: 16,
  TravelStatusNotAvailable: 17,
};

declare const ENCalibrationConfidence: {
  Lowest: 0,
  Low: 1,
  Medium: 2,
  High: 3,
};

declare const ENActivityFlags: {
  Reserved1: 1,
  Reserved2: 2,
  PeriodicRun: 4,
  PreAuthorizedKeyReleaseNotificationTapped: 8,
};

declare const ENAuthorizationStatus: {
  Unknown: 0,
  Restricted: 1,
  NotAuthorized: 2,
  Authorized: 3,
};

declare const ENVariantOfConcernType: {
  TypeUnknown: 0,
  Type1: 1,
  Type2: 2,
  Type3: 3,
  Type4: 4,
};

declare const ENDiagnosisReportType: {
  Unknown: 0,
  ConfirmedTest: 1,
  ConfirmedClinicalDiagnosis: 2,
  SelfReported: 3,
  Recursive: 4,
  Revoked: 5,
};

declare class ENManager extends NSObject {
  activityHandler: (p1: interop.Enum<typeof ENActivityFlags>) => void;

  dispatchQueue: NSObject;

  readonly exposureNotificationStatus: interop.Enum<typeof ENStatus>;

  invalidationHandler: () => void;

  activateWithCompletionHandler(completionHandler: (p1: NSError) => void): void;

  invalidate(): void;

  getUserTraveledWithCompletionHandler(completionHandler: (p1: boolean, p2: NSError) => void): void;

  static readonly authorizationStatus: interop.Enum<typeof ENAuthorizationStatus>;

  readonly exposureNotificationEnabled: boolean;

  setExposureNotificationEnabledCompletionHandler(enabled: boolean, completionHandler: (p1: NSError) => void): void;

  detectExposuresWithConfigurationCompletionHandler(configuration: ENExposureConfiguration, completionHandler: (p1: ENExposureDetectionSummary, p2: NSError) => void): NSProgress;

  detectExposuresWithConfigurationDiagnosisKeyURLsCompletionHandler(configuration: ENExposureConfiguration, diagnosisKeyURLs: NSArray<interop.Object> | Array<interop.Object>, completionHandler: (p1: ENExposureDetectionSummary, p2: NSError) => void): NSProgress;

  getExposureInfoFromSummaryUserExplanationCompletionHandler(summary: ENExposureDetectionSummary, userExplanation: string, completionHandler: (p1: NSArray<interop.Object> | Array<interop.Object>, p2: NSError) => void): NSProgress;

  getExposureWindowsFromSummaryCompletionHandler(summary: ENExposureDetectionSummary, completionHandler: (p1: NSArray<interop.Object> | Array<interop.Object>, p2: NSError) => void): NSProgress;

  getDiagnosisKeysWithCompletionHandler(completionHandler: (p1: NSArray<interop.Object> | Array<interop.Object>, p2: NSError) => void): void;

  getTestDiagnosisKeysWithCompletionHandler(completionHandler: (p1: NSArray<interop.Object> | Array<interop.Object>, p2: NSError) => void): void;

  diagnosisKeysAvailableHandler: (p1: NSArray<interop.Object> | Array<interop.Object>) => void;

  preAuthorizeDiagnosisKeysWithCompletionHandler(completionHandler: (p1: NSError) => void): void;

  requestPreAuthorizedDiagnosisKeysWithCompletionHandler(completionHandler: (p1: NSError) => void): void;
}

declare class ENExposureDetectionSummary extends NSObject {
  readonly attenuationDurations: NSArray;

  readonly daysSinceLastExposure: number;

  readonly matchedKeyCount: number;

  readonly maximumRiskScore: number;

  readonly maximumRiskScoreFullRange: number;

  readonly metadata: NSDictionary;

  readonly riskScoreSumFullRange: number;

  readonly daySummaries: NSArray;
}

declare class ENTemporaryExposureKey extends NSObject {
  keyData: NSData;

  rollingPeriod: number;

  rollingStartNumber: number;

  transmissionRiskLevel: number;
}

declare class ENExposureWindow extends NSObject {
  readonly calibrationConfidence: interop.Enum<typeof ENCalibrationConfidence>;

  readonly date: NSDate;

  readonly diagnosisReportType: interop.Enum<typeof ENDiagnosisReportType>;

  readonly infectiousness: interop.Enum<typeof ENInfectiousness>;

  readonly scanInstances: NSArray;

  readonly variantOfConcernType: interop.Enum<typeof ENVariantOfConcernType>;
}

declare class ENExposureDaySummary extends NSObject {
  readonly date: NSDate;

  readonly confirmedTestSummary: ENExposureSummaryItem;

  readonly confirmedClinicalDiagnosisSummary: ENExposureSummaryItem;

  readonly recursiveSummary: ENExposureSummaryItem;

  readonly selfReportedSummary: ENExposureSummaryItem;

  readonly daySummary: ENExposureSummaryItem;
}

declare class ENScanInstance extends NSObject {
  readonly minimumAttenuation: number;

  readonly typicalAttenuation: number;

  readonly secondsSinceLastScan: number;
}

declare class ENExposureSummaryItem extends NSObject {
  readonly maximumScore: number;

  readonly scoreSum: number;

  readonly weightedDurationSum: number;
}

declare class ENExposureConfiguration extends NSObject {
  immediateDurationWeight: number;

  nearDurationWeight: number;

  mediumDurationWeight: number;

  otherDurationWeight: number;

  get infectiousnessForDaysSinceOnsetOfSymptoms(): NSDictionary;
  set infectiousnessForDaysSinceOnsetOfSymptoms(value: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>);

  infectiousnessStandardWeight: number;

  infectiousnessHighWeight: number;

  reportTypeConfirmedTestWeight: number;

  reportTypeConfirmedClinicalDiagnosisWeight: number;

  reportTypeSelfReportedWeight: number;

  reportTypeRecursiveWeight: number;

  reportTypeNoneMap: interop.Enum<typeof ENDiagnosisReportType>;

  get attenuationDurationThresholds(): NSArray;
  set attenuationDurationThresholds(value: NSArray<interop.Object> | Array<interop.Object>);

  daysSinceLastExposureThreshold: number;

  minimumRiskScoreFullRange: number;

  get attenuationLevelValues(): NSArray;
  set attenuationLevelValues(value: NSArray<interop.Object> | Array<interop.Object>);

  attenuationWeight: number;

  get daysSinceLastExposureLevelValues(): NSArray;
  set daysSinceLastExposureLevelValues(value: NSArray<interop.Object> | Array<interop.Object>);

  daysSinceLastExposureWeight: number;

  get durationLevelValues(): NSArray;
  set durationLevelValues(value: NSArray<interop.Object> | Array<interop.Object>);

  durationWeight: number;

  get metadata(): NSDictionary;
  set metadata(value: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>);

  minimumRiskScore: number;

  get transmissionRiskLevelValues(): NSArray;
  set transmissionRiskLevelValues(value: NSArray<interop.Object> | Array<interop.Object>);

  transmissionRiskWeight: number;
}

declare class ENExposureInfo extends NSObject {
  readonly attenuationDurations: NSArray;

  readonly attenuationValue: number;

  readonly date: NSDate;

  readonly daysSinceOnsetOfSymptoms: number;

  readonly diagnosisReportType: interop.Enum<typeof ENDiagnosisReportType>;

  readonly duration: number;

  readonly metadata: NSDictionary;

  readonly totalRiskScore: number;

  readonly totalRiskScoreFullRange: number;

  readonly transmissionRiskLevel: number;
}

