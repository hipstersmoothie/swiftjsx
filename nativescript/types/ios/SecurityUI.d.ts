/// <reference types="@nativescript/objc-node-api" />
/// <reference path="./Runtime.d.ts" />

declare class SFCertificatePresentation extends NSObject {
  initWithTrust(trust: interop.Object): this;

  presentSheetInViewControllerDismissHandler(viewController: UIViewController, dismissHandler: () => void | null): void;

  dismissSheet(): void;

  readonly trust: interop.Object;

  title: string;

  message: string;

  helpURL: NSURL;
}

