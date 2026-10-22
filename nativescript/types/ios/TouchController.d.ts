/// <reference types="@nativescript/objc-node-api" />
/// <reference path="./Runtime.d.ts" />

declare const TCGameControllerProductCategoryTouchController: string;

declare const TCThrottleOrientation: {
  Vertical: 0,
  Horizontal: 1,
};

declare const TCControlContentsDpadDirection: {
  Up: 0,
  Down: 1,
  Left: 2,
  Right: 3,
};

declare const TCControlContentsButtonShape: {
  Circle: 0,
  Rect: 1,
};

declare const TCControlLabelRole: {
  Button: 0,
  DirectionPad: 1,
};

declare const TCColliderShape: {
  Circle: 0,
  Rect: 1,
  LeftSide: 2,
  RightSide: 3,
};

declare const TCControlLayoutAnchorCoordinateSystem: {
  Relative: 0,
  Absolute: 1,
};

declare const TCControlLayoutAnchor: {
  TopLeft: 0,
  TopCenter: 1,
  TopRight: 2,
  CenterLeft: 3,
  Center: 4,
  CenterRight: 5,
  BottomLeft: 6,
  BottomCenter: 7,
  BottomRight: 8,
};

declare const TCControlContentsDpadElementStyle: {
  Circle: 0,
  Pentagon: 1,
};

declare interface TCControl extends NSObjectProtocol, TCControlLayout {
  readonly label: TCControlLabel;

  readonly colliderShape: interop.Enum<typeof TCColliderShape>;

  readonly pressed: boolean;

  enabled: boolean;

  handleTouchBeganAtPoint(point: CGPoint): void;

  handleTouchMovedAtPoint(point: CGPoint): void;

  handleTouchEndedAtPoint(point: CGPoint): void;

  highlightDuration?: number;

  isPressed(): boolean;

  isEnabled(): boolean;
}

declare class TCControl extends NativeObject implements TCControl {
}

declare interface TCControlLayout extends NSObjectProtocol {
  anchor: interop.Enum<typeof TCControlLayoutAnchor>;

  anchorCoordinateSystem: interop.Enum<typeof TCControlLayoutAnchorCoordinateSystem>;

  offset: CGPoint;

  zIndex: number;

  size: CGSize;

  readonly position: CGPoint;
}

declare class TCControlLayout extends NativeObject implements TCControlLayout {
}

declare class TCDirectionPadDescriptor extends NSObject {
  compositeLabel: TCControlLabel;

  upLabel: TCControlLabel;

  downLabel: TCControlLabel;

  leftLabel: TCControlLabel;

  rightLabel: TCControlLabel;

  upContents: TCControlContents;

  downContents: TCControlContents;

  leftContents: TCControlContents;

  rightContents: TCControlContents;

  anchor: interop.Enum<typeof TCControlLayoutAnchor>;

  anchorCoordinateSystem: interop.Enum<typeof TCControlLayoutAnchorCoordinateSystem>;

  offset: CGPoint;

  zIndex: number;

  size: CGSize;

  colliderShape: interop.Enum<typeof TCColliderShape>;

  highlightDuration: number;

  radial: boolean;

  digital: boolean;

  mutuallyExclusiveInput: boolean;

  init(): this;

  isRadial(): boolean;

  isDigital(): boolean;

  inputIsMutuallyExclusive(): boolean;
}

declare class TCThumbstick extends NSObject implements TCControl, TCControlLayout {
  backgroundContents: TCControlContents;

  stickContents: TCControlContents;

  hidesWhenNotPressed: boolean;

  stickSize: CGSize;

  readonly colliderShape: interop.Enum<typeof TCColliderShape>;

  highlightDuration: number;

  readonly label: TCControlLabel;

  readonly pressed: boolean;

  enabled: boolean;

  handleTouchBeganAtPoint(point: CGPoint): void;

  handleTouchMovedAtPoint(point: CGPoint): void;

  handleTouchEndedAtPoint(point: CGPoint): void;

  isPressed(): boolean;

  isEnabled(): boolean;

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

  anchor: interop.Enum<typeof TCControlLayoutAnchor>;

  anchorCoordinateSystem: interop.Enum<typeof TCControlLayoutAnchorCoordinateSystem>;

  offset: CGPoint;

  zIndex: number;

  size: CGSize;

  readonly position: CGPoint;
}

declare class TCSwitchDescriptor extends NSObject {
  label: TCControlLabel;

  contents: TCControlContents;

  switchedOnContents: TCControlContents;

  anchor: interop.Enum<typeof TCControlLayoutAnchor>;

  anchorCoordinateSystem: interop.Enum<typeof TCControlLayoutAnchorCoordinateSystem>;

  offset: CGPoint;

  zIndex: number;

  size: CGSize;

  colliderShape: interop.Enum<typeof TCColliderShape>;

  highlightDuration: number;

  init(): this;
}

declare class TCButton extends NSObject implements TCControl, TCControlLayout {
  contents: TCControlContents;

  highlightDuration: number;

  readonly colliderShape: interop.Enum<typeof TCColliderShape>;

  readonly label: TCControlLabel;

  readonly pressed: boolean;

  enabled: boolean;

  handleTouchBeganAtPoint(point: CGPoint): void;

  handleTouchMovedAtPoint(point: CGPoint): void;

  handleTouchEndedAtPoint(point: CGPoint): void;

  isPressed(): boolean;

  isEnabled(): boolean;

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

  anchor: interop.Enum<typeof TCControlLayoutAnchor>;

  anchorCoordinateSystem: interop.Enum<typeof TCControlLayoutAnchorCoordinateSystem>;

  offset: CGPoint;

  zIndex: number;

  size: CGSize;

  readonly position: CGPoint;
}

declare class TCControlLabel extends NSObject {
  static readonly buttonA: TCControlLabel;

  static readonly buttonB: TCControlLabel;

  static readonly buttonX: TCControlLabel;

  static readonly buttonY: TCControlLabel;

  static readonly buttonMenu: TCControlLabel;

  static readonly buttonOptions: TCControlLabel;

  static readonly buttonLeftShoulder: TCControlLabel;

  static readonly buttonLeftTrigger: TCControlLabel;

  static readonly buttonRightShoulder: TCControlLabel;

  static readonly buttonRightTrigger: TCControlLabel;

  static readonly leftThumbstick: TCControlLabel;

  static readonly leftThumbstickButton: TCControlLabel;

  static readonly rightThumbstick: TCControlLabel;

  static readonly rightThumbstickButton: TCControlLabel;

  static readonly directionPad: TCControlLabel;

  initWithNameRole(name: string, role: interop.Enum<typeof TCControlLabelRole>): this;

  readonly name: string;

  readonly role: interop.Enum<typeof TCControlLabelRole>;
}

declare class TCTouchControllerDescriptor extends NSObject {
  device: MTLDevice;

  size: CGSize;

  drawableSize: CGSize;

  colorPixelFormat: interop.Enum<typeof MTLPixelFormat>;

  depthAttachmentPixelFormat: interop.Enum<typeof MTLPixelFormat>;

  stencilAttachmentPixelFormat: interop.Enum<typeof MTLPixelFormat>;

  sampleCount: number;

  init(): this;

  initWithMTKView(mtkView: MTKView): this;
}

declare class TCControlContents extends NSObject {
  static contentsWithImages<This extends abstract new (...args: any) => any>(this: This, images: NSArray<interop.Object> | Array<interop.Object>): InstanceType<This>;

  static buttonContentsForSystemImageNamedSizeShapeController(imageName: string, size: CGSize, shape: interop.Enum<typeof TCControlContentsButtonShape>, controller: TCTouchController): TCControlContents;

  static switchedOnContentsForSystemImageNamedSizeShapeController(imageName: string, size: CGSize, shape: interop.Enum<typeof TCControlContentsButtonShape>, controller: TCTouchController): TCControlContents;

  static thumbstickStickContentsOfSizeController(size: CGSize, controller: TCTouchController): TCControlContents;

  static thumbstickBackgroundContentsOfSizeController(size: CGSize, controller: TCTouchController): TCControlContents;

  static throttleIndicatorContentsOfSizeController(size: CGSize, controller: TCTouchController): TCControlContents;

  static throttleBackgroundContentsOfSizeController(size: CGSize, controller: TCTouchController): TCControlContents;

  static directionPadContentsForLabelSizeStyleDirectionController(label: TCControlLabel, size: CGSize, style: interop.Enum<typeof TCControlContentsDpadElementStyle>, direction: interop.Enum<typeof TCControlContentsDpadDirection>, controller: TCTouchController): TCControlContents;

  readonly images: NSArray;
}

declare class TCTouchController extends NSObject {
  static readonly supported: boolean;

  readonly device: MTLDevice;

  readonly controls: NSArray;

  readonly buttons: NSArray;

  readonly switches: NSArray;

  readonly thumbsticks: NSArray;

  readonly directionPads: NSArray;

  readonly throttles: NSArray;

  readonly touchpads: NSArray;

  size: CGSize;

  drawableSize: CGSize;

  initWithDescriptor(descriptor: TCTouchControllerDescriptor): this;

  automaticallyLayoutControlsForLabels(labels: NSArray<interop.Object> | Array<interop.Object>): void;

  addButtonWithDescriptor(descriptor: TCButtonDescriptor): TCButton;

  addSwitchWithDescriptor(descriptor: TCSwitchDescriptor): TCSwitch;

  addThumbstickWithDescriptor(descriptor: TCThumbstickDescriptor): TCThumbstick;

  addDirectionPadWithDescriptor(descriptor: TCDirectionPadDescriptor): TCDirectionPad;

  addThrottleWithDescriptor(descriptor: TCThrottleDescriptor): TCThrottle;

  addTouchpadWithDescriptor(descriptor: TCTouchpadDescriptor): TCTouchpad;

  removeAllControls(): void;

  removeControl(control: TCControl): void;

  controlAtPoint(point: CGPoint): TCControl;

  handleTouchBeganAtPointIndex(point: CGPoint, index: number): boolean;

  handleTouchMovedAtPointIndex(point: CGPoint, index: number): boolean;

  handleTouchEndedAtPointIndex(point: CGPoint, index: number): boolean;

  renderUsingRenderCommandEncoder(encoder: MTLRenderCommandEncoder): void;

  readonly connected: boolean;

  connect(): void;

  disconnect(): void;

  readonly controller: GCController;

  static isSupported(): boolean;

  isConnected(): boolean;
}

declare class TCControlImage extends NSObject {
  initWithTextureSize(texture: MTLTexture, size: CGSize): this;

  initWithTextureSizeHighlightTextureOffsetTintColor(texture: MTLTexture, size: CGSize, highlightTexture: MTLTexture | null, offset: CGPoint, tintColor: interop.Object): this;

  initWithCGImageSizeDevice(cgImage: interop.Object, size: CGSize, device: MTLDevice): this;

  initWithUIImageSizeDevice(uiImage: UIImage, size: CGSize, device: MTLDevice): this;

  texture: MTLTexture;

  highlightTexture: MTLTexture;

  size: CGSize;

  offset: CGPoint;

  tintColor: interop.Object;
}

declare class TCThumbstickDescriptor extends NSObject {
  label: TCControlLabel;

  backgroundContents: TCControlContents;

  stickContents: TCControlContents;

  hidesWhenNotPressed: boolean;

  stickSize: CGSize;

  size: CGSize;

  anchor: interop.Enum<typeof TCControlLayoutAnchor>;

  anchorCoordinateSystem: interop.Enum<typeof TCControlLayoutAnchorCoordinateSystem>;

  offset: CGPoint;

  zIndex: number;

  colliderShape: interop.Enum<typeof TCColliderShape>;

  highlightDuration: number;

  init(): this;
}

declare class TCThrottle extends NSObject implements TCControl, TCControlLayout {
  backgroundContents: TCControlContents;

  indicatorContents: TCControlContents;

  readonly orientation: interop.Enum<typeof TCThrottleOrientation>;

  snapsToBaseValue: boolean;

  baseValue: number;

  indicatorSize: CGSize;

  throttleSize: CGSize;

  readonly colliderShape: interop.Enum<typeof TCColliderShape>;

  highlightDuration: number;

  readonly label: TCControlLabel;

  readonly pressed: boolean;

  enabled: boolean;

  handleTouchBeganAtPoint(point: CGPoint): void;

  handleTouchMovedAtPoint(point: CGPoint): void;

  handleTouchEndedAtPoint(point: CGPoint): void;

  isPressed(): boolean;

  isEnabled(): boolean;

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

  anchor: interop.Enum<typeof TCControlLayoutAnchor>;

  anchorCoordinateSystem: interop.Enum<typeof TCControlLayoutAnchorCoordinateSystem>;

  offset: CGPoint;

  zIndex: number;

  size: CGSize;

  readonly position: CGPoint;
}

declare class TCTouchpadDescriptor extends NSObject {
  label: TCControlLabel;

  contents: TCControlContents;

  anchor: interop.Enum<typeof TCControlLayoutAnchor>;

  anchorCoordinateSystem: interop.Enum<typeof TCControlLayoutAnchorCoordinateSystem>;

  offset: CGPoint;

  zIndex: number;

  size: CGSize;

  colliderShape: interop.Enum<typeof TCColliderShape>;

  highlightDuration: number;

  reportsRelativeValues: boolean;

  init(): this;
}

declare class TCSwitch extends NSObject implements TCControl, TCControlLayout {
  contents: TCControlContents;

  switchedOnContents: TCControlContents;

  highlightDuration: number;

  readonly switchedOn: boolean;

  readonly colliderShape: interop.Enum<typeof TCColliderShape>;

  isSwitchedOn(): boolean;

  readonly label: TCControlLabel;

  readonly pressed: boolean;

  enabled: boolean;

  handleTouchBeganAtPoint(point: CGPoint): void;

  handleTouchMovedAtPoint(point: CGPoint): void;

  handleTouchEndedAtPoint(point: CGPoint): void;

  isPressed(): boolean;

  isEnabled(): boolean;

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

  anchor: interop.Enum<typeof TCControlLayoutAnchor>;

  anchorCoordinateSystem: interop.Enum<typeof TCControlLayoutAnchorCoordinateSystem>;

  offset: CGPoint;

  zIndex: number;

  size: CGSize;

  readonly position: CGPoint;
}

declare class TCThrottleDescriptor extends NSObject {
  label: TCControlLabel;

  backgroundContents: TCControlContents;

  indicatorContents: TCControlContents;

  size: CGSize;

  indicatorSize: CGSize;

  throttleSize: CGSize;

  orientation: interop.Enum<typeof TCThrottleOrientation>;

  snapsToBaseValue: boolean;

  baseValue: number;

  anchor: interop.Enum<typeof TCControlLayoutAnchor>;

  anchorCoordinateSystem: interop.Enum<typeof TCControlLayoutAnchorCoordinateSystem>;

  offset: CGPoint;

  zIndex: number;

  colliderShape: interop.Enum<typeof TCColliderShape>;

  highlightDuration: number;

  init(): this;
}

declare class TCTouchpad extends NSObject implements TCControl, TCControlLayout {
  contents: TCControlContents;

  readonly colliderShape: interop.Enum<typeof TCColliderShape>;

  highlightDuration: number;

  reportsRelativeValues: boolean;

  readonly label: TCControlLabel;

  readonly pressed: boolean;

  enabled: boolean;

  handleTouchBeganAtPoint(point: CGPoint): void;

  handleTouchMovedAtPoint(point: CGPoint): void;

  handleTouchEndedAtPoint(point: CGPoint): void;

  isPressed(): boolean;

  isEnabled(): boolean;

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

  anchor: interop.Enum<typeof TCControlLayoutAnchor>;

  anchorCoordinateSystem: interop.Enum<typeof TCControlLayoutAnchorCoordinateSystem>;

  offset: CGPoint;

  zIndex: number;

  size: CGSize;

  readonly position: CGPoint;
}

declare class TCDirectionPad extends NSObject implements TCControl, TCControlLayout {
  compositeLabel: TCControlLabel;

  upLabel: TCControlLabel;

  downLabel: TCControlLabel;

  leftLabel: TCControlLabel;

  rightLabel: TCControlLabel;

  upContents: TCControlContents;

  downContents: TCControlContents;

  leftContents: TCControlContents;

  rightContents: TCControlContents;

  readonly colliderShape: interop.Enum<typeof TCColliderShape>;

  highlightDuration: number;

  radial: boolean;

  digital: boolean;

  mutuallyExclusiveInput: boolean;

  isRadial(): boolean;

  isDigital(): boolean;

  inputIsMutuallyExclusive(): boolean;

  readonly label: TCControlLabel;

  readonly pressed: boolean;

  enabled: boolean;

  handleTouchBeganAtPoint(point: CGPoint): void;

  handleTouchMovedAtPoint(point: CGPoint): void;

  handleTouchEndedAtPoint(point: CGPoint): void;

  isPressed(): boolean;

  isEnabled(): boolean;

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

  anchor: interop.Enum<typeof TCControlLayoutAnchor>;

  anchorCoordinateSystem: interop.Enum<typeof TCControlLayoutAnchorCoordinateSystem>;

  offset: CGPoint;

  zIndex: number;

  size: CGSize;

  readonly position: CGPoint;
}

declare class TCButtonDescriptor extends NSObject {
  label: TCControlLabel;

  contents: TCControlContents;

  anchor: interop.Enum<typeof TCControlLayoutAnchor>;

  anchorCoordinateSystem: interop.Enum<typeof TCControlLayoutAnchorCoordinateSystem>;

  offset: CGPoint;

  zIndex: number;

  size: CGSize;

  colliderShape: interop.Enum<typeof TCColliderShape>;

  highlightDuration: number;

  init(): this;
}

