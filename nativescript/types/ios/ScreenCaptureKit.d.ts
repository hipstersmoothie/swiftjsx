/// <reference types="@nativescript/objc-node-api" />
/// <reference path="./Runtime.d.ts" />

declare const SCStreamFrameInfoVideoOrientation: string;

declare const SCStreamFrameInfoContentRect: string;

declare const SCStreamFrameInfoContentScale: string;

declare const SCStreamFrameInfoScreenRect: string;

declare const SCStreamFrameInfoDisplayTime: string;

declare const SCStreamFrameInfoStatus: string;

declare const SCStreamFrameInfoScaleFactor: string;

declare const SCStreamConfigurationPreset: {
  SCStreamConfigurationPresetCaptureHDRRecordingPreservedSDRHDR10: 4,
};

declare const SCFrameStatus: {
  Complete: 0,
  Idle: 1,
  Blank: 2,
  Suspended: 3,
  Started: 4,
  Stopped: 5,
};

declare const SCStreamOutputType: {
  Screen: 0,
  Audio: 1,
  Microphone: 2,
};

declare const SCCaptureDynamicRange: {
  SDR: 0,
  HDRCanonicalDisplay: 2,
};

declare const SCStreamErrorCode: {
  UserDeclined: -3801,
  FailedToStart: -3802,
  MissingEntitlements: -3803,
  FailedApplicationConnectionInvalid: -3804,
  FailedApplicationConnectionInterrupted: -3805,
  FailedNoMatchingApplicationContext: -3806,
  AttemptToStartStreamState: -3807,
  AttemptToStopStreamState: -3808,
  AttemptToUpdateFilterState: -3809,
  AttemptToConfigState: -3810,
  InternalError: -3811,
  InvalidParameter: -3812,
  NoWindowList: -3813,
  NoDisplayList: -3814,
  NoCaptureSource: -3815,
  RemovingStream: -3816,
  UserStopped: -3817,
  FailedToStartAudioCapture: -3818,
  FailedToStopAudioCapture: -3819,
  FailedToStartMicrophoneCapture: -3820,
  SystemStoppedStream: -3821,
  InsufficientStorage: -3822,
  NotSupported: -3823,
  MissingBackgroundMode: -3824,
};

declare const SCScreenshotDynamicRange: {
  S: 0,
  H: 1,
  SDRAndH: 2,
};

declare const SCShareableContentStyle: {
  None: 0,
  Window: 1,
  Display: 2,
};

declare const SCScreenshotDisplayIntent: {
  Canonical: 0,
  Local: 1,
};

declare interface SCRecordingEditorDelegate extends NSObjectProtocol {
  recordingEditorDidDismiss?(editor: SCRecordingEditor): void;

  recordingEditorDidFailWithError?(editor: SCRecordingEditor, error: NSError): void;
}

declare class SCRecordingEditorDelegate extends NativeObject implements SCRecordingEditorDelegate {
}

declare interface SCStreamDelegate extends NSObjectProtocol {
  streamDidStopWithError?(stream: SCStream, error: NSError): void;

  outputVideoEffectDidStartForStream?(stream: SCStream): void;

  outputVideoEffectDidStopForStream?(stream: SCStream): void;

  outputVideoEffectDidFailForStreamWithError?(stream: SCStream, error: NSError): void;

  streamDidBecomeActive?(stream: SCStream): void;

  streamDidBecomeInactive?(stream: SCStream): void;
}

declare class SCStreamDelegate extends NativeObject implements SCStreamDelegate {
}

declare interface SCStreamOutput extends NSObjectProtocol {
  streamDidOutputSampleBufferOfType?(stream: SCStream, sampleBuffer: interop.Object, type: interop.Enum<typeof SCStreamOutputType>): void;
}

declare class SCStreamOutput extends NativeObject implements SCStreamOutput {
}

declare interface SCClipBufferingOutputDelegate extends NSObjectProtocol {
  clipBufferingOutputDidStartBuffering?(clipBufferingOutput: SCClipBufferingOutput): void;

  clipBufferingOutputDidFailWithError?(clipBufferingOutput: SCClipBufferingOutput, error: NSError): void;

  clipBufferingOutputDidStopBuffering?(clipBufferingOutput: SCClipBufferingOutput): void;
}

declare class SCClipBufferingOutputDelegate extends NativeObject implements SCClipBufferingOutputDelegate {
}

declare interface SCRecordingOutputDelegate extends NSObjectProtocol {
  recordingOutputDidStartRecording?(recordingOutput: SCRecordingOutput): void;

  recordingOutputDidFailWithError?(recordingOutput: SCRecordingOutput, error: NSError): void;

  recordingOutputDidFinishRecording?(recordingOutput: SCRecordingOutput): void;
}

declare class SCRecordingOutputDelegate extends NativeObject implements SCRecordingOutputDelegate {
}

declare interface SCContentSharingPickerObserver extends NSObjectProtocol {
  contentSharingPickerDidCancelForStream(picker: SCContentSharingPicker, stream: SCStream | null): void;

  contentSharingPickerDidUpdateWithFilterForStream(picker: SCContentSharingPicker, filter: SCContentFilter, stream: SCStream | null): void;

  contentSharingPickerStartDidFailWithError(error: NSError): void;
}

declare class SCContentSharingPickerObserver extends NativeObject implements SCContentSharingPickerObserver {
}

declare class SCStreamConfiguration extends NSObject {
  width: number;

  height: number;

  capturesAudio: boolean;

  sampleRate: number;

  channelCount: number;

  excludesCurrentProcessAudio: boolean;

  captureDynamicRange: interop.Enum<typeof SCCaptureDynamicRange>;

  static streamConfigurationWithPreset<This extends abstract new (...args: any) => any>(this: This, preset: interop.Enum<typeof SCStreamConfigurationPreset>): InstanceType<This>;
}

declare class SCClipBufferingOutput extends NSObject {
  initWithDelegate(delegate: SCClipBufferingOutputDelegate | null): this;

  exportClipToURLDurationCompletionHandler(url: NSURL, duration: number, completionHandler: (p1: NSError) => void | null): void;
}

declare class SCVideoEffectOutput extends NSObject {
  initWithCameraDevice(device: AVCaptureDevice): this;

  cameraDevice: AVCaptureDevice;
}

declare class SCContentSharingPicker extends NSObject {
  static readonly sharedPicker: SCContentSharingPicker;

  defaultConfiguration: SCContentSharingPickerConfiguration;

  active: boolean;

  readonly available: boolean;

  addObserver(observer: SCContentSharingPickerObserver): void;

  removeObserver(observer: SCContentSharingPickerObserver): void;

  setConfigurationForStream(pickerConfig: SCContentSharingPickerConfiguration | null, stream: SCStream): void;

  present(): void;

  presentPickerUsingContentStyle(contentStyle: interop.Enum<typeof SCShareableContentStyle>): void;

  presentPickerForCurrentApplication(): void;

  isActive(): boolean;

  isAvailable(): boolean;
}

declare class SCContentSharingPickerConfiguration<NSCopying = interop.Object> extends NSObject {
  showsMicrophoneControl: boolean;

  showsCameraControl: boolean;
}

declare class SCRecordingEditor extends NSObject {
  initWithURL(url: NSURL): this;

  delegate: SCRecordingEditorDelegate;

  presentFromWindowSceneCompletionHandler(windowScene: UIWindowScene, completionHandler: (p1: NSError) => void | null): void;
}

declare class SCRecordingOutputConfiguration extends NSObject {
  outputURL: NSURL;

  videoCodecType: string;

  outputFileType: string;

  readonly availableVideoCodecTypes: NSArray;

  readonly availableOutputFileTypes: NSArray;

  mixesAudioWithMicrophone: boolean;
}

declare class SCContentFilter extends NSObject {
  readonly style: interop.Enum<typeof SCShareableContentStyle>;

  readonly pointPixelScale: number;

  readonly contentRect: CGRect;

  readonly microphoneEnabled: boolean;

  readonly cameraEnabled: boolean;

  isMicrophoneEnabled(): boolean;

  isCameraEnabled(): boolean;
}

declare class SCStream extends NSObject {
  readonly synchronizationClock: interop.Object;

  readonly capturing: boolean;

  initWithFilterConfigurationDelegate(contentFilter: SCContentFilter, streamConfig: SCStreamConfiguration, delegate: SCStreamDelegate | null): this;

  addStreamOutputTypeSampleHandlerQueueError(output: SCStreamOutput, type: interop.Enum<typeof SCStreamOutputType>, sampleHandlerQueue: NSObject | null, error: interop.PointerConvertible): boolean;

  removeStreamOutputTypeError(output: SCStreamOutput, type: interop.Enum<typeof SCStreamOutputType>, error: interop.PointerConvertible): boolean;

  startCaptureWithCompletionHandler(completionHandler: (p1: NSError) => void | null): void;

  stopCaptureWithCompletionHandler(completionHandler: (p1: NSError) => void | null): void;

  addRecordingOutputError(recordingOutput: SCRecordingOutput, error: interop.PointerConvertible): boolean;

  removeRecordingOutputError(recordingOutput: SCRecordingOutput, error: interop.PointerConvertible): boolean;

  addClipBufferingOutputError(clipBufferingOutput: SCClipBufferingOutput, error: interop.PointerConvertible): boolean;

  removeClipBufferingOutputError(clipBufferingOutput: SCClipBufferingOutput, error: interop.PointerConvertible): boolean;

  addVideoEffectOutputError(videoEffectOutput: SCVideoEffectOutput, error: interop.PointerConvertible): boolean;

  removeVideoEffectOutputError(videoEffectOutput: SCVideoEffectOutput, error: interop.PointerConvertible): boolean;

  isCapturing(): boolean;
}

declare class SCRecordingOutput extends NSObject {
  readonly recordedDuration: CMTime;

  readonly recordedFileSize: number;

  initWithConfigurationDelegate(recordingOutputConfiguration: SCRecordingOutputConfiguration, delegate: SCRecordingOutputDelegate): this;
}

