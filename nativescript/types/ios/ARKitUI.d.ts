/// <reference types="@nativescript/objc-node-api" />
/// <reference path="./UIKit.d.ts" />
/// <reference path="./SpriteKit.d.ts" />
/// <reference path="./SceneKit.d.ts" />

declare const ARSCNDebugOptionShowFeaturePoints: interop.Enum<typeof SCNDebugOptions>;

declare const ARSCNDebugOptionShowWorldOrigin: interop.Enum<typeof SCNDebugOptions>;

declare const ARCoachingGoal: {
  Tracking: 0,
  HorizontalPlane: 1,
  VerticalPlane: 2,
  AnyPlane: 3,
  GeoTracking: 4,
};

declare interface ARSKViewDelegate extends SKViewDelegate, ARSessionObserver {
  viewNodeForAnchor?(view: ARSKView, anchor: ARAnchor): SKNode;

  viewDidAddNodeForAnchor?(view: ARSKView, node: SKNode, anchor: ARAnchor): void;

  viewWillUpdateNodeForAnchor?(view: ARSKView, node: SKNode, anchor: ARAnchor): void;

  viewDidUpdateNodeForAnchor?(view: ARSKView, node: SKNode, anchor: ARAnchor): void;

  viewDidRemoveNodeForAnchor?(view: ARSKView, node: SKNode, anchor: ARAnchor): void;
}

declare class ARSKViewDelegate extends NativeObject implements ARSKViewDelegate {
}

declare interface ARSCNViewDelegate extends SCNSceneRendererDelegate, ARSessionObserver {
  rendererNodeForAnchor?(renderer: SCNSceneRenderer, anchor: ARAnchor): SCNNode;

  rendererDidAddNodeForAnchor?(renderer: SCNSceneRenderer, node: SCNNode, anchor: ARAnchor): void;

  rendererWillUpdateNodeForAnchor?(renderer: SCNSceneRenderer, node: SCNNode, anchor: ARAnchor): void;

  rendererDidUpdateNodeForAnchor?(renderer: SCNSceneRenderer, node: SCNNode, anchor: ARAnchor): void;

  rendererDidRemoveNodeForAnchor?(renderer: SCNSceneRenderer, node: SCNNode, anchor: ARAnchor): void;
}

declare class ARSCNViewDelegate extends NativeObject implements ARSCNViewDelegate {
}

declare interface ARCoachingOverlayViewDelegate extends NSObjectProtocol {
  coachingOverlayViewDidRequestSessionReset?(coachingOverlayView: ARCoachingOverlayView): void;

  coachingOverlayViewWillActivate?(coachingOverlayView: ARCoachingOverlayView): void;

  coachingOverlayViewDidDeactivate?(coachingOverlayView: ARCoachingOverlayView): void;
}

declare class ARCoachingOverlayViewDelegate extends NativeObject implements ARCoachingOverlayViewDelegate {
}

declare class ARCoachingOverlayView extends UIView {
  delegate: ARCoachingOverlayViewDelegate;

  sessionProvider: NSObject;

  session: ARSession;

  goal: interop.Enum<typeof ARCoachingGoal>;

  activatesAutomatically: boolean;

  readonly isActive: boolean;

  setActiveAnimated(active: boolean, animated: boolean): void;
}

declare class ARSKView extends SKView implements ARSessionProviding {
  delegate: NSObject;

  session: ARSession;

  anchorForNode(node: SKNode): ARAnchor;

  nodeForAnchor(anchor: ARAnchor): SKNode;

  hitTestTypes(point: CGPoint, types: interop.Enum<typeof ARHitTestResultType>): NSArray;

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

// @ts-ignore ClassDecl.tsIgnore
declare class ARSCNView extends SCNView implements ARSessionProviding {
  // @ts-ignore MemberDecl.tsIgnore
  delegate: ARSCNViewDelegate;

  session: ARSession;

  scene: SCNScene;

  automaticallyUpdatesLighting: boolean;

  rendersCameraGrain: boolean;

  rendersMotionBlur: boolean;

  anchorForNode(node: SCNNode): ARAnchor;

  nodeForAnchor(anchor: ARAnchor): SCNNode;

  hitTestTypes(point: CGPoint, types: interop.Enum<typeof ARHitTestResultType>): NSArray;

  unprojectPointOntoPlaneWithTransform(point: CGPoint, planeTransform: simd_float4x4): unknown /* ext vector */;

  raycastQueryFromPointAllowingTargetAlignment(point: CGPoint, target: interop.Enum<typeof ARRaycastTarget>, alignment: interop.Enum<typeof ARRaycastTargetAlignment>): ARRaycastQuery;

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

declare class ARSCNPlaneGeometry extends SCNGeometry {
  static planeGeometryWithDevice<This extends abstract new (...args: any) => any>(this: This, device: MTLDevice): InstanceType<This>;

  updateFromPlaneGeometry(planeGeometry: ARPlaneGeometry): void;
}

declare class ARSCNFaceGeometry extends SCNGeometry {
  static faceGeometryWithDevice<This extends abstract new (...args: any) => any>(this: This, device: MTLDevice): InstanceType<This>;

  static faceGeometryWithDeviceFillMesh<This extends abstract new (...args: any) => any>(this: This, device: MTLDevice, fillMesh: boolean): InstanceType<This>;

  updateFromFaceGeometry(faceGeometry: ARFaceGeometry): void;
}

