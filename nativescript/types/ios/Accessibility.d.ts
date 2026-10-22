/// <reference types="@nativescript/objc-node-api" />
/// <reference path="./Runtime.d.ts" />

declare const AXApplicationAccessibilityEnabledDidChangeNotification: string;

declare const AXShowBordersEnabledStatusDidChangeNotification: string;

declare const AXPrefersActionSliderAlternativeDidChangeNotification: string;

declare const AXPrefersHorizontalTextLayoutDidChangeNotification: string;

declare const AXTechnologyZoom: string;

declare const AXTechnologyAutomation: string;

declare const AXTechnologySpeakScreen: string;

declare const AXTechnologyFullKeyboardAccess: string;

declare const AXTechnologyVoiceControl: string;

declare const AXTechnologyVoiceOver: string;

declare const AXMFiHearingDeviceStreamingEarDidChangeNotification: string;

declare const AXSpeechAttributeSSML: string;

declare const AXTechnologySwitchControl: string;

declare const AXTechnologyHoverText: string;

declare const AXAnimatedImagesEnabledDidChangeNotification: string;

declare const AXFeatureOverrideSessionErrorDomain: string;

declare const AXMFiHearingDevicePairedUUIDsDidChangeNotification: string;

declare const AXPrefersNonBlinkingTextInsertionIndicatorDidChangeNotification: string;

declare const AXReduceHighlightingEffectsEnabledDidChangeNotification: string;

declare const AXCustomContentImportance: {
  Default: 0,
  High: 1,
};

declare const AXChartDescriptorContentDirection: {
  LeftToRight: 0,
  RightToLeft: 1,
  TopToBottom: 2,
  BottomToTop: 3,
  RadialClockwise: 4,
  RadialCounterClockwise: 5,
};

declare const AXNumericDataAxisDescriptorScale: {
  Linear: 0,
  Log10: 1,
  Ln: 2,
};

declare const AXHearingDeviceEar: {
  None: 0,
  Left: 2,
  Right: 4,
  Both: 6,
};

declare const AXFeatureOverrideSessionOptions: {
  Grayscale: 1,
  InvertColors: 2,
  VoiceControl: 4,
  VoiceOver: 8,
  Zoom: 16,
};

declare const AXSettingsFeature: {
  PersonalVoiceAllowAppsToRequestToUse: 1,
  AllowAppsToAddAudioToCalls: 2,
  AssistiveTouch: 3,
  AssistiveTouchDevices: 4,
  DwellControl: 5,
  CaptionStyles: 6,
};

declare const AXFeatureOverrideSessionError: {
  Undefined: 0,
  AppNotEntitled: 1,
  OverrideIsAlreadyActive: 2,
  OverrideNotFoundForUUID: 3,
};

declare function AXNameFromColor(color: interop.Object): string;

declare function AXMFiHearingDeviceStreamingEar(): interop.Enum<typeof AXHearingDeviceEar>;

declare function AXSupportsBidirectionalAXMFiHearingDeviceStreaming(): boolean;

declare function AXMFiHearingDevicePairedUUIDs(): NSArray;

declare function AXPrefersHorizontalTextLayout(): boolean;

declare function AXAnimatedImagesEnabled(): boolean;

declare function AXAssistiveAccessEnabled(): boolean;

declare function AXPrefersNonBlinkingTextInsertionIndicator(): boolean;

declare function AXPrefersActionSliderAlternative(): boolean;

declare function AXShowBordersEnabled(): boolean;

declare function AXReduceHighlightingEffectsEnabled(): boolean;

declare function AXApplicationAccessibilityEnabled(): boolean;

declare function AXOpenSettingsFeature(feature: interop.Enum<typeof AXSettingsFeature>, completionHandler: (p1: NSError) => void): void;

declare function AXOpenSettingsFeatureIsSupported(feature: interop.Enum<typeof AXSettingsFeature>): number;

declare interface AXMathExpressionProvider extends NSObjectProtocol {
  accessibilityMathExpression(): AXMathExpression;
}

declare class AXMathExpressionProvider extends NativeObject implements AXMathExpressionProvider {
}

declare interface AXChart extends NSObjectProtocol {
  accessibilityChartDescriptor: AXChartDescriptor;
}

declare class AXChart extends NativeObject implements AXChart {
}

declare interface AXBrailleMapRenderer extends NSObjectProtocol {
  accessibilityBrailleMapRenderRegion?: CGRect;

  accessibilityBrailleMapRenderer?: (p1: AXBrailleMap) => void;
}

declare class AXBrailleMapRenderer extends NativeObject implements AXBrailleMapRenderer {
}

declare interface AXCustomContentProvider extends NSObjectProtocol {
  get accessibilityCustomContent(): NSArray;
  set accessibilityCustomContent(value: NSArray<interop.Object> | Array<interop.Object>);

  accessibilityCustomContentBlock?: () => NSArray;
}

declare class AXCustomContentProvider extends NativeObject implements AXCustomContentProvider {
}

declare interface AXDataAxisDescriptor extends NSCopying {
  title: string;

  attributedTitle: NSAttributedString;
}

declare class AXDataAxisDescriptor extends NativeObject implements AXDataAxisDescriptor {
}

declare class AXBrailleTranslator extends NSObject {
  initWithBrailleTable(brailleTable: AXBrailleTable): this;

  translatePrintText(printText: string): AXBrailleTranslationResult;

  backTranslateBraille(braille: string): AXBrailleTranslationResult;
}

declare class AXBrailleTranslationResult extends NSObject implements NSCopying, NSCoding {
  readonly resultString: string;

  readonly locationMap: NSArray;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class AXMathExpressionRoot extends AXMathExpression {
  initWithRadicandExpressionsRootIndexExpression(radicandExpressions: NSArray<interop.Object> | Array<interop.Object>, rootIndexExpression: AXMathExpression): this;

  readonly radicandExpressions: NSArray;

  readonly rootIndexExpression: AXMathExpression;
}

declare class AXMathExpressionMultiscript extends AXMathExpression {
  initWithBaseExpressionPrescriptExpressionsPostscriptExpressions(baseExpression: AXMathExpression, prescriptExpressions: NSArray<interop.Object> | Array<interop.Object>, postscriptExpressions: NSArray<interop.Object> | Array<interop.Object>): this;

  readonly baseExpression: AXMathExpression;

  readonly prescriptExpressions: NSArray;

  readonly postscriptExpressions: NSArray;
}

declare class AXMathExpressionUnderOver extends AXMathExpression {
  initWithBaseExpressionUnderExpressionOverExpression(baseExpression: AXMathExpression, underExpression: AXMathExpression, overExpression: AXMathExpression): this;

  readonly baseExpression: AXMathExpression;

  readonly underExpression: AXMathExpression;

  readonly overExpression: AXMathExpression;
}

declare class AXMathExpressionTableCell extends AXMathExpression {
  initWithExpressions(expressions: NSArray<interop.Object> | Array<interop.Object>): this;

  readonly expressions: NSArray;
}

declare class AXMathExpressionTableRow extends AXMathExpression {
  initWithExpressions(expressions: NSArray<interop.Object> | Array<interop.Object>): this;

  readonly expressions: NSArray;
}

declare class AXMathExpressionOperator extends AXMathExpression {
  initWithContent(content: string): this;

  readonly content: string;
}

declare class AXMathExpressionIdentifier extends AXMathExpression {
  initWithContent(content: string): this;

  readonly content: string;
}

declare class AXRequest extends NSObject implements NSCopying, NSSecureCoding {
  static readonly currentRequest: AXRequest;

  readonly technology: string;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class AXBrailleMap extends NSObject implements NSCopying, NSSecureCoding {
  readonly dimensions: CGSize;

  setHeightAtPoint(status: number, point: CGPoint): void;

  heightAtPoint(point: CGPoint): number;

  presentImage(image: interop.Object): void;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class AXDataPointValue extends NSObject implements NSCopying {
  number: number;

  category: string;

  static valueWithNumber<This extends abstract new (...args: any) => any>(this: This, number: number): InstanceType<This>;

  static valueWithCategory<This extends abstract new (...args: any) => any>(this: This, category: string): InstanceType<This>;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

declare class AXMathExpressionFraction extends AXMathExpression {
  initWithNumeratorExpressionDenimonatorExpression(numeratorExpression: AXMathExpression, denimonatorExpression: AXMathExpression): this;

  readonly numeratorExpression: AXMathExpression;

  readonly denimonatorExpression: AXMathExpression;
}

declare class AXLiveAudioGraph extends NSObject {
  static start(): void;

  static updateValue(value: number): void;

  static stop(): void;
}

declare class AXMathExpressionSubSuperscript extends AXMathExpression {
  initWithBaseExpressionSubscriptExpressionsSuperscriptExpressions(baseExpression: NSArray<interop.Object> | Array<interop.Object>, subscriptExpressions: NSArray<interop.Object> | Array<interop.Object>, superscriptExpressions: NSArray<interop.Object> | Array<interop.Object>): this;

  readonly baseExpression: AXMathExpression;

  readonly subscriptExpressions: NSArray;

  readonly superscriptExpressions: NSArray;
}

declare class AXNumericDataAxisDescriptor extends NSObject implements AXDataAxisDescriptor {
  scaleType: interop.Enum<typeof AXNumericDataAxisDescriptorScale>;

  lowerBound: number;

  upperBound: number;

  valueDescriptionProvider: (p1: number) => string;

  get gridlinePositions(): NSArray;
  set gridlinePositions(value: NSArray<interop.Object> | Array<interop.Object>);

  initWithTitleLowerBoundUpperBoundGridlinePositionsValueDescriptionProvider(title: string, lowerbound: number, upperBound: number, gridlinePositions: NSArray<interop.Object> | Array<interop.Object> | null, valueDescriptionProvider: (p1: number) => string): this;

  initWithAttributedTitleLowerBoundUpperBoundGridlinePositionsValueDescriptionProvider(attributedTitle: NSAttributedString, lowerbound: number, upperBound: number, gridlinePositions: NSArray<interop.Object> | Array<interop.Object> | null, valueDescriptionProvider: (p1: number) => string): this;

  title: string;

  attributedTitle: NSAttributedString;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

declare class AXMathExpressionText extends AXMathExpression {
  initWithContent(content: string): this;

  readonly content: string;
}

declare class AXBrailleTable extends NSObject implements NSCopying, NSCoding {
  readonly identifier: string;

  readonly localizedName: string;

  readonly providerIdentifier: string;

  readonly localizedProviderName: string;

  readonly language: string;

  readonly locales: NSSet;

  readonly isEightDot: boolean;

  static supportedLocales(): NSSet;

  static defaultTableForLocale(locale: NSLocale): AXBrailleTable;

  static tablesForLocale(locale: NSLocale): NSSet;

  static languageAgnosticTables(): NSSet;

  initWithIdentifier(identifier: string): this;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class AXCategoricalDataAxisDescriptor extends NSObject implements AXDataAxisDescriptor {
  get categoryOrder(): NSArray;
  set categoryOrder(value: NSArray<interop.Object> | Array<interop.Object>);

  initWithTitleCategoryOrder(title: string, categoryOrder: NSArray<interop.Object> | Array<interop.Object>): this;

  initWithAttributedTitleCategoryOrder(attributedTitle: NSAttributedString, categoryOrder: NSArray<interop.Object> | Array<interop.Object>): this;

  title: string;

  attributedTitle: NSAttributedString;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

declare class AXFeatureOverrideSessionManager extends NSObject {
  static readonly sharedInstance: AXFeatureOverrideSessionManager;

  beginOverrideSessionEnablingOptionsDisablingOptionsError(enableOptions: interop.Enum<typeof AXFeatureOverrideSessionOptions>, disableOptions: interop.Enum<typeof AXFeatureOverrideSessionOptions>, error: interop.PointerConvertible): AXFeatureOverrideSession;

  endOverrideSessionError(session: AXFeatureOverrideSession, error: interop.PointerConvertible): boolean;
}

declare class AXMathExpressionNumber extends AXMathExpression {
  initWithContent(content: string): this;

  readonly content: string;
}

declare class AXMathExpressionRow extends AXMathExpression {
  initWithExpressions(expressions: NSArray<interop.Object> | Array<interop.Object>): this;

  readonly expressions: NSArray;
}

declare class AXDataSeriesDescriptor extends NSObject implements NSCopying {
  name: string;

  attributedName: NSAttributedString;

  isContinuous: boolean;

  get dataPoints(): NSArray;
  set dataPoints(value: NSArray<interop.Object> | Array<interop.Object>);

  initWithNameIsContinuousDataPoints(name: string, isContinuous: boolean, dataPoints: NSArray<interop.Object> | Array<interop.Object>): this;

  initWithAttributedNameIsContinuousDataPoints(attributedName: NSAttributedString, isContinuous: boolean, dataPoints: NSArray<interop.Object> | Array<interop.Object>): this;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

declare class AXMathExpressionTable extends AXMathExpression {
  initWithExpressions(expressions: NSArray<interop.Object> | Array<interop.Object>): this;

  readonly expressions: NSArray;
}

declare class AXDataPoint extends NSObject implements NSCopying {
  xValue: AXDataPointValue;

  yValue: AXDataPointValue;

  get additionalValues(): NSArray;
  set additionalValues(value: NSArray<interop.Object> | Array<interop.Object>);

  label: string;

  attributedLabel: NSAttributedString;

  initWithXY(xValue: AXDataPointValue, yValue: AXDataPointValue | null): this;

  initWithXYAdditionalValues(xValue: AXDataPointValue, yValue: AXDataPointValue | null, additionalValues: NSArray<interop.Object> | Array<interop.Object> | null): this;

  initWithXYAdditionalValuesLabel(xValue: AXDataPointValue, yValue: AXDataPointValue | null, additionalValues: NSArray<interop.Object> | Array<interop.Object> | null, label: string | null): this;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

declare class AXFeatureOverrideSession extends NSObject {
}

declare class AXChartDescriptor extends NSObject implements NSCopying {
  title: string;

  attributedTitle: NSAttributedString;

  summary: string;

  contentDirection: interop.Enum<typeof AXChartDescriptorContentDirection>;

  contentFrame: CGRect;

  get series(): NSArray;
  set series(value: NSArray<interop.Object> | Array<interop.Object>);

  xAxis: AXDataAxisDescriptor;

  yAxis: AXNumericDataAxisDescriptor;

  get additionalAxes(): NSArray;
  set additionalAxes(value: NSArray<interop.Object> | Array<interop.Object>);

  initWithTitleSummaryXAxisDescriptorYAxisDescriptorSeries(title: string | null, summary: string | null, xAxis: AXDataAxisDescriptor, yAxis: AXNumericDataAxisDescriptor | null, series: NSArray<interop.Object> | Array<interop.Object>): this;

  initWithAttributedTitleSummaryXAxisDescriptorYAxisDescriptorSeries(attributedTitle: NSAttributedString | null, summary: string | null, xAxis: AXDataAxisDescriptor, yAxis: AXNumericDataAxisDescriptor, series: NSArray<interop.Object> | Array<interop.Object>): this;

  initWithTitleSummaryXAxisDescriptorYAxisDescriptorAdditionalAxesSeries(title: string | null, summary: string | null, xAxis: AXDataAxisDescriptor, yAxis: AXNumericDataAxisDescriptor | null, additionalAxes: NSArray<interop.Object> | Array<interop.Object> | null, series: NSArray<interop.Object> | Array<interop.Object>): this;

  initWithAttributedTitleSummaryXAxisDescriptorYAxisDescriptorAdditionalAxesSeries(attributedTitle: NSAttributedString | null, summary: string | null, xAxis: AXDataAxisDescriptor, yAxis: AXNumericDataAxisDescriptor | null, additionalAxes: NSArray<interop.Object> | Array<interop.Object> | null, series: NSArray<interop.Object> | Array<interop.Object>): this;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

declare class AXMathExpression extends NSObject {
}

declare class AXMathExpressionFenced extends AXMathExpression {
  initWithExpressionsOpenStringCloseString(expressions: NSArray<interop.Object> | Array<interop.Object>, openString: string, closeString: string): this;

  readonly expressions: NSArray;

  readonly openString: string;

  readonly closeString: string;
}

declare class AXCustomContent extends NSObject implements NSCopying, NSSecureCoding {
  static customContentWithLabelValue<This extends abstract new (...args: any) => any>(this: This, label: string, value: string): InstanceType<This>;

  static customContentWithAttributedLabelAttributedValue<This extends abstract new (...args: any) => any>(this: This, label: NSAttributedString, value: NSAttributedString): InstanceType<This>;

  readonly label: string;

  readonly attributedLabel: NSAttributedString;

  readonly value: string;

  readonly attributedValue: NSAttributedString;

  importance: interop.Enum<typeof AXCustomContentImportance>;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

