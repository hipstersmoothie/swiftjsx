/// <reference types="@nativescript/objc-node-api" />
/// <reference path="./Runtime.d.ts" />

declare const MediaSetupVersionString: interop.Pointer;

declare const MediaSetupVersionNumber: number;

declare interface MSAuthenticationPresentationContext extends NSObjectProtocol {
  presentationAnchor(): UIWindow | null;
}

declare class MSAuthenticationPresentationContext extends NativeObject implements MSAuthenticationPresentationContext {
}

declare class MSSetupSession extends NSObject {
  initWithServiceAccount(serviceAccount: MSServiceAccount): this;

  startWithError(error: interop.PointerConvertible): boolean;

  presentationContext: MSAuthenticationPresentationContext | null;

  readonly account: MSServiceAccount;
}

declare class MSServiceAccount extends NSObject {
  initWithServiceNameAccountName(serviceName: string, accountName: string): this;

  readonly serviceName: string;

  readonly accountName: string;

  clientID: string;

  clientSecret: string;

  configurationURL: NSURL;

  authorizationTokenURL: NSURL;

  authorizationScope: string;
}

