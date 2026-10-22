/// <reference types="@nativescript/objc-node-api" />
/// <reference path="./Runtime.d.ts" />

declare class SRStateReporter extends NSObject {
  readonly domain: string;

  reportTransitionToStateLabelStableMetadataVolatileMetadata(stateLabel: string | null, stableMetadata: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null, volatileMetadata: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): void;

  reportVolatileMetadataUpdate(updatedMetadata: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): void;

  static reporterForDomain<This extends abstract new (...args: any) => any>(this: This, domain: string): InstanceType<This>;
}

