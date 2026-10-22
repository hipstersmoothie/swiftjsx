/// <reference types="@nativescript/objc-node-api" />
/// <reference path="./Runtime.d.ts" />

declare const AVSystemRoutingErrorDomain: string;

declare const AVSystemRouteLaunchMode: {
  Application: 0,
  Player: 1,
};

declare const AVSystemRoutingError: {
  AVSystemRoutingErrorConnectionFailed: -73985,
};

declare const AVSystemRouteEventReason: {
  Activate: 0,
  Deactivate: 1,
};

declare interface AVSystemRouteControllerObserver extends NSObjectProtocol {
  systemRouteControllerHandleEventCompletionHandler(controller: AVSystemRouteController, event: AVSystemRouteEvent, completionHandler: (p1: boolean) => void): void;
}

declare class AVSystemRouteControllerObserver extends NativeObject implements AVSystemRouteControllerObserver {
}

declare interface AVSystemRouteDataDelegate extends NSObjectProtocol {
  receiveDataCompletionHandler(data: NSData, completionHandler: (p1: NSError) => void | null): void;
}

declare class AVSystemRouteDataDelegate extends NativeObject implements AVSystemRouteDataDelegate {
}

declare class AVSystemRouteController extends NSObject {
  static readonly sharedController: AVSystemRouteController;

  static readonly supportedExtensionAvailable: boolean;

  addObserver(observer: AVSystemRouteControllerObserver): boolean;

  removeObserver(observer: AVSystemRouteControllerObserver): void;

  static isSupportedExtensionAvailable(): boolean;
}

declare class AVSystemRoute extends NSObject {
  readonly protocolType: UTType;

  readonly routeSymbolName: string;

  readonly routeDisplayName: string;

  addSession(session: AVSystemRouteSession): boolean;

  removeSession(session: AVSystemRouteSession): void;

  readonly routeDataChannel: AVSystemRouteDataChannel;
}

declare class AVSystemRouteDataChannel extends NSObject {
  sendDataCompletionHandler(data: NSData, completionHandler: (p1: NSError) => void | null): void;

  dataDelegate: AVSystemRouteDataDelegate;
}

declare class AVSystemRouteMediaSession extends NSObject {
  readonly playbackControl: NSObject;

  readonly dataChannel: AVSystemRouteDataChannel;
}

declare class AVSystemRouteEvent extends NSObject {
  readonly reason: interop.Enum<typeof AVSystemRouteEventReason>;

  readonly route: AVSystemRoute;
}

declare class AVSystemRouteSession extends NSObject {
  initWithURLMode(url: NSURL, mode: interop.Enum<typeof AVSystemRouteLaunchMode>): this;

  startWithCompletionHandler(completionHandler: (p1: NSError, p2: AVSystemRouteMediaSession) => void | null): void;

  stop(): void;
}

