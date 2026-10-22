/// <reference types="@nativescript/objc-node-api" />
/// <reference path="./Runtime.d.ts" />
/// <reference path="./UIKit.d.ts" />

declare const AVKitErrorDomain: string;

declare const AVPlaybackUserInterfaceSeekCapabilities: {
  None: 0,
  ScanForward: 1,
  ScanBackward: 2,
  Seek: 4,
};

declare const AVKitError: {
  Unknown: -1000,
  PictureInPictureStartFailed: -1001,
};

declare const AVVideoFrameAnalysisType: {
  None: 0,
  Default: 1,
  Text: 2,
  Subject: 4,
  VisualSearch: 8,
  MachineReadableCode: 16,
};

declare const AVAudioSessionRouteSelection: {
  None: 0,
  Local: 1,
  External: 2,
};

declare const AVLegibleMediaOptionsMenuContents: {
  Legible: 1,
  CaptionAppearance: 2,
  All: 3,
};

declare const AVPlaybackUserInterfacePlaybackState: {
  Normal: 0,
  Scanning: 1,
  Scrubbing: 2,
};

declare const AVCaptureEventPhase: {
  Began: 0,
  Ended: 1,
  Cancelled: 2,
};

declare const AVLegibleMediaOptionsMenuStateChangeReason: {
  None: 0,
  LanguageMismatch: 1,
};

declare const AVPlaybackUserInterfaceTimelineSegmentType: {
  Primary: 0,
  Advertisement: 1,
  Bonus: 2,
  Credits: 3,
  Intro: 4,
  Recap: 5,
  Trailer: 6,
  Other: 7,
};

declare const AVDisplayDynamicRange: {
  Automatic: 0,
  Standard: 1,
  ConstrainedHigh: 2,
  High: 3,
};

declare class AVLegibleMediaOptionsMenuState {
  constructor(init?: AVLegibleMediaOptionsMenuState);
  enabled: boolean;
  reason: interop.Enum<typeof AVLegibleMediaOptionsMenuStateChangeReason>;
}

declare interface AVPlaybackUserInterfaceMetadataProviding extends NSObjectProtocol {
  readonly metadata: AVPlaybackUserInterfaceContentMetadata;
}

declare class AVPlaybackUserInterfaceMetadataProviding extends NativeObject implements AVPlaybackUserInterfaceMetadataProviding {
}

declare interface AVPictureInPictureSampleBufferPlaybackDelegate extends NSObjectProtocol {
  pictureInPictureControllerSetPlaying(pictureInPictureController: AVPictureInPictureController, playing: boolean): void;

  pictureInPictureControllerTimeRangeForPlayback(pictureInPictureController: AVPictureInPictureController): CMTimeRange;

  pictureInPictureControllerIsPlaybackPaused(pictureInPictureController: AVPictureInPictureController): boolean;

  pictureInPictureControllerDidTransitionToRenderSize(pictureInPictureController: AVPictureInPictureController, newRenderSize: CMVideoDimensions): void;

  pictureInPictureControllerSkipByIntervalCompletionHandler(pictureInPictureController: AVPictureInPictureController, skipInterval: CMTime, completionHandler: () => void): void;

  pictureInPictureControllerShouldProhibitBackgroundAudioPlayback?(pictureInPictureController: AVPictureInPictureController): boolean;
}

declare class AVPictureInPictureSampleBufferPlaybackDelegate extends NativeObject implements AVPictureInPictureSampleBufferPlaybackDelegate {
}

declare interface AVLegibleMediaOptionsMenuControllerDelegate extends NSObjectProtocol {
  legibleMenuControllerDidChangeMenuState?(menuController: AVLegibleMediaOptionsMenuController, state: AVLegibleMediaOptionsMenuState): void;

  legibleMenuControllerDidRequestCaptionPreviewForProfileID?(menuController: AVLegibleMediaOptionsMenuController, profileID: string): void;

  legibleMenuControllerDidRequestStoppingSubtitleCaptionPreview?(menuController: AVLegibleMediaOptionsMenuController): void;
}

declare class AVLegibleMediaOptionsMenuControllerDelegate extends NativeObject implements AVLegibleMediaOptionsMenuControllerDelegate {
}

declare interface AVInputPickerInteractionDelegate extends NSObjectProtocol {
  inputPickerInteractionWillBeginPresenting?(inputPickerInteraction: AVInputPickerInteraction): void;

  inputPickerInteractionDidEndPresenting?(inputPickerInteraction: AVInputPickerInteraction): void;

  inputPickerInteractionWillBeginDismissing?(inputPickerInteraction: AVInputPickerInteraction): void;

  inputPickerInteractionDidEndDismissing?(inputPickerInteraction: AVInputPickerInteraction): void;
}

declare class AVInputPickerInteractionDelegate extends NativeObject implements AVInputPickerInteractionDelegate {
}

declare interface AVPlaybackUserInterfaceMediaSelectionControllable extends NSObjectProtocol {
  currentAudioOption: AVPlaybackUserInterfaceMediaSelectionOption;

  currentAudioDescriptionOption: AVPlaybackUserInterfaceMediaSelectionOption;

  currentLegibleOption: AVPlaybackUserInterfaceMediaSelectionOption;

  readonly audioOptions: NSArray;

  readonly audioDescriptionOptions: NSArray;

  readonly legibleOptions: NSArray;
}

declare class AVPlaybackUserInterfaceMediaSelectionControllable extends NativeObject implements AVPlaybackUserInterfaceMediaSelectionControllable {
}

declare interface AVPlaybackUserInterfaceControllable extends AVPlaybackUserInterfaceTimeControllable, AVPlaybackUserInterfacePlaybackControllable, AVPlaybackUserInterfaceMediaSelectionControllable, AVPlaybackUserInterfaceVolumeControllable, AVPlaybackUserInterfaceMetadataProviding {
}

declare class AVPlaybackUserInterfaceControllable extends NativeObject implements AVPlaybackUserInterfaceControllable {
}

declare interface AVPlaybackUserInterfaceVolumeControllable extends NSObjectProtocol {
  readonly hasAudio: boolean;

  muted: boolean;

  volume: number;

  isMuted(): boolean;
}

declare class AVPlaybackUserInterfaceVolumeControllable extends NativeObject implements AVPlaybackUserInterfaceVolumeControllable {
}

declare interface AVPlayerViewControllerDelegate extends NSObjectProtocol {
  playerViewControllerWillBeginFullScreenPresentationWithAnimationCoordinator?(playerViewController: AVPlayerViewController, coordinator: UIViewControllerTransitionCoordinator): void;

  playerViewControllerWillEndFullScreenPresentationWithAnimationCoordinator?(playerViewController: AVPlayerViewController, coordinator: UIViewControllerTransitionCoordinator): void;

  playerViewControllerRestoreUserInterfaceForFullScreenExitWithCompletionHandler?(playerViewController: AVPlayerViewController, completionHandler: (p1: boolean) => void): void;

  playerViewControllerWillStartPictureInPicture?(playerViewController: AVPlayerViewController): void;

  playerViewControllerDidStartPictureInPicture?(playerViewController: AVPlayerViewController): void;

  playerViewControllerFailedToStartPictureInPictureWithError?(playerViewController: AVPlayerViewController, error: NSError): void;

  playerViewControllerWillStopPictureInPicture?(playerViewController: AVPlayerViewController): void;

  playerViewControllerDidStopPictureInPicture?(playerViewController: AVPlayerViewController): void;

  playerViewControllerShouldAutomaticallyDismissAtPictureInPictureStart?(playerViewController: AVPlayerViewController): boolean;

  playerViewControllerRestoreUserInterfaceForPictureInPictureStopWithCompletionHandler?(playerViewController: AVPlayerViewController, completionHandler: (p1: boolean) => void): void;

  playerViewControllerWillPresentInterstitialTimeRange?(playerViewController: AVPlayerViewController, interstitial: AVInterstitialTimeRange): void;

  playerViewControllerDidPresentInterstitialTimeRange?(playerViewController: AVPlayerViewController, interstitial: AVInterstitialTimeRange): void;
}

declare class AVPlayerViewControllerDelegate extends NativeObject implements AVPlayerViewControllerDelegate {
}

declare interface AVRoutePickerViewDelegate extends NSObjectProtocol {
  routePickerViewWillBeginPresentingRoutes?(routePickerView: AVRoutePickerView): void;

  routePickerViewDidEndPresentingRoutes?(routePickerView: AVRoutePickerView): void;
}

declare class AVRoutePickerViewDelegate extends NativeObject implements AVRoutePickerViewDelegate {
}

declare interface AVPictureInPictureControllerDelegate extends NSObjectProtocol {
  pictureInPictureControllerWillStartPictureInPicture?(pictureInPictureController: AVPictureInPictureController): void;

  pictureInPictureControllerDidStartPictureInPicture?(pictureInPictureController: AVPictureInPictureController): void;

  pictureInPictureControllerFailedToStartPictureInPictureWithError?(pictureInPictureController: AVPictureInPictureController, error: NSError): void;

  pictureInPictureControllerWillStopPictureInPicture?(pictureInPictureController: AVPictureInPictureController): void;

  pictureInPictureControllerDidStopPictureInPicture?(pictureInPictureController: AVPictureInPictureController): void;

  pictureInPictureControllerRestoreUserInterfaceForPictureInPictureStopWithCompletionHandler?(pictureInPictureController: AVPictureInPictureController, completionHandler: (p1: boolean) => void): void;
}

declare class AVPictureInPictureControllerDelegate extends NativeObject implements AVPictureInPictureControllerDelegate {
}

declare interface AVPlaybackUserInterfacePlaybackControllable extends NSObjectProtocol {
  readonly ready: boolean;

  playing: boolean;

  readonly buffering: boolean;

  playbackSpeed: number;

  scanSpeed: number;

  state: interop.Enum<typeof AVPlaybackUserInterfacePlaybackState>;

  readonly supportedSeekCapabilities: interop.Enum<typeof AVPlaybackUserInterfaceSeekCapabilities>;

  readonly containsLiveStreamingContent: boolean;

  readonly error: NSError;

  isReady(): boolean;

  isPlaying(): boolean;

  isBuffering(): boolean;
}

declare class AVPlaybackUserInterfacePlaybackControllable extends NativeObject implements AVPlaybackUserInterfacePlaybackControllable {
}

declare interface AVPlaybackUserInterfaceTimeControllable extends NSObjectProtocol {
  readonly timeRange: CMTimeRange;

  readonly playbackPosition: AVPlaybackUserInterfacePlaybackPosition;

  seekToPositionTolerance(position: CMTime, tolerance: CMTime): void;

  readonly segments: NSArray;

  readonly currentSegment: AVPlaybackUserInterfaceTimelineSegment;

  readonly seekableTimeRanges: NSArray;
}

declare class AVPlaybackUserInterfaceTimeControllable extends NativeObject implements AVPlaybackUserInterfaceTimeControllable {
}

declare class AVPictureInPictureController extends NSObject {
  static isPictureInPictureSupported(): boolean;

  static pictureInPictureButtonStartImageCompatibleWithTraitCollection(traitCollection: UITraitCollection | null): UIImage;

  static pictureInPictureButtonStopImageCompatibleWithTraitCollection(traitCollection: UITraitCollection | null): UIImage;

  static readonly pictureInPictureButtonStartImage: UIImage;

  static readonly pictureInPictureButtonStopImage: UIImage;

  initWithContentSource(contentSource: AVPictureInPictureControllerContentSource): this;

  initWithPlayerLayer(playerLayer: AVPlayerLayer): this;

  contentSource: AVPictureInPictureControllerContentSource;

  readonly playerLayer: AVPlayerLayer;

  delegate: AVPictureInPictureControllerDelegate;

  startPictureInPicture(): void;

  stopPictureInPicture(): void;

  readonly pictureInPicturePossible: boolean;

  readonly pictureInPictureActive: boolean;

  readonly pictureInPictureSuspended: boolean;

  requiresLinearPlayback: boolean;

  canStartPictureInPictureAutomaticallyFromInline: boolean;

  isPictureInPicturePossible(): boolean;

  isPictureInPictureActive(): boolean;

  isPictureInPictureSuspended(): boolean;

  invalidatePlaybackState(): void;
}

declare class AVCaptureEventSound extends NSObject {
  initWithURLError(url: NSURL, error: interop.PointerConvertible): this;

  static readonly cameraShutterSound: AVCaptureEventSound;

  static readonly beginVideoRecordingSound: AVCaptureEventSound;

  static readonly endVideoRecordingSound: AVCaptureEventSound;
}

declare class AVPlayerViewController extends UIViewController {
  player: AVPlayer;

  showsPlaybackControls: boolean;

  showsTimecodes: boolean;

  videoGravity: string;

  readonly readyForDisplay: boolean;

  readonly videoBounds: CGRect;

  readonly contentOverlayView: UIView;

  allowsPictureInPicturePlayback: boolean;

  allowsVideoFrameAnalysis: boolean;

  videoFrameAnalysisTypes: interop.Enum<typeof AVVideoFrameAnalysisType>;

  readonly toggleLookupAction: UIAction;

  canStartPictureInPictureAutomaticallyFromInline: boolean;

  updatesNowPlayingInfoCenter: boolean;

  entersFullScreenWhenPlaybackBegins: boolean;

  exitsFullScreenWhenPlaybackEnds: boolean;

  requiresLinearPlayback: boolean;

  get pixelBufferAttributes(): NSDictionary;
  set pixelBufferAttributes(value: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>);

  delegate: AVPlayerViewControllerDelegate;

  get speeds(): NSArray;
  set speeds(value: NSArray<interop.Object> | Array<interop.Object>);

  readonly selectedSpeed: AVPlaybackSpeed;

  selectSpeed(speed: AVPlaybackSpeed): void;

  preferredDisplayDynamicRange: interop.Enum<typeof AVDisplayDynamicRange>;

  static readonly mediaCharacteristicsForSupportedCustomMediaSelectionSchemes: NSArray;

  isReadyForDisplay(): boolean;
}

declare class AVPlaybackUserInterfaceContentMetadataTemplate extends NSObject implements NSCopying, NSSecureCoding {
  videoProperties: AVPlaybackUserInterfaceContentVideoProperties;

  title: string;

  subtitle: string;

  get artworkRepresentations(): NSArray;
  set artworkRepresentations(value: NSArray<interop.Object> | Array<interop.Object>);

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class AVPictureInPictureVideoCallViewController extends UIViewController {
}

declare class AVInterstitialTimeRange extends NSObject implements NSCopying, NSSecureCoding {
  readonly timeRange: CMTimeRange;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class AVPlaybackUserInterfacePlaybackPosition extends NSObject implements NSCopying, NSSecureCoding {
  readonly position: CMTime;

  readonly hostTime: CMTime;

  readonly rate: number;

  initWithPositionHostTimeRate(position: CMTime, hostTime: CMTime, rate: number): this;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class AVPlaybackUserInterfaceContentMetadata extends NSObject implements NSCopying, NSSecureCoding {
  readonly videoProperties: AVPlaybackUserInterfaceContentVideoProperties;

  readonly title: string;

  readonly subtitle: string;

  readonly artworkRepresentations: NSArray;

  initWithVideoPropertiesTitleSubtitleArtworkRepresentations(videoProperties: AVPlaybackUserInterfaceContentVideoProperties | null, title: string | null, subtitle: string | null, artworkRepresentations: NSArray<interop.Object> | Array<interop.Object>): this;

  initWithTemplate(metadataTemplate: AVPlaybackUserInterfaceContentMetadataTemplate | null): this;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class AVPlaybackUserInterfaceContentArtwork extends NSObject implements NSCopying, NSSecureCoding {
  readonly size: CGSize;

  static artworkWithURLContentTypeSize(url: NSURL, type: UTType, size: CGSize): AVPlaybackUserInterfaceContentURLArtwork;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class AVPlaybackUserInterfaceTimelineSegment extends NSObject implements NSCopying, NSSecureCoding {
  readonly timeRange: CMTimeRange;

  readonly segmentType: interop.Enum<typeof AVPlaybackUserInterfaceTimelineSegmentType>;

  readonly marked: boolean;

  readonly requiresLinearPlayback: boolean;

  readonly identifier: string;

  initWithTimeRangeSegmentTypeMarkedRequiresLinearPlaybackIdentifier(timeRange: CMTimeRange, segmentType: interop.Enum<typeof AVPlaybackUserInterfaceTimelineSegmentType>, marked: boolean, requiresLinearPlayback: boolean, identifier: string | null): this;

  isMarked(): boolean;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class AVPictureInPictureControllerContentSource extends NSObject {
  initWithPlayerLayer(playerLayer: AVPlayerLayer): this;

  readonly playerLayer: AVPlayerLayer;

  initWithSampleBufferDisplayLayerPlaybackDelegate(sampleBufferDisplayLayer: AVSampleBufferDisplayLayer, playbackDelegate: AVPictureInPictureSampleBufferPlaybackDelegate): this;

  readonly sampleBufferDisplayLayer: AVSampleBufferDisplayLayer;

  readonly sampleBufferPlaybackDelegate: AVPictureInPictureSampleBufferPlaybackDelegate;

  initWithActiveVideoCallSourceViewContentViewController(sourceView: UIView, contentViewController: AVPictureInPictureVideoCallViewController): this;

  readonly activeVideoCallSourceView: UIView | null;

  readonly activeVideoCallContentViewController: AVPictureInPictureVideoCallViewController;
}

declare class AVCaptureEventInteraction extends NSObject implements UIInteraction {
  initWithEventHandler(handler: (p1: AVCaptureEvent) => void): this;

  initWithPrimaryEventHandlerSecondaryEventHandler(primaryHandler: (p1: AVCaptureEvent) => void, secondaryHandler: (p1: AVCaptureEvent) => void): this;

  enabled: boolean;

  static defaultCaptureSoundDisabled: boolean;

  isEnabled(): boolean;

  readonly view: UIView;

  willMoveToView(view: UIView | null): void;

  didMoveToView(view: UIView | null): void;

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

declare class AVCaptureDeviceDescriptor extends NSObject {
  readonly deviceType: string;

  readonly mediaTypes: NSSet;

  readonly position: interop.Enum<typeof AVCaptureDevicePosition>;

  readonly uniqueID: string;

  readonly localizedName: string;
}

declare class AVPlaybackSpeed extends NSObject {
  static readonly systemDefaultSpeeds: NSArray;

  initWithRateLocalizedName(rate: number, localizedName: string): this;

  readonly rate: number;

  readonly localizedName: string;

  readonly localizedNumericName: string;
}

declare class AVLegibleMediaOptionsMenuController extends NSObject {
  initWithPlayer(player: AVPlayer | null): this;

  menuWithContents(contents: interop.Enum<typeof AVLegibleMediaOptionsMenuContents>): UIMenu;

  player: AVPlayer;

  delegate: AVLegibleMediaOptionsMenuControllerDelegate | null;

  readonly menuState: AVLegibleMediaOptionsMenuState;
}

declare class AVPlaybackUserInterfaceContentVideoProperties extends NSObject implements NSCopying, NSSecureCoding {
  readonly presentationSize: CGSize;

  initWithPresentationSize(presentationSize: CGSize): this;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class AVCaptureDeviceDirectionCoordinator extends NSObject {
  initWithViewDeviceTypesChangeHandler(view: UIView, deviceTypes: NSArray<interop.Object> | Array<interop.Object>, changeHandler: (p1: AVCaptureDeviceDirectionMap) => void | null): this;

  readonly deviceDirections: AVCaptureDeviceDirectionMap;
}

declare class AVCaptureEvent extends NSObject {
  readonly phase: interop.Enum<typeof AVCaptureEventPhase>;

  playSound(sound: AVCaptureEventSound): boolean;

  readonly shouldPlaySound: boolean;
}

declare class AVInputPickerInteraction extends NSObject implements UIInteraction {
  delegate: AVInputPickerInteractionDelegate;

  readonly presented: boolean;

  audioSession: AVAudioSession;

  present(): void;

  dismiss(): void;

  init(): this;

  initWithAudioSession(audioSession: AVAudioSession | null): this;

  isPresented(): boolean;

  readonly view: UIView;

  willMoveToView(view: UIView | null): void;

  didMoveToView(view: UIView | null): void;

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

declare class AVCaptureDeviceDirectionMap extends NSObject {
  readonly forwardFacingDeviceDescriptors: NSArray;

  readonly backwardFacingDeviceDescriptors: NSArray;
}

declare class AVRoutePickerView extends UIView {
  delegate: AVRoutePickerViewDelegate;

  activeTintColor: UIColor;

  prioritizesVideoDevices: boolean;

  customRoutingController: AVCustomRoutingController;
}

declare class AVPlaybackUserInterfaceMediaSelectionOption extends NSObject implements NSCopying, NSSecureCoding {
  readonly displayName: string;

  readonly identifier: string;

  readonly extendedLanguageTag: string;

  readonly mediaCharacteristics: NSArray;

  initWithDisplayNameIdentifierExtendedLanguageTagMediaCharacteristics(displayName: string, identifier: string, extendedLanguageTag: string | null, mediaCharacteristics: NSArray<interop.Object> | Array<interop.Object>): this;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class AVPlaybackUserInterfaceContentURLArtwork extends AVPlaybackUserInterfaceContentArtwork {
  readonly url: NSURL;

  readonly contentType: UTType;
}

