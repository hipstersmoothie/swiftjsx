/// <reference types="@nativescript/objc-node-api" />
/// <reference path="./Runtime.d.ts" />

declare class LSLinkSecurityManager extends NSObject {
  static readonly sharedManager: LSLinkSecurityManager;

  readonly hasFlaggedURLs: boolean;

  addFlaggedURL(url: NSURL): void;

  addFlaggedURLs(urls: NSArray<interop.Object> | Array<interop.Object>): void;

  checkIsFlaggedURLCompletion(url: NSURL, completion: (p1: boolean) => void): void;
}

