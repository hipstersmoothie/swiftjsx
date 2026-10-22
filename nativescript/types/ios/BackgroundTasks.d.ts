/// <reference types="@nativescript/objc-node-api" />
/// <reference path="./Runtime.d.ts" />

declare const BGTaskSchedulerErrorDomain: string;

declare const BGContinuedProcessingTaskRequestResources: {
  Default: 0,
  GPU: 1,
};

declare const BGTaskSchedulerErrorCode: {
  Unavailable: 1,
  TooManyPendingTaskRequests: 2,
  NotPermitted: 3,
  ImmediateRunIneligible: 4,
};

declare const BGContinuedProcessingTaskRequestSubmissionStrategy: {
  Fail: 0,
  Queue: 1,
};

declare class BGTask extends NSObject {
  readonly identifier: string;

  expirationHandler: () => void;

  setTaskCompletedWithSuccess(success: boolean): void;
}

declare class BGHealthResearchTask extends BGProcessingTask {
}

declare class BGTaskScheduler extends NSObject {
  static readonly sharedScheduler: BGTaskScheduler;

  static readonly supportedResources: interop.Enum<typeof BGContinuedProcessingTaskRequestResources>;

  registerForTaskWithIdentifierUsingQueueLaunchHandler(identifier: string, queue: NSObject | null, launchHandler: (p1: BGTask) => void): boolean;

  submitTaskRequestError(taskRequest: BGTaskRequest, error: interop.PointerConvertible): boolean;

  submitTaskRequestCompletionHandler(taskRequest: BGTaskRequest, completionHandler: (p1: NSError) => void | null): void;

  cancelTaskRequestWithIdentifier(identifier: string): void;

  cancelAllTaskRequests(): void;

  getPendingTaskRequestsWithCompletionHandler(completionHandler: (p1: NSArray<interop.Object> | Array<interop.Object>) => void): void;
}

declare class BGContinuedProcessingTaskRequest extends BGTaskRequest {
  title: string;

  subtitle: string;

  strategy: interop.Enum<typeof BGContinuedProcessingTaskRequestSubmissionStrategy>;

  requiredResources: interop.Enum<typeof BGContinuedProcessingTaskRequestResources>;

  initWithIdentifierTitleSubtitle(identifier: string, title: string, subtitle: string): this;
}

declare class BGProcessingTaskRequest extends BGTaskRequest {
  initWithIdentifier(identifier: string): this;

  requiresNetworkConnectivity: boolean;

  requiresExternalPower: boolean;
}

declare class BGHealthResearchTaskRequest extends BGProcessingTaskRequest {
  protectionTypeOfRequiredData: string;
}

declare class BGTaskRequest extends NSObject implements NSCopying {
  readonly identifier: string;

  earliestBeginDate: NSDate;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

declare class BGAppRefreshTaskRequest extends BGTaskRequest {
  initWithIdentifier(identifier: string): this;
}

declare class BGProcessingTask extends BGTask {
}

declare class BGContinuedProcessingTask extends BGTask implements NSProgressReporting {
  readonly title: string;

  readonly subtitle: string;

  updateTitleSubtitle(title: string, subtitle: string): void;

  readonly progress: NSProgress;

  isEqual(object: interop.Object): boolean;

  readonly hash: number;

  readonly superclass: interop.Pointer;

  class(): interop.Pointer;

  self(): this;

  performSelector(aSelector: string): interop.Object;

  performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object;

  performSelectorWithObjectWithObject(aSelector: string, object1: interop.Object, object2: interop.Object): interop.Object;

  readonly isProxy: boolean;

  isKindOfClass(aClass: interop.PointerConvertible): boolean;

  isMemberOfClass(aClass: interop.PointerConvertible): boolean;

  conformsToProtocol(aProtocol: interop.PointerConvertible): boolean;

  respondsToSelector(aSelector: string): boolean;

  retain(): this;

  release(): void;

  autorelease(): this;

  retainCount(): number;

  readonly zone: interop.Pointer;

  readonly description: string;

  readonly debugDescription: string;
}

declare class BGAppRefreshTask extends BGTask {
}

