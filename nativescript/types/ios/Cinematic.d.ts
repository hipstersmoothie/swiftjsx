/// <reference types="@nativescript/objc-node-api" />
/// <reference path="./Runtime.d.ts" />

declare const CNCinematicErrorDomain: string;

declare const CNDetectionType: {
  Unknown: 0,
  HumanFace: 1,
  HumanHead: 2,
  HumanTorso: 3,
  CatBody: 4,
  DogBody: 5,
  CatHead: 9,
  DogHead: 10,
  SportsBall: 11,
  AutoFocus: 100,
  FixedFocus: 101,
  Custom: 102,
};

declare const CNCinematicResourceVersion: {
  CNCinematicResourceVersion1: 1,
};

declare const CNCinematicErrorCode: {
  Unknown: 1,
  Unreadable: 2,
  Incomplete: 3,
  Malformed: 4,
  Unsupported: 5,
  Incompatible: 6,
  Cancelled: 7,
  DownloadFailed: 8,
};

declare const CNCinematicCapability: {
  None: 0,
  Renderable: 1,
  NeedsPreprocessing: 2,
};

declare const CNSpatialAudioContentType: {
  Stereo: 0,
  Spatial: 1,
};

declare const CNRenderingQuality: {
  Thumbnail: 0,
  Preview: 1,
  Export: 2,
  ExportHigh: 3,
};

declare const CNResourceStatus: {
  Ready: 0,
  NeedsDownloading: 1,
  UnsupportedDevice: 2,
  UnsupportedAsset: 3,
};

declare const CNSpatialAudioRenderingStyle: {
  Cinematic: 0,
  Studio: 1,
  InFrame: 2,
  CinematicBackgroundStem: 3,
  CinematicForegroundStem: 4,
  StudioForegroundStem: 5,
  InFrameForegroundStem: 6,
  Standard: 7,
  StudioBackgroundStem: 8,
  InFrameBackgroundStem: 9,
};

declare class CNObjectTracker extends NSObject {
  static readonly isSupported: boolean;

  initWithCommandQueue(commandQueue: MTLCommandQueue): this;

  findObjectAtPointSourceImage(point: CGPoint, sourceImage: interop.Object): CNBoundsPrediction;

  startTrackingAtWithinSourceImageSourceDisparity(time: CMTime, normalizedBounds: CGRect, sourceImage: interop.Object, sourceDisparity: interop.Object): boolean;

  continueTrackingAtSourceImageSourceDisparity(time: CMTime, sourceImage: interop.Object, sourceDisparity: interop.Object): CNBoundsPrediction;

  finishDetectionTrack(): CNDetectionTrack;

  resetDetectionTrack(): void;
}

declare class CNBoundsPrediction extends NSObject implements NSCopying, NSMutableCopying {
  normalizedBounds: CGRect;

  confidence: number;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  mutableCopyWithZone(zone: interop.PointerConvertible): interop.Object;
}

declare class CNScript extends NSObject {
  static loadFromAssetChangesProgressCompletionHandler(asset: AVAsset, changes: CNScriptChanges | null, progress: NSProgress | null, completionHandler: (p1: CNScript, p2: NSError) => void | null): void;

  reloadWithChanges(changes: CNScriptChanges | null): void;

  changes(): CNScriptChanges;

  changesTrimmedByTimeRange(timeRange: CMTimeRange): CNScriptChanges;

  readonly timeRange: CMTimeRange;

  frameAtTimeTolerance(time: CMTime, tolerance: CMTime): CNScriptFrame;

  framesInTimeRange(timeRange: CMTimeRange): NSArray;

  decisionAtTimeTolerance(time: CMTime, tolerance: CMTime): CNDecision;

  decisionsInTimeRange(timeRange: CMTimeRange): NSArray;

  decisionAfterTime(time: CMTime): CNDecision;

  decisionBeforeTime(time: CMTime): CNDecision;

  primaryDecisionAtTime(time: CMTime): CNDecision;

  secondaryDecisionAtTime(time: CMTime): CNDecision;

  timeRangeOfTransitionAfterDecision(decision: CNDecision): CMTimeRange;

  timeRangeOfTransitionBeforeDecision(decision: CNDecision): CMTimeRange;

  userDecisionsInTimeRange(timeRange: CMTimeRange): NSArray;

  baseDecisionsInTimeRange(timeRange: CMTimeRange): NSArray;

  detectionTrackForID(detectionID: number): CNDetectionTrack;

  detectionTrackForDecision(decision: CNDecision): CNDetectionTrack;

  fNumber: number;

  addUserDecision(decision: CNDecision): boolean;

  removeUserDecision(decision: CNDecision): boolean;

  removeAllUserDecisions(): void;

  addDetectionTrack(detectionTrack: CNDetectionTrack): number;

  removeDetectionTrack(detectionTrack: CNDetectionTrack): boolean;

  readonly addedDetectionTracks: NSArray;
}

declare class CNFixedDetectionTrack extends CNDetectionTrack {
  initWithFocusDisparity(focusDisparity: number): this;

  initWithOriginalDetection(originalDetection: CNDetection): this;

  readonly focusDisparity: number;

  readonly originalDetection: CNDetection;
}

declare class CNDetectionTrack extends NSObject implements NSCopying {
  readonly detectionType: interop.Enum<typeof CNDetectionType>;

  readonly detectionID: number;

  readonly detectionGroupID: number;

  readonly userCreated: boolean;

  readonly discrete: boolean;

  detectionAtOrBeforeTime(time: CMTime): CNDetection;

  detectionNearestTime(time: CMTime): CNDetection;

  detectionsInTimeRange(timeRange: CMTimeRange): NSArray;

  isUserCreated(): boolean;

  isDiscrete(): boolean;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

declare class CNDecision extends NSObject implements NSCopying {
  initWithTimeDetectionIDStrong(time: CMTime, detectionID: number, isStrong: boolean): this;

  initWithTimeDetectionGroupIDStrong(time: CMTime, detectionGroupID: number, isStrong: boolean): this;

  readonly time: CMTime;

  readonly detectionID: number;

  readonly detectionGroupID: number;

  readonly userDecision: boolean;

  readonly groupDecision: boolean;

  readonly strongDecision: boolean;

  isUserDecision(): boolean;

  isGroupDecision(): boolean;

  isStrongDecision(): boolean;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

declare class CNImageRenderingSession extends NSObject {
  readonly configuration: CNImageRenderingSessionConfiguration;

  initWithConfiguration(configuration: CNImageRenderingSessionConfiguration): this;

  encodeRenderToCommandBufferSourceRGBASourceDisparityDestinationRGBAFNumberFocusDisparity(commandBuffer: MTLCommandBuffer, sourceRGBA: MTLTexture, sourceDisparity: MTLTexture, destinationRGBA: MTLTexture, fNumber: number, focusDisparity: number): boolean;

  encodeTileRenderToCommandBufferSourceTileRGBASourceDisparityDestinationTileRGBAFNumberFocusDisparitySourceRGBASizeTileOffsetTileExtendOffset(commandBuffer: MTLCommandBuffer, sourceTileRGBA: MTLTexture, sourceDisparity: MTLTexture, destinationTileRGBA: MTLTexture, fNumber: number, focusDisparity: number, sourceRGBASize: CGSize, tileOffset: CGPoint, tileExtendOffset: CGPoint): boolean;

  static minimumTileExtendRectForTileRectSourceRGBASize(tileRect: CGRect, sourceRGBASize: CGSize): CGRect;
}

declare class CNImageRenderingSessionConfiguration extends NSObject {
  initWithQuality(quality: interop.Enum<typeof CNRenderingQuality>): this;

  initWithQualityRenderingVersion(quality: interop.Enum<typeof CNRenderingQuality>, renderingVersion: number): this;

  readonly quality: interop.Enum<typeof CNRenderingQuality>;

  readonly renderingVersion: number;

  static readonly latestRenderingVersion: number;

  static isRenderingVersionSupported(renderingVersion: number): boolean;
}

declare class CNRenderingSessionFrameAttributes extends NSObject implements NSCopying, NSMutableCopying {
  initWithSampleBufferSessionAttributes(sampleBuffer: interop.Object, sessionAttributes: CNRenderingSessionAttributes): this;

  initWithTimedMetadataGroupSessionAttributes(metadataGroup: AVTimedMetadataGroup, sessionAttributes: CNRenderingSessionAttributes): this;

  focusDisparity: number;

  fNumber: number;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  mutableCopyWithZone(zone: interop.PointerConvertible): interop.Object;
}

declare class CNRenderingSessionAttributes extends NSObject {
  static loadFromAssetCompletionHandler(asset: AVAsset, completionHandler: (p1: CNRenderingSessionAttributes, p2: NSError) => void | null): void;

  readonly renderingVersion: number;
}

declare class CNCompositionInfo extends CNAssetInfo {
  insertTimeRangeOfCinematicAssetInfoAtTimeError(timeRange: CMTimeRange, assetInfo: CNAssetInfo, startTime: CMTime, outError: interop.PointerConvertible): boolean;
}

declare class CNScriptFrame extends NSObject implements NSCopying {
  readonly time: CMTime;

  readonly focusDisparity: number;

  readonly focusDetection: CNDetection;

  readonly allDetections: NSArray;

  detectionForID(detectionID: number): CNDetection;

  bestDetectionForGroupID(detectionGroupID: number): CNDetection;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

declare class CNAssetSpatialAudioInfo extends NSObject {
  static readonly isSupported: boolean;

  static checkIfContainsSpatialAudioCompletionHandler(asset: AVAsset, completionHandler: (p1: boolean) => void): void;

  static loadFromAssetCompletionHandler(asset: AVAsset, completionHandler: (p1: CNAssetSpatialAudioInfo, p2: NSError) => void | null): void;

  readonly defaultSpatialAudioTrack: AVAssetTrack;

  readonly defaultEffectIntensity: number;

  readonly defaultRenderingStyle: interop.Enum<typeof CNSpatialAudioRenderingStyle>;

  readonly spatialAudioMixMetadata: NSData;

  audioMixWithEffectIntensityRenderingStyle(effectIntensity: number, renderingStyle: interop.Enum<typeof CNSpatialAudioRenderingStyle>): AVAudioMix;

  assetReaderOutputSettingsForContentType(contentType: interop.Enum<typeof CNSpatialAudioContentType>): NSDictionary;

  assetWriterInputSettingsForContentType(contentType: interop.Enum<typeof CNSpatialAudioContentType>): NSDictionary;
}

declare class CNAssetInfo extends NSObject {
  static checkCinematicCapabilityForAssetCompletionHandler(asset: AVAsset, completionHandler: (p1: interop.Enum<typeof CNCinematicCapability>) => void): void;

  static checkIfCinematicCompletionHandler(asset: AVAsset, completionHandler: (p1: boolean) => void): void;

  static loadFromAssetCompletionHandler(asset: AVAsset, completionHandler: (p1: CNAssetInfo, p2: NSError) => void | null): void;

  readonly asset: AVAsset;

  readonly allCinematicTracks: NSArray;

  readonly cinematicVideoTrack: AVAssetTrack;

  readonly cinematicDisparityTrack: AVAssetTrack;

  readonly cinematicMetadataTrack: AVAssetTrack;

  readonly timeRange: CMTimeRange;

  readonly naturalSize: CGSize;

  readonly preferredSize: CGSize;

  readonly preferredTransform: CGAffineTransform;

  readonly frameTimingTrack: AVAssetTrack;

  readonly videoCompositionTracks: NSArray;

  readonly videoCompositionTrackIDs: NSArray;

  readonly sampleDataTrackIDs: NSArray;

  static resourceStatusForVersions(resourceVersions: NSSet): interop.Enum<typeof CNResourceStatus>;

  static downloadResourcesForVersionsTimeoutCompletionHandler(resourceVersions: NSSet, downloadTimeout: number, completionHandler: (p1: NSError) => void | null): NSProgress;

  downloadResourcesWithTimeoutCompletionHandler(downloadTimeout: number, completionHandler: (p1: CNAssetInfo, p2: NSError) => void | null): NSProgress;

  preprocessAssetWithConfigurationCompletionHandler(configuration: CNAssetPreprocessConfiguration, completionHandler: (p1: CNAssetInfo, p2: NSError) => void | null): NSProgress;

  static readonly defaultResourceDownloadTimeout: number;

  readonly preprocessed: boolean;

  readonly cinematicCapability: interop.Enum<typeof CNCinematicCapability>;

  readonly resourceStatus: interop.Enum<typeof CNResourceStatus>;

  isPreprocessed(): boolean;
}

declare class CNCustomDetectionTrack extends CNDetectionTrack {
  initWithDetectionsSmooth(detections: NSArray<interop.Object> | Array<interop.Object>, applySmoothing: boolean): this;

  readonly allDetections: NSArray;
}

declare class CNDetection extends NSObject implements NSCopying {
  initWithTimeDetectionTypeNormalizedRectFocusDisparity(time: CMTime, detectionType: interop.Enum<typeof CNDetectionType>, normalizedRect: CGRect, focusDisparity: number): this;

  readonly time: CMTime;

  readonly detectionType: interop.Enum<typeof CNDetectionType>;

  readonly normalizedRect: CGRect;

  readonly focusDisparity: number;

  readonly detectionID: number;

  readonly detectionGroupID: number;

  static isValidDetectionID(detectionID: number): boolean;

  static isValidDetectionGroupID(detectionGroupID: number): boolean;

  static accessibilityLabelForDetectionType(detectionType: interop.Enum<typeof CNDetectionType>): string;

  static disparityInNormalizedRectSourceDisparityDetectionTypePriorDisparity(normalizedRect: CGRect, sourceDisparity: interop.Object, detectionType: interop.Enum<typeof CNDetectionType>, priorDisparity: number): number;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

declare class CNAssetPreprocessConfiguration extends NSObject {
  initWithDestinationAssetURL(destinationAssetURL: NSURL): this;

  referenceSourceAssetTracks: boolean;

  readonly destinationAssetURL: NSURL;
}

declare class CNRenderingSession extends NSObject {
  initWithCommandQueueSessionAttributesPreferredTransformQuality(commandQueue: MTLCommandQueue, sessionAttributes: CNRenderingSessionAttributes, preferredTransform: CGAffineTransform, quality: interop.Enum<typeof CNRenderingQuality>): this;

  readonly commandQueue: MTLCommandQueue;

  readonly sessionAttributes: CNRenderingSessionAttributes;

  readonly preferredTransform: CGAffineTransform;

  readonly quality: interop.Enum<typeof CNRenderingQuality>;

  encodeRenderToCommandBufferFrameAttributesSourceImageSourceDisparityDestinationImage(commandBuffer: MTLCommandBuffer, frameAttributes: CNRenderingSessionFrameAttributes, sourceImage: interop.Object, sourceDisparity: interop.Object | null, destinationImage: interop.Object): boolean;

  encodeRenderToCommandBufferFrameAttributesSourceImageSourceDisparityDestinationRGBA(commandBuffer: MTLCommandBuffer, frameAttributes: CNRenderingSessionFrameAttributes, sourceImage: interop.Object, sourceDisparity: interop.Object | null, destinationRGBA: MTLTexture): boolean;

  encodeRenderToCommandBufferFrameAttributesSourceImageSourceDisparityDestinationLumaDestinationChroma(commandBuffer: MTLCommandBuffer, frameAttributes: CNRenderingSessionFrameAttributes, sourceImage: interop.Object, sourceDisparity: interop.Object | null, destinationLuma: MTLTexture, destinationChroma: MTLTexture): boolean;

  static readonly sourcePixelFormatTypes: NSArray;

  static readonly destinationPixelFormatTypes: NSArray;
}

declare class CNScriptChanges extends NSObject {
  initWithDataRepresentation(dataRepresentation: NSData): this;

  readonly dataRepresentation: NSData;

  readonly fNumber: number;

  readonly userDecisions: NSArray;

  readonly addedDetectionTracks: NSArray;
}

