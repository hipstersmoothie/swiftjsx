/// <reference types="@nativescript/objc-node-api" />
/// <reference path="./Runtime.d.ts" />

declare const PKPushTypeFileProvider: string;

declare const PKPushTypeVoIP: string;

declare const PKPushTypeComplication: string;

declare interface PKPushRegistryDelegate extends NSObjectProtocol {
  pushRegistryDidUpdatePushCredentialsForType(registry: PKPushRegistry, pushCredentials: PKPushCredentials, type: string): void;

  pushRegistryDidReceiveIncomingPushWithPayloadForType?(registry: PKPushRegistry, payload: PKPushPayload, type: string): void;

  pushRegistryDidReceiveIncomingPushWithPayloadForTypeWithCompletionHandler?(registry: PKPushRegistry, payload: PKPushPayload, type: string, completion: () => void): void;

  pushRegistryDidReceiveIncomingVoIPPushWithPayloadMetadataWithCompletionHandler?(registry: PKPushRegistry, payload: PKPushPayload, metadata: PKVoIPPushMetadata, completion: () => void): void;

  pushRegistryDidInvalidatePushTokenForType?(registry: PKPushRegistry, type: string): void;
}

declare class PKPushRegistryDelegate extends NativeObject implements PKPushRegistryDelegate {
}

declare class PKPushRegistry extends NSObject {
  delegate: PKPushRegistryDelegate;

  desiredPushTypes: NSSet;

  pushTokenForType(type: string): NSData;

  initWithQueue(queue: NSObject | null): this;
}

declare class PKPushPayload extends NSObject {
  readonly type: string;

  readonly dictionaryPayload: NSDictionary;
}

declare class PKPushCredentials extends NSObject {
  readonly type: string;

  readonly token: NSData;
}

declare class PKVoIPPushMetadata extends NSObject {
  readonly mustReport: boolean;
}

