/// <reference types="@nativescript/objc-node-api" />
/// <reference path="./Runtime.d.ts" />
/// <reference path="./UIKit.d.ts" />

declare const QLPreviewItemEditingMode: {
  Disabled: 0,
  UpdateContents: 1,
  CreateCopy: 2,
};

declare interface QLPreviewItem extends NSObjectProtocol {
  readonly previewItemURL: NSURL;

  readonly previewItemTitle?: string;
}

declare class QLPreviewItem extends NativeObject implements QLPreviewItem {
}

declare interface QLPreviewControllerDataSource {
  numberOfPreviewItemsInPreviewController(controller: QLPreviewController): number;

  previewControllerPreviewItemAtIndex(controller: QLPreviewController, index: number): QLPreviewItem;
}

declare class QLPreviewControllerDataSource extends NativeObject implements QLPreviewControllerDataSource {
}

declare interface QLPreviewControllerDelegate extends NSObjectProtocol {
  previewControllerWillDismiss?(controller: QLPreviewController): void;

  previewControllerDidDismiss?(controller: QLPreviewController): void;

  previewControllerShouldOpenURLForPreviewItem?(controller: QLPreviewController, url: NSURL, item: QLPreviewItem): boolean;

  previewControllerFrameForPreviewItemInSourceView?(controller: QLPreviewController, item: QLPreviewItem, view: interop.PointerConvertible): CGRect;

  previewControllerTransitionImageForPreviewItemContentRect?(controller: QLPreviewController, item: QLPreviewItem, contentRect: interop.PointerConvertible): UIImage | null;

  previewControllerTransitionViewForPreviewItem?(controller: QLPreviewController, item: QLPreviewItem): UIView | null;

  previewControllerEditingModeForPreviewItem?(controller: QLPreviewController, previewItem: QLPreviewItem): interop.Enum<typeof QLPreviewItemEditingMode>;

  previewControllerDidUpdateContentsOfPreviewItem?(controller: QLPreviewController, previewItem: QLPreviewItem): void;

  previewControllerDidSaveEditedCopyOfPreviewItemAtURL?(controller: QLPreviewController, previewItem: QLPreviewItem, modifiedContentsURL: NSURL): void;
}

declare class QLPreviewControllerDelegate extends NativeObject implements QLPreviewControllerDelegate {
}

declare interface QLPreviewingController extends NSObjectProtocol {
  preparePreviewOfSearchableItemWithIdentifierQueryStringCompletionHandler?(identifier: string, queryString: string | null, handler: (p1: NSError) => void | null): void;

  preparePreviewOfFileAtURLCompletionHandler?(url: NSURL, handler: (p1: NSError) => void | null): void;

  providePreviewForFileRequestCompletionHandler?(request: QLFilePreviewRequest, handler: (p1: QLPreviewReply, p2: NSError) => void | null): void;
}

declare class QLPreviewingController extends NativeObject implements QLPreviewingController {
}

declare class QLFilePreviewRequest extends NSObject {
  readonly fileURL: NSURL;
}

declare class QLPreviewController extends UIViewController {
  static canPreviewItem(item: QLPreviewItem): boolean;

  dataSource: QLPreviewControllerDataSource;

  reloadData(): void;

  refreshCurrentPreviewItem(): void;

  currentPreviewItemIndex: number;

  readonly currentPreviewItem: QLPreviewItem;

  delegate: QLPreviewControllerDelegate;
}

declare class ARQuickLookPreviewItem extends NSObject implements QLPreviewItem {
  initWithFileAtURL(url: NSURL): this;

  canonicalWebPageURL: NSURL;

  allowsContentScaling: boolean;

  readonly previewItemURL: NSURL;

  readonly previewItemTitle: string;

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

declare class QLPreviewReply extends NSObject {
  stringEncoding: number;

  get attachments(): NSDictionary;
  set attachments(value: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>);

  title: string;

  initWithContextSizeIsBitmapDrawingBlock(contextSize: CGSize, isBitmap: boolean, drawingBlock: (p1: interop.PointerConvertible, p2: QLPreviewReply, p3: interop.PointerConvertible) => boolean | null): this;

  initWithFileURL(fileURL: NSURL): this;

  initWithDataOfContentTypeContentSizeDataCreationBlock(contentType: UTType, contentSize: CGSize, dataCreationBlock: (p1: QLPreviewReply, p2: interop.PointerConvertible) => NSData | null): this;

  initForPDFWithPageSizeDocumentCreationBlock(defaultPageSize: CGSize, documentCreationBlock: (p1: QLPreviewReply, p2: interop.PointerConvertible) => PDFDocument | null): this;
}

declare class QLPreviewReplyAttachment extends NSObject {
  readonly data: NSData;

  readonly contentType: UTType;

  initWithDataContentType(data: NSData, contentType: UTType): this;
}

declare class QLPreviewSceneActivationConfiguration extends UIWindowSceneActivationConfiguration {
  initWithItemsAtURLsOptions(urls: NSArray<interop.Object> | Array<interop.Object>, options: QLPreviewSceneOptions | null): this;
}

declare class QLPreviewSceneOptions extends NSObject {
  initialPreviewIndex: number;
}

declare class QLPreviewProvider extends NSObject implements NSExtensionRequestHandling {
  beginRequestWithExtensionContext(context: NSExtensionContext): void;

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

