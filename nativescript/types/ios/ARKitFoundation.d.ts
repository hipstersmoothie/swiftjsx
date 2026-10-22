/// <reference types="@nativescript/objc-node-api" />
/// <reference path="./Runtime.d.ts" />

declare const ARConfidenceLevel: {
  Low: 0,
  Medium: 1,
  High: 2,
};

declare class ARDepthData extends NSObject {
  readonly depthMap: interop.Object;

  readonly confidenceMap: interop.Object;
}

