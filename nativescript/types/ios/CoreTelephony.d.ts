/// <reference types="@nativescript/objc-node-api" />
/// <reference path="./Runtime.d.ts" />

declare const CTCallStateDisconnected: string;

declare const CTCallStateConnected: string;

declare const CTCallStateIncoming: string;

declare const CTSubscriberTokenRefreshed: string;

declare const CTRadioAccessTechnologyNRNSA: string;

declare const CTRadioAccessTechnologyLTE: string;

declare const CTRadioAccessTechnologyeHRPD: string;

declare const CTRadioAccessTechnologyCDMAEVDORev0: string;

declare const CTRadioAccessTechnologyCDMA1x: string;

declare const CTRadioAccessTechnologyHSUPA: string;

declare const CTRadioAccessTechnologyHSDPA: string;

declare const CTRadioAccessTechnologyWCDMA: string;

declare const CTRadioAccessTechnologyDidChangeNotification: string;

declare const kCTErrorDomainNoError: number;

declare const CTRadioAccessTechnologyEdge: string;

declare const kCTErrorDomainMach: number;

declare const CTRadioAccessTechnologyNR: string;

declare const CTServiceRadioAccessTechnologyDidChangeNotification: string;

declare const CTRadioAccessTechnologyCDMAEVDORevA: string;

declare const kCTErrorDomainPOSIX: number;

declare const CTRadioAccessTechnologyCDMAEVDORevB: string;

declare const CTRadioAccessTechnologyGPRS: string;

declare const CTCallStateDialing: string;

declare const CTCellularPlanStatusAuthorization: {
  NotAuthorized: 0,
  Authorized: 1,
  Restricted: 2,
  NotSupported: 3,
};

declare const CTCellularPlanStatusAvailabilityConfidence: {
  Low: 0,
  High: 1,
};

declare const CTQuickSwitchState: {
  Failed: 0,
  NotEnrolled: 1,
  Active: 2,
  Passive: 3,
};

declare const CTCellularPlanCapability: {
  Only: 0,
  AndVoice: 1,
};

declare const CTCellularPlanProvisioningAddPlanResult: {
  Unknown: 0,
  Fail: 1,
  Success: 2,
  Cancel: 3,
};

declare const CTCellularDataRestrictedState: {
  RestrictedStateUnknown: 0,
  Restricted: 1,
  NotRestricted: 2,
};

declare const CTCellularPlanStatusAvailability: {
  Unavailable: 0,
  Available: 1,
};

declare class CTError {
  constructor(init?: CTError);
  domain: number;
  error: number;
}

declare interface CTTelephonyNetworkInfoDelegate extends NSObjectProtocol {
  dataServiceIdentifierDidChange?(identifier: string): void;
}

declare class CTTelephonyNetworkInfoDelegate extends NativeObject implements CTTelephonyNetworkInfoDelegate {
}

declare interface CTQuickSwitchManagerDelegate extends NSObjectProtocol {
  quickSwitchManagerDidChangeToState?(quickSwitchManager: CTQuickSwitchManager, state: interop.Enum<typeof CTQuickSwitchState>): void;
}

declare class CTQuickSwitchManagerDelegate extends NativeObject implements CTQuickSwitchManagerDelegate {
}

declare interface CTSubscriberDelegate {
  subscriberTokenRefreshed(subscriber: CTSubscriber): void;
}

declare class CTSubscriberDelegate extends NativeObject implements CTSubscriberDelegate {
}

declare class CTCellularPlanStatus extends NSObject {
  static getTokenWithCompletion(completionHandler: (p1: string, p2: NSError) => void | null): void;

  static checkValidityOfTokenCompletionHandler(token: string, completionHandler: (p1: boolean, p2: NSError) => void | null): void;

  static requestAuthorizationForPhoneNumberCompletion(phoneNumber: string, completionHandler: (p1: interop.Enum<typeof CTCellularPlanStatusAuthorization>, p2: NSError) => void | null): void;

  static getAuthorizationStatusForPhoneNumberCompletion(phoneNumber: string, completionHandler: (p1: interop.Enum<typeof CTCellularPlanStatusAuthorization>, p2: NSError) => void | null): void;

  static getStatusHintForPhoneNumberCompletion(phoneNumber: string, completionHandler: (p1: interop.Enum<typeof CTCellularPlanStatusAvailability>, p2: interop.Enum<typeof CTCellularPlanStatusAvailabilityConfidence>, p3: NSError) => void | null): void;
}

declare class CTCarrier extends NSObject {
  readonly carrierName: string;

  readonly mobileCountryCode: string;

  readonly mobileNetworkCode: string;

  readonly isoCountryCode: string;

  readonly allowsVOIP: boolean;
}

declare class CTCall extends NSObject {
  readonly callState: string;

  readonly callID: string;
}

declare class CTSubscriberInfo extends NSObject {
  static subscribers(): NSArray;

  static subscriber(): CTSubscriber;
}

declare class CTSubscriber extends NSObject {
  readonly carrierToken: NSData;

  refreshCarrierToken(): boolean;

  readonly identifier: string;

  readonly SIMInserted: boolean;

  delegate: CTSubscriberDelegate;

  isSIMInserted(): boolean;
}

declare class CTCellularPlanLifecycleProperties extends NSObject implements NSSecureCoding {
  expirationDate: NSDateComponents;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class CTCellularPlanProvisioningRequest extends NSObject implements NSSecureCoding {
  address: string;

  matchingID: string;

  OID: string;

  confirmationCode: string;

  ICCID: string;

  EID: string;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class CTCellularData extends NSObject {
  cellularDataRestrictionDidUpdateNotifier: (p1: interop.Enum<typeof CTCellularDataRestrictedState>) => void;

  readonly restrictedState: interop.Enum<typeof CTCellularDataRestrictedState>;
}

declare class CTTelephonyNetworkInfo extends NSObject {
  readonly dataServiceIdentifier: string;

  delegate: CTTelephonyNetworkInfoDelegate;

  readonly serviceSubscriberCellularProviders: NSDictionary;

  readonly subscriberCellularProvider: CTCarrier;

  serviceSubscriberCellularProvidersDidUpdateNotifier: (p1: string) => void;

  subscriberCellularProviderDidUpdateNotifier: (p1: CTCarrier) => void;

  readonly serviceCurrentRadioAccessTechnology: NSDictionary;

  readonly currentRadioAccessTechnology: string;
}

declare class CTCellularPlanProvisioning extends NSObject {
  readonly supportsEmbeddedSIM: boolean;

  supportsCellularPlan(): boolean;

  addPlanWithCompletionHandler(request: CTCellularPlanProvisioningRequest, completionHandler: (p1: interop.Enum<typeof CTCellularPlanProvisioningAddPlanResult>) => void): void;

  addPlanWithRequestPropertiesCompletionHandler(request: CTCellularPlanProvisioningRequest, properties: CTCellularPlanProperties | null, completionHandler: (p1: interop.Enum<typeof CTCellularPlanProvisioningAddPlanResult>) => void): void;

  updateCellularPlanPropertiesCompletionHandler(properties: CTCellularPlanProperties, completionHandler: (p1: NSError) => void | null): void;
}

declare class CTCellularPlanProperties extends NSObject implements NSSecureCoding {
  associatedIccid: string;

  simCapability: interop.Enum<typeof CTCellularPlanCapability>;

  get supportedRegionCodes(): NSArray;
  set supportedRegionCodes(value: NSArray<interop.Object> | Array<interop.Object>);

  lifecycleProperties: CTCellularPlanLifecycleProperties;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class CTQuickSwitchManager extends NSObject {
  delegate: CTQuickSwitchManagerDelegate;

  getPhoneNumberStateForSuffixCompletion(phoneNumberSuffix: string, completionHandler: (p1: interop.Enum<typeof CTQuickSwitchState>, p2: NSError) => void | null): void;

  getDeviceState(completionHandler: (p1: interop.Enum<typeof CTQuickSwitchState>, p2: NSError) => void | null): void;

  static registerForLaunchOnQuickSwitchStateEvents(completionHandler: (p1: NSError) => void | null): void;

  static unregisterForLaunchOnQuickSwitchStateEvents(completionHandler: (p1: NSError) => void | null): void;
}

declare class CTCallCenter extends NSObject {
  readonly currentCalls: NSSet;

  callEventHandler: (p1: CTCall) => void;
}

