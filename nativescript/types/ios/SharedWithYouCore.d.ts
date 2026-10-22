/// <reference types="@nativescript/objc-node-api" />
/// <reference path="./Runtime.d.ts" />

declare const UTCollaborationOptionsTypeIdentifier: string;

declare const SharedWithYouCoreVersionNumber: number;

declare const SharedWithYouCoreVersionString: interop.Pointer;

declare interface SWCollaborationActionHandler extends NSObjectProtocol {
  collaborationCoordinatorHandleStartCollaborationAction(coordinator: SWCollaborationCoordinator, action: SWStartCollaborationAction): void;

  collaborationCoordinatorHandleUpdateCollaborationParticipantsAction(coordinator: SWCollaborationCoordinator, action: SWUpdateCollaborationParticipantsAction): void;
}

declare class SWCollaborationActionHandler extends NativeObject implements SWCollaborationActionHandler {
}

declare class SWSignedPersonIdentityProof extends SWPersonIdentityProof {
  initWithPersonIdentityProofSignatureData(personIdentityProof: SWPersonIdentityProof, data: NSData): this;

  readonly signatureData: NSData;
}

declare class SWPersonIdentity extends NSObject implements NSSecureCoding, NSCopying {
  readonly rootHash: NSData;

  initWithRootHash(rootHash: NSData): this;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

declare class SWPerson extends NSObject implements NSSecureCoding {
  initWithHandleIdentityDisplayNameThumbnailImageData(handle: string | null, identity: SWPersonIdentity | null, displayName: string, thumbnailImageData: NSData | null): this;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class SWCollaborationShareOptions extends NSObject implements NSCopying, NSSecureCoding {
  get optionsGroups(): NSArray;
  set optionsGroups(value: NSArray<interop.Object> | Array<interop.Object>);

  summary: string;

  initWithOptionsGroupsSummary(optionsGroups: NSArray<interop.Object> | Array<interop.Object>, summary: string): this;

  initWithOptionsGroups(optionsGroups: NSArray<interop.Object> | Array<interop.Object>): this;

  static shareOptionsWithOptionsGroupsSummary(optionsGroups: NSArray<interop.Object> | Array<interop.Object>, summary: string): SWCollaborationShareOptions;

  static shareOptionsWithOptionsGroups(optionsGroups: NSArray<interop.Object> | Array<interop.Object>): SWCollaborationShareOptions;

  initWithCoder(coder: NSCoder): this;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;
}

declare class SWCollaborationOptionsPickerGroup extends SWCollaborationOptionsGroup {
  selectedOptionIdentifier: string;
}

declare class SWCollaborationOptionsGroup extends NSObject implements NSCopying, NSSecureCoding {
  title: string;

  readonly identifier: string;

  footer: string;

  get options(): NSArray;
  set options(value: NSArray<interop.Object> | Array<interop.Object>);

  initWithIdentifierOptions(identifier: string, options: NSArray<interop.Object> | Array<interop.Object>): this;

  static optionsGroupWithIdentifierOptions(identifier: string, options: NSArray<interop.Object> | Array<interop.Object>): SWCollaborationOptionsGroup;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class SWCollaborationOption extends NSObject implements NSCopying, NSSecureCoding {
  title: string;

  readonly identifier: string;

  subtitle: string;

  selected: boolean;

  get requiredOptionsIdentifiers(): NSArray;
  set requiredOptionsIdentifiers(value: NSArray<interop.Object> | Array<interop.Object>);

  initWithTitleIdentifier(title: string, identifier: string): this;

  static optionWithTitleIdentifier(title: string, identifier: string): SWCollaborationOption;

  isSelected(): boolean;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class SWAction extends NSObject implements NSCopying, NSSecureCoding {
  readonly uuid: NSUUID;

  readonly complete: boolean;

  fulfill(): void;

  fail(): void;

  isComplete(): boolean;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class SWCollaborationMetadata extends NSObject implements NSSecureCoding, NSCopying, NSMutableCopying, NSItemProviderReading, NSItemProviderWriting {
  readonly collaborationIdentifier: string;

  readonly localIdentifier: string;

  title: string;

  defaultShareOptions: SWCollaborationShareOptions;

  userSelectedShareOptions: SWCollaborationShareOptions;

  initiatorHandle: string;

  initiatorNameComponents: NSPersonNameComponents;

  initWithLocalIdentifier(localIdentifier: string): this;

  initWithCollaborationIdentifier(collaborationIdentifier: string): this;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  mutableCopyWithZone(zone: interop.PointerConvertible): interop.Object;

  static readonly readableTypeIdentifiersForItemProvider: NSArray;

  static objectWithItemProviderDataTypeIdentifierError<This extends abstract new (...args: any) => any>(this: This, data: NSData, typeIdentifier: string, outError: interop.PointerConvertible): InstanceType<This>;

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

  static readonly writableTypeIdentifiersForItemProvider: NSArray;

  readonly writableTypeIdentifiersForItemProvider: NSArray;

  static itemProviderVisibilityForRepresentationWithTypeIdentifier(typeIdentifier: string): interop.Enum<typeof NSItemProviderRepresentationVisibility>;

  itemProviderVisibilityForRepresentationWithTypeIdentifier(typeIdentifier: string): interop.Enum<typeof NSItemProviderRepresentationVisibility>;

  loadDataWithTypeIdentifierForItemProviderCompletionHandler(typeIdentifier: string, completionHandler: (p1: NSData, p2: NSError) => void | null): NSProgress;
}

declare class SWPersonIdentityProof extends NSObject implements NSSecureCoding, NSCopying {
  readonly inclusionHashes: NSArray;

  readonly publicKey: NSData;

  readonly publicKeyIndex: number;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

declare class SWStartCollaborationAction extends SWAction implements NSSecureCoding, NSCopying {
  readonly collaborationMetadata: SWCollaborationMetadata;

  fulfillUsingURLCollaborationIdentifier(url: NSURL, collaborationIdentifier: string): void;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

declare class SWCollaborationCoordinator extends NSObject {
  static readonly sharedCoordinator: SWCollaborationCoordinator;

  actionHandler: SWCollaborationActionHandler | null;
}

declare class SWUpdateCollaborationParticipantsAction extends SWAction implements NSSecureCoding, NSCopying {
  readonly collaborationMetadata: SWCollaborationMetadata;

  readonly addedIdentities: NSArray;

  readonly removedIdentities: NSArray;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

