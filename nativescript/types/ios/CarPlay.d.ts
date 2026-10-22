/// <reference types="@nativescript/objc-node-api" />
/// <reference path="./Runtime.d.ts" />
/// <reference path="./UIKit.d.ts" />

declare const CPMaximumMessageItemLeadingDetailTextImageSize: CGSize;

declare const CPMaximumMessageItemImageSize: CGSize;

declare const CPNavigationAlertMinimumDuration: number;

declare const CPMaximumNumberOfGridImages: number;

declare const CarPlayErrorDomain: string;

declare const CPTemplateApplicationDashboardSceneSessionRoleApplication: string;

declare const CPMaximumListSectionImageSize: CGSize;

declare const CPGridTemplateMaximumItems: number;

declare const CPButtonMaximumImageSize: CGSize;

declare const CPTemplateApplicationInstrumentClusterSceneSessionRoleApplication: string;

declare const CPNowPlayingButtonMaximumImageSize: CGSize;

declare const CPTemplateApplicationSceneSessionRoleApplication: string;

declare const CPMessageLeadingItem: {
  None: 0,
  Pin: 1,
  Star: 2,
};

declare const CPTripEstimateStyle: {
  Light: 0,
  Dark: 1,
};

declare const CPManeuverDisplayStyle: {
  Default: 0,
  LeadingSymbol: 1,
  TrailingSymbol: 2,
  SymbolOnly: 3,
  InstructionOnly: 4,
};

declare const CPPanDirection: {
  None: 0,
  Left: 1,
  Right: 2,
  Up: 4,
  Down: 8,
};

declare const CPRouteSource: {
  SourceInactive: 0,
  SourceiOSUnchanged: 1,
  SourceiOSRouteModified: 2,
  SourceiOSRouteDestinationsModified: 3,
  SourceiOSDestinationsOnly: 4,
  SourceVehicle: 5,
};

declare const CPNavigationAlertDismissalContext: {
  Timeout: 0,
  UserDismissed: 1,
  SystemDismissed: 2,
};

declare const CPManeuverState: {
  Continue: 0,
  Initial: 1,
  Prepare: 2,
  Execute: 3,
};

declare const CPAssistantCellVisibility: {
  Off: 0,
  WhileLimitedUIActive: 1,
  Always: 2,
};

declare const CPListImageRowItemImageGridElementShape: {
  Circular: 0,
  RoundedRectangle: 1,
};

declare const CPInstrumentClusterSetting: {
  Unspecified: 0,
  Enabled: 1,
  Disabled: 2,
  UserPreference: 3,
};

declare const CPInformationTemplateLayout: {
  Leading: 0,
  TwoColumn: 1,
};

declare const CPTextButtonStyle: {
  Normal: 0,
  Cancel: 1,
  Confirm: 2,
};

declare const CPChargingStationConnectionConnector: {
  CCS1: 0,
  CCS2: 1,
  J1772: 2,
  CHAdeMO: 3,
  Mennekes: 4,
  GBTDC: 5,
  GBTAC: 6,
  NACSDC: 7,
  NACSAC: 8,
};

declare const CPBarButtonType: {
  Text: 0,
  Image: 1,
};

declare const CPAlertActionStyle: {
  Default: 0,
  Cancel: 1,
  Destructive: 2,
};

declare const CPAssistantCellActionType: {
  PlayMedia: 0,
  StartCall: 1,
};

declare const CPImageOverlayAlignment: {
  Leading: 0,
  Center: 1,
  Trailing: 2,
};

declare const CPRerouteReason: {
  Unknown: 0,
  MissedTurn: 1,
  Offline: 2,
  AlternateRoute: 3,
  WaypointModified: 4,
  Mandated: 5,
};

declare const CPContentStyle: {
  Light: 1,
  Dark: 2,
};

declare const CPPlaybackPresentation: {
  None: 0,
  Audio: 1,
  Video: 2,
};

declare const CPLimitableUserInterface: {
  Keyboard: 1,
  Lists: 2,
};

declare const CPTimeRemainingColor: {
  Default: 0,
  Green: 1,
  Orange: 2,
  Red: 3,
};

declare const CPListItemPlayingIndicatorLocation: {
  Leading: 0,
  Trailing: 1,
};

declare const CPPlaybackAction: {
  None: 0,
  Play: 1,
  Pause: 2,
  Replay: 3,
};

declare const CPBarButtonStyle: {
  None: 0,
  Rounded: 1,
};

declare const CPAssistantCellPosition: {
  Top: 0,
  Bottom: 1,
};

declare const CPTripPauseReason: {
  Arrived: 1,
  Loading: 2,
  Locating: 3,
  Rerouting: 4,
  ProceedToRoute: 5,
};

declare const CPListImageRowItemCondensedElementShape: {
  Circular: 0,
  RoundedRectangle: 1,
};

declare const CPLaneStatus: {
  NotGood: 0,
  Good: 1,
  Preferred: 2,
};

declare const CPMessageTrailingItem: {
  None: 0,
  Mute: 1,
};

declare const CPManeuverType: {
  NoTurn: 0,
  LeftTurn: 1,
  RightTurn: 2,
  StraightAhead: 3,
  UTurn: 4,
  FollowRoad: 5,
  EnterRoundabout: 6,
  ExitRoundabout: 7,
  OffRamp: 8,
  OnRamp: 9,
  ArriveEndOfNavigation: 10,
  StartRoute: 11,
  ArriveAtDestination: 12,
  KeepLeft: 13,
  KeepRight: 14,
  Enter_Ferry: 15,
  ExitFerry: 16,
  ChangeFerry: 17,
  StartRouteWithUTurn: 18,
  UTurnAtRoundabout: 19,
  LeftTurnAtEnd: 20,
  RightTurnAtEnd: 21,
  HighwayOffRampLeft: 22,
  HighwayOffRampRight: 23,
  ArriveAtDestinationLeft: 24,
  ArriveAtDestinationRight: 25,
  UTurnWhenPossible: 26,
  ArriveEndOfDirections: 27,
  RoundaboutExit1: 28,
  RoundaboutExit2: 29,
  RoundaboutExit3: 30,
  RoundaboutExit4: 31,
  RoundaboutExit5: 32,
  RoundaboutExit6: 33,
  RoundaboutExit7: 34,
  RoundaboutExit8: 35,
  RoundaboutExit9: 36,
  RoundaboutExit10: 37,
  RoundaboutExit11: 38,
  RoundaboutExit12: 39,
  RoundaboutExit13: 40,
  RoundaboutExit14: 41,
  RoundaboutExit15: 42,
  RoundaboutExit16: 43,
  RoundaboutExit17: 44,
  RoundaboutExit18: 45,
  RoundaboutExit19: 46,
  SharpLeftTurn: 47,
  SharpRightTurn: 48,
  SlightLeftTurn: 49,
  SlightRightTurn: 50,
  ChangeHighway: 51,
  ChangeHighwayLeft: 52,
  ChangeHighwayRight: 53,
};

declare const CPJunctionType: {
  Intersection: 0,
  Roundabout: 1,
};

declare const CPTrafficSide: {
  Right: 0,
  Left: 1,
};

declare const CPListItemAccessoryType: {
  None: 0,
  DisclosureIndicator: 1,
  Cloud: 2,
};

declare class CPLocationCoordinate3D {
  constructor(init?: CPLocationCoordinate3D);
  latitude: number;
  longitude: number;
  altitude: number;
}

declare function NSStringFromCPManeuverType(maneuverType: interop.Enum<typeof CPManeuverType>): string;

declare function NSStringFromCPJunctionType(junctionType: interop.Enum<typeof CPJunctionType>): string;

declare function NSStringFromCPTrafficSide(trafficSide: interop.Enum<typeof CPTrafficSide>): string;

declare function NSStringFromCPLaneStatus(laneStatus: interop.Enum<typeof CPLaneStatus>): string;

declare function NSStringFromCPRerouteReason(reason: interop.Enum<typeof CPRerouteReason>): string;

declare interface CPTemplateApplicationSceneDelegate extends UISceneDelegate {
  templateApplicationSceneDidConnectInterfaceControllerToWindow?(templateApplicationScene: CPTemplateApplicationScene, interfaceController: CPInterfaceController, window: CPWindow): void;

  templateApplicationSceneDidConnectInterfaceController?(templateApplicationScene: CPTemplateApplicationScene, interfaceController: CPInterfaceController): void;

  templateApplicationSceneDidDisconnectInterfaceControllerFromWindow?(templateApplicationScene: CPTemplateApplicationScene, interfaceController: CPInterfaceController, window: CPWindow): void;

  templateApplicationSceneDidDisconnectInterfaceController?(templateApplicationScene: CPTemplateApplicationScene, interfaceController: CPInterfaceController): void;

  templateApplicationSceneDidSelectNavigationAlert?(templateApplicationScene: CPTemplateApplicationScene, navigationAlert: CPNavigationAlert): void;

  templateApplicationSceneDidSelectManeuver?(templateApplicationScene: CPTemplateApplicationScene, maneuver: CPManeuver): void;

  contentStyleDidChange?(contentStyle: interop.Enum<typeof UIUserInterfaceStyle>): void;
}

declare class CPTemplateApplicationSceneDelegate extends NativeObject implements CPTemplateApplicationSceneDelegate {
}

declare interface CPSearchTemplateDelegate extends NSObjectProtocol {
  searchTemplateUpdatedSearchTextCompletionHandler(searchTemplate: CPSearchTemplate, searchText: string, completionHandler: (p1: NSArray<interop.Object> | Array<interop.Object>) => void): void;

  searchTemplateSelectedResultCompletionHandler(searchTemplate: CPSearchTemplate, item: CPListItem, completionHandler: () => void): void;

  searchTemplateSearchButtonPressed?(searchTemplate: CPSearchTemplate): void;
}

declare class CPSearchTemplateDelegate extends NativeObject implements CPSearchTemplateDelegate {
}

declare interface CPPointOfInterestTemplateDelegate extends NSObjectProtocol {
  pointOfInterestTemplateDidChangeMapRegion(pointOfInterestTemplate: CPPointOfInterestTemplate, region: MKCoordinateRegion): void;

  pointOfInterestTemplateDidSelectPointOfInterest?(pointOfInterestTemplate: CPPointOfInterestTemplate, pointOfInterest: CPPointOfInterest): void;
}

declare class CPPointOfInterestTemplateDelegate extends NativeObject implements CPPointOfInterestTemplateDelegate {
}

declare interface CPMapTemplateDelegate extends NSObjectProtocol {
  mapTemplateShouldProvideNavigationMetadata?(mapTemplate: CPMapTemplate): boolean;

  mapTemplateShouldProvideRouteSharing?(mapTemplate: CPMapTemplate): boolean;

  mapTemplateDidRequestToInsertWaypointIntoSegmentCompletion?(mapTemplate: CPMapTemplate, waypoint: CPNavigationWaypoint, segment: CPRouteSegment, completion: (p1: CPTravelEstimates) => void): void;

  mapTemplateMapTemplateWaypointAcceptedForSegment?(mapTemplate: CPMapTemplate, waypoint: CPNavigationWaypoint, accepted: boolean, segment: CPRouteSegment | null): void;

  mapTemplateDidReceiveUpdatedRouteSource?(mapTemplate: CPMapTemplate, routeSource: interop.Enum<typeof CPRouteSource>): void;

  mapTemplateDidReceiveRequestForDestination?(mapTemplate: CPMapTemplate, waypoint: CPNavigationWaypoint): void;

  mapTemplateDidUpdateRouteSharingEnabled?(mapTemplate: CPMapTemplate, enabled: boolean): void;

  mapTemplateShouldProvideMultiStopRouting?(mapTemplate: CPMapTemplate): boolean;

  mapTemplateDidRequestToRemoveWaypoint?(mapTemplate: CPMapTemplate, waypoint: CPNavigationWaypoint): void;

  mapTemplateDidRequestToRemoveDestination?(mapTemplate: CPMapTemplate, waypoint: CPNavigationWaypoint): void;

  mapTemplateDidRequestMultiStopCardConfigurationWithCompletion?(mapTemplate: CPMapTemplate, completion: (p1: CPMultiStopCardConfiguration) => void): void;

  mapTemplateShouldShowNotificationForManeuver?(mapTemplate: CPMapTemplate, maneuver: CPManeuver): boolean;

  mapTemplateShouldUpdateNotificationForManeuverWithTravelEstimates?(mapTemplate: CPMapTemplate, maneuver: CPManeuver, travelEstimates: CPTravelEstimates): boolean;

  mapTemplateShouldShowNotificationForNavigationAlert?(mapTemplate: CPMapTemplate, navigationAlert: CPNavigationAlert): boolean;

  mapTemplateWillShareDestinationForTrip?(mapTemplate: CPMapTemplate, trip: CPTrip): void;

  mapTemplateDidFailToShareDestinationForTripError?(mapTemplate: CPMapTemplate, trip: CPTrip, error: NSError): void;

  mapTemplateDidShareDestinationForTrip?(mapTemplate: CPMapTemplate, trip: CPTrip): void;

  mapTemplateDidShowPanningInterface?(mapTemplate: CPMapTemplate): void;

  mapTemplateWillDismissPanningInterface?(mapTemplate: CPMapTemplate): void;

  mapTemplateDidDismissPanningInterface?(mapTemplate: CPMapTemplate): void;

  mapTemplatePanBeganWithDirection?(mapTemplate: CPMapTemplate, direction: interop.Enum<typeof CPPanDirection>): void;

  mapTemplatePanEndedWithDirection?(mapTemplate: CPMapTemplate, direction: interop.Enum<typeof CPPanDirection>): void;

  mapTemplatePanWithDirection?(mapTemplate: CPMapTemplate, direction: interop.Enum<typeof CPPanDirection>): void;

  mapTemplateDidBeginPanGesture?(mapTemplate: CPMapTemplate): void;

  mapTemplateDidUpdatePanGestureWithTranslationVelocity?(mapTemplate: CPMapTemplate, translation: CGPoint, velocity: CGPoint): void;

  mapTemplateDidEndPanGestureWithVelocity?(mapTemplate: CPMapTemplate, velocity: CGPoint): void;

  mapTemplateDidBeginZoomGesture?(mapTemplate: CPMapTemplate): void;

  mapTemplateDidUpdateZoomGestureWithCenterScaleVelocity?(mapTemplate: CPMapTemplate, center: CGPoint, scale: number, velocity: number): void;

  mapTemplateDidEndZoomGestureWithVelocity?(mapTemplate: CPMapTemplate, velocity: number): void;

  mapTemplateDidBeginRotationGesture?(mapTemplate: CPMapTemplate): void;

  mapTemplateDidRotateWithCenterRotationVelocity?(mapTemplate: CPMapTemplate, center: CGPoint, rotation: number, velocity: number): void;

  mapTemplateRotationDidEndWithVelocity?(mapTemplate: CPMapTemplate, velocity: number): void;

  mapTemplateDidBeginPitchGesture?(mapTemplate: CPMapTemplate): void;

  mapTemplatePitchWithCenter?(mapTemplate: CPMapTemplate, center: CGPoint): void;

  mapTemplatePitchEndedWithCenter?(mapTemplate: CPMapTemplate, center: CGPoint): void;

  mapTemplateWillShowNavigationAlert?(mapTemplate: CPMapTemplate, navigationAlert: CPNavigationAlert): void;

  mapTemplateDidShowNavigationAlert?(mapTemplate: CPMapTemplate, navigationAlert: CPNavigationAlert): void;

  mapTemplateWillDismissNavigationAlertDismissalContext?(mapTemplate: CPMapTemplate, navigationAlert: CPNavigationAlert, dismissalContext: interop.Enum<typeof CPNavigationAlertDismissalContext>): void;

  mapTemplateDidDismissNavigationAlertDismissalContext?(mapTemplate: CPMapTemplate, navigationAlert: CPNavigationAlert, dismissalContext: interop.Enum<typeof CPNavigationAlertDismissalContext>): void;

  mapTemplateSelectedPreviewForTripUsingRouteChoice?(mapTemplate: CPMapTemplate, trip: CPTrip, routeChoice: CPRouteChoice): void;

  mapTemplateStartedTripUsingRouteChoice?(mapTemplate: CPMapTemplate, trip: CPTrip, routeChoice: CPRouteChoice): void;

  mapTemplateDidCancelNavigation?(mapTemplate: CPMapTemplate): void;

  mapTemplateDisplayStyleForManeuver?(mapTemplate: CPMapTemplate, maneuver: CPManeuver): interop.Enum<typeof CPManeuverDisplayStyle>;
}

declare class CPMapTemplateDelegate extends NativeObject implements CPMapTemplateDelegate {
}

declare interface CPInterfaceControllerDelegate extends NSObjectProtocol {
  templateWillAppearAnimated?(aTemplate: CPTemplate, animated: boolean): void;

  templateDidAppearAnimated?(aTemplate: CPTemplate, animated: boolean): void;

  templateWillDisappearAnimated?(aTemplate: CPTemplate, animated: boolean): void;

  templateDidDisappearAnimated?(aTemplate: CPTemplate, animated: boolean): void;
}

declare class CPInterfaceControllerDelegate extends NativeObject implements CPInterfaceControllerDelegate {
}

declare interface CPSelectableListItem extends CPListTemplateItem {
  handler: (p1: CPSelectableListItem, p2: () => void) => void;
}

declare class CPSelectableListItem extends NativeObject implements CPSelectableListItem {
}

declare interface CPNowPlayingTemplateObserver extends NSObjectProtocol {
  nowPlayingTemplateUpNextButtonTapped?(nowPlayingTemplate: CPNowPlayingTemplate): void;

  nowPlayingTemplateAlbumArtistButtonTapped?(nowPlayingTemplate: CPNowPlayingTemplate): void;
}

declare class CPNowPlayingTemplateObserver extends NativeObject implements CPNowPlayingTemplateObserver {
}

declare interface CPPlayableItem extends NSObjectProtocol {
  playbackConfiguration: CPPlaybackConfiguration;
}

declare class CPPlayableItem extends NativeObject implements CPPlayableItem {
}

declare interface CPListTemplateItem extends NSObjectProtocol {
  readonly text: string;

  userInfo: interop.Object;

  enabled: boolean;

  isEnabled(): boolean;
}

declare class CPListTemplateItem extends NativeObject implements CPListTemplateItem {
}

declare interface CPTabBarTemplateDelegate extends NSObjectProtocol {
  tabBarTemplateDidSelectTemplate(tabBarTemplate: CPTabBarTemplate, selectedTemplate: CPTemplate): void;
}

declare class CPTabBarTemplateDelegate extends NativeObject implements CPTabBarTemplateDelegate {
}

declare interface CPTemplateApplicationInstrumentClusterSceneDelegate extends UISceneDelegate {
  templateApplicationInstrumentClusterSceneDidConnectInstrumentClusterController?(templateApplicationInstrumentClusterScene: CPTemplateApplicationInstrumentClusterScene, instrumentClusterController: CPInstrumentClusterController): void;

  templateApplicationInstrumentClusterSceneDidDisconnectInstrumentClusterController?(templateApplicationInstrumentClusterScene: CPTemplateApplicationInstrumentClusterScene, instrumentClusterController: CPInstrumentClusterController): void;

  contentStyleDidChange?(contentStyle: interop.Enum<typeof UIUserInterfaceStyle>): void;
}

declare class CPTemplateApplicationInstrumentClusterSceneDelegate extends NativeObject implements CPTemplateApplicationInstrumentClusterSceneDelegate {
}

declare interface CPTemplateApplicationDashboardSceneDelegate extends UISceneDelegate {
  templateApplicationDashboardSceneDidConnectDashboardControllerToWindow?(templateApplicationDashboardScene: CPTemplateApplicationDashboardScene, dashboardController: CPDashboardController, window: UIWindow): void;

  templateApplicationDashboardSceneDidDisconnectDashboardControllerFromWindow?(templateApplicationDashboardScene: CPTemplateApplicationDashboardScene, dashboardController: CPDashboardController, window: UIWindow): void;
}

declare class CPTemplateApplicationDashboardSceneDelegate extends NativeObject implements CPTemplateApplicationDashboardSceneDelegate {
}

declare interface CPBarButtonProviding extends NSObjectProtocol {
  get leadingNavigationBarButtons(): NSArray;
  set leadingNavigationBarButtons(value: NSArray<interop.Object> | Array<interop.Object>);

  get trailingNavigationBarButtons(): NSArray;
  set trailingNavigationBarButtons(value: NSArray<interop.Object> | Array<interop.Object>);

  backButton: CPBarButton;
}

declare class CPBarButtonProviding extends NativeObject implements CPBarButtonProviding {
}

declare interface CPSessionConfigurationDelegate extends NSObjectProtocol {
  sessionConfigurationLimitedUserInterfacesChanged?(sessionConfiguration: CPSessionConfiguration, limitedUserInterfaces: interop.Enum<typeof CPLimitableUserInterface>): void;

  sessionConfigurationContentStyleChanged?(sessionConfiguration: CPSessionConfiguration, contentStyle: interop.Enum<typeof CPContentStyle>): void;
}

declare class CPSessionConfigurationDelegate extends NativeObject implements CPSessionConfigurationDelegate {
}

declare interface CPListTemplateDelegate extends NSObjectProtocol {
  listTemplateDidSelectListItemCompletionHandler(listTemplate: CPListTemplate, item: CPListItem, completionHandler: () => void): void;
}

declare class CPListTemplateDelegate extends NativeObject implements CPListTemplateDelegate {
}

declare interface CPMapPanelDelegate extends NSObjectProtocol {
  panelDidShow?(panel: CPMapPanel): void;

  panelDidHide?(panel: CPMapPanel): void;
}

declare class CPMapPanelDelegate extends NativeObject implements CPMapPanelDelegate {
}

declare interface CPInstrumentClusterControllerDelegate extends NSObjectProtocol {
  instrumentClusterControllerDidConnectWindow(instrumentClusterWindow: UIWindow): void;

  instrumentClusterControllerDidDisconnectWindow(instrumentClusterWindow: UIWindow): void;

  instrumentClusterControllerDidZoomIn?(instrumentClusterController: CPInstrumentClusterController): void;

  instrumentClusterControllerDidZoomOut?(instrumentClusterController: CPInstrumentClusterController): void;

  instrumentClusterControllerDidChangeCompassSetting?(instrumentClusterController: CPInstrumentClusterController, compassSetting: interop.Enum<typeof CPInstrumentClusterSetting>): void;

  instrumentClusterControllerDidChangeSpeedLimitSetting?(instrumentClusterController: CPInstrumentClusterController, speedLimitSetting: interop.Enum<typeof CPInstrumentClusterSetting>): void;
}

declare class CPInstrumentClusterControllerDelegate extends NativeObject implements CPInstrumentClusterControllerDelegate {
}

declare interface CPApplicationDelegate extends UIApplicationDelegate {
  applicationDidConnectCarInterfaceControllerToWindow(application: UIApplication, interfaceController: CPInterfaceController, window: CPWindow): void;

  applicationDidDisconnectCarInterfaceControllerFromWindow(application: UIApplication, interfaceController: CPInterfaceController, window: CPWindow): void;

  applicationDidSelectNavigationAlert?(application: UIApplication, navigationAlert: CPNavigationAlert): void;

  applicationDidSelectManeuver?(application: UIApplication, maneuver: CPManeuver): void;
}

declare class CPApplicationDelegate extends NativeObject implements CPApplicationDelegate {
}

declare class CPMessageGridItemConfiguration extends NSObject {
  initWithConversationIdentifierUnread(conversationIdentifier: string, unread: boolean): this;

  unread: boolean;

  readonly conversationIdentifier: string;

  isUnread(): boolean;
}

declare class CPGridTemplate extends CPTemplate implements CPBarButtonProviding {
  initWithTitleGridButtons(title: string | null, gridButtons: NSArray<interop.Object> | Array<interop.Object>): this;

  static readonly maximumGridButtonImageSize: CGSize;

  readonly gridButtons: NSArray;

  updateGridButtons(gridButtons: NSArray<interop.Object> | Array<interop.Object>): void;

  readonly title: string;

  updateTitle(title: string): void;

  get leadingNavigationBarButtons(): NSArray;
  set leadingNavigationBarButtons(value: NSArray<interop.Object> | Array<interop.Object>);

  get trailingNavigationBarButtons(): NSArray;
  set trailingNavigationBarButtons(value: NSArray<interop.Object> | Array<interop.Object>);

  backButton: CPBarButton;

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

declare class CPVoiceControlState extends NSObject implements NSSecureCoding {
  initWithIdentifierTitleVariantsImageRepeats(identifier: string, titleVariants: NSArray<interop.Object> | Array<interop.Object> | null, image: UIImage | null, repeats: boolean): this;

  initWithIdentifierTitleVariantsImageBackgroundImageRepeats(identifier: string, titleVariants: NSArray<interop.Object> | Array<interop.Object> | null, image: UIImage | null, backgroundImage: UIImage | null, repeats: boolean): this;

  readonly titleVariants: NSArray;

  readonly image: UIImage;

  readonly identifier: string;

  readonly repeats: boolean;

  get actionButtons(): NSArray;
  set actionButtons(value: NSArray<interop.Object> | Array<interop.Object>);

  static readonly maximumActionButtonCount: number;

  readonly backgroundImage: UIImage;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class CPSessionConfiguration extends NSObject {
  initWithDelegate(delegate: CPSessionConfigurationDelegate): this;

  readonly limitedUserInterfaces: interop.Enum<typeof CPLimitableUserInterface>;

  readonly contentStyle: interop.Enum<typeof CPContentStyle>;

  delegate: CPSessionConfigurationDelegate | null;

  readonly supportsVideoPlayback: boolean;
}

declare class CPPointOfInterestTemplate extends CPTemplate implements CPBarButtonProviding {
  initWithTitlePointsOfInterestSelectedIndex(title: string, pointsOfInterest: NSArray<interop.Object> | Array<interop.Object>, selectedIndex: number): this;

  title: string;

  setPointsOfInterestSelectedIndex(pointsOfInterest: NSArray<interop.Object> | Array<interop.Object>, selectedIndex: number): void;

  readonly pointsOfInterest: NSArray;

  selectedIndex: number;

  pointOfInterestDelegate: CPPointOfInterestTemplateDelegate;

  get leadingNavigationBarButtons(): NSArray;
  set leadingNavigationBarButtons(value: NSArray<interop.Object> | Array<interop.Object>);

  get trailingNavigationBarButtons(): NSArray;
  set trailingNavigationBarButtons(value: NSArray<interop.Object> | Array<interop.Object>);

  backButton: CPBarButton;

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

declare class CPPointOfInterest extends NSObject implements NSSecureCoding {
  initWithLocationTitleSubtitleSummaryDetailTitleDetailSubtitleDetailSummaryPinImageSelectedPinImage(location: MKMapItem, title: string, subtitle: string | null, summary: string | null, detailTitle: string | null, detailSubtitle: string | null, detailSummary: string | null, pinImage: UIImage | null, selectedPinImage: UIImage | null): this;

  initWithLocationTitleSubtitleSummaryDetailTitleDetailSubtitleDetailSummaryPinImage(location: MKMapItem, title: string, subtitle: string | null, summary: string | null, detailTitle: string | null, detailSubtitle: string | null, detailSummary: string | null, pinImage: UIImage | null): this;

  static readonly pinImageSize: CGSize;

  static readonly selectedPinImageSize: CGSize;

  location: MKMapItem;

  title: string;

  subtitle: string;

  summary: string;

  detailTitle: string;

  detailSubtitle: string;

  detailSummary: string;

  pinImage: UIImage;

  selectedPinImage: UIImage;

  primaryButton: CPTextButton;

  secondaryButton: CPTextButton;

  userInfo: interop.Object;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class CPNowPlayingTemplate extends CPTemplate {
  static readonly sharedTemplate: CPNowPlayingTemplate;

  addObserver(observer: CPNowPlayingTemplateObserver): void;

  removeObserver(observer: CPNowPlayingTemplateObserver): void;

  readonly nowPlayingButtons: NSArray;

  upNextButtonEnabled: boolean;

  allowsMiniPlayer: boolean;

  upNextTitle: string;

  albumArtistButtonEnabled: boolean;

  updateNowPlayingButtons(nowPlayingButtons: NSArray<interop.Object> | Array<interop.Object>): void;

  nowPlayingMode: CPNowPlayingMode;

  isUpNextButtonEnabled(): boolean;

  isAlbumArtistButtonEnabled(): boolean;
}

declare class CPNowPlayingSportsClock extends NSObject implements NSSecureCoding {
  initWithElapsedTimePaused(elapsedTime: number, paused: boolean): this;

  initWithTimeRemainingPaused(timeRemaining: number, paused: boolean): this;

  readonly timeValue: number;

  readonly paused: boolean;

  readonly countsUp: boolean;

  isPaused(): boolean;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class CPNowPlayingMode extends NSObject implements NSSecureCoding {
  static readonly defaultNowPlayingMode: CPNowPlayingMode;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class CPNowPlayingMoreButton extends CPNowPlayingButton {
}

declare class CPNowPlayingButton extends NSObject implements NSSecureCoding {
  initWithHandler(handler: (p1: CPNowPlayingButton) => void | null): this;

  enabled: boolean;

  selected: boolean;

  isEnabled(): boolean;

  isSelected(): boolean;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class CPMessageComposeBarButton extends CPBarButton {
  init(): this;

  static new<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>;

  initWithImage(image: UIImage): this;
}

declare class CPMapTemplate extends CPTemplate implements CPBarButtonProviding {
  guidanceBackgroundColor: UIColor;

  tripEstimateStyle: interop.Enum<typeof CPTripEstimateStyle>;

  get mapButtons(): NSArray;
  set mapButtons(value: NSArray<interop.Object> | Array<interop.Object>);

  showTripPreviewsTextConfiguration(tripPreviews: NSArray<interop.Object> | Array<interop.Object>, textConfiguration: CPTripPreviewTextConfiguration | null): void;

  showTripPreviewsSelectedTripTextConfiguration(tripPreviews: NSArray<interop.Object> | Array<interop.Object>, selectedTrip: CPTrip | null, textConfiguration: CPTripPreviewTextConfiguration | null): void;

  showRouteChoicesPreviewForTripTextConfiguration(tripPreview: CPTrip, textConfiguration: CPTripPreviewTextConfiguration | null): void;

  hideTripPreviews(): void;

  updateTravelEstimatesForTrip(estimates: CPTravelEstimates, trip: CPTrip): void;

  updateTravelEstimatesForTripWithTimeRemainingColor(estimates: CPTravelEstimates, trip: CPTrip, timeRemainingColor: interop.Enum<typeof CPTimeRemainingColor>): void;

  startNavigationSessionForTrip(trip: CPTrip): CPNavigationSession;

  automaticallyHidesNavigationBar: boolean;

  hidesButtonsWithNavigationBar: boolean;

  mapDelegate: CPMapTemplateDelegate;

  showPanningInterfaceAnimated(animated: boolean): void;

  dismissPanningInterfaceAnimated(animated: boolean): void;

  readonly panningInterfaceVisible: boolean;

  readonly currentNavigationAlert: CPNavigationAlert;

  presentNavigationAlertAnimated(navigationAlert: CPNavigationAlert, animated: boolean): void;

  dismissNavigationAlertAnimatedCompletion(animated: boolean, completion: (p1: boolean) => void): void;

  showPanelCompletion(panel: CPMapPanel, completion: (p1: boolean, p2: NSError) => void | null): void;

  pushPanelCompletion(panel: CPMapPanel, completion: (p1: boolean, p2: NSError) => void | null): void;

  popPanelWithCompletion(completion: (p1: boolean, p2: NSError) => void | null): void;

  hidePanelWithCompletion(completion: (p1: boolean, p2: NSError) => void | null): void;

  isPanningInterfaceVisible(): boolean;

  get leadingNavigationBarButtons(): NSArray;
  set leadingNavigationBarButtons(value: NSArray<interop.Object> | Array<interop.Object>);

  get trailingNavigationBarButtons(): NSArray;
  set trailingNavigationBarButtons(value: NSArray<interop.Object> | Array<interop.Object>);

  backButton: CPBarButton;

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

declare class CPNavigationWaypoint extends NSObject implements NSSecureCoding {
  readonly centerPoint: CPLocationCoordinate3D;

  readonly locationThreshold: NSMeasurement;

  readonly name: string;

  readonly nameVariants: NSArray;

  readonly address: string;

  readonly addressVariants: NSArray;

  readonly entryPoints: interop.Pointer;

  readonly entryPointsCount: number;

  readonly timeZone: NSTimeZone;

  initWithCenterPointLocationThresholdNameVariantsAddressVariantsEntryPointsEntryPointsCountTimeZone(centerPoint: CPLocationCoordinate3D, locationThreshold: NSMeasurement | null, nameVariants: NSArray<interop.Object> | Array<interop.Object>, addressVariants: NSArray<interop.Object> | Array<interop.Object>, entryPoints: interop.PointerConvertible, entryPointsCount: number, timeZone: NSTimeZone | null): this;

  initWithCenterPointLocationThresholdNameAddressEntryPointsEntryPointsCountTimeZone(centerPoint: CPLocationCoordinate3D, locationThreshold: NSMeasurement | null, name: string | null, address: string | null, entryPoints: interop.PointerConvertible, entryPointsCount: number, timeZone: NSTimeZone | null): this;

  initWithMapItemLocationThresholdEntryPointsEntryPointsCount(mapItem: MKMapItem, locationThreshold: NSMeasurement | null, entryPoints: interop.PointerConvertible, entryPointsCount: number): this;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class CPPanelButtonConfiguration extends NSObject implements NSSecureCoding {
  initWithPrimaryActionSecondaryAction(primaryAction: CPTextButton, secondaryAction: CPTextButton | null): this;

  readonly primaryAction: CPTextButton;

  readonly secondaryAction: CPTextButton;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class CPNavigationAlert extends NSObject implements NSSecureCoding {
  initWithTitleVariantsSubtitleVariantsImageSetPrimaryActionSecondaryActionDuration(titleVariants: NSArray<interop.Object> | Array<interop.Object>, subtitleVariants: NSArray<interop.Object> | Array<interop.Object> | null, imageSet: CPImageSet | null, primaryAction: CPAlertAction, secondaryAction: CPAlertAction | null, duration: number): this;

  initWithTitleVariantsSubtitleVariantsImagePrimaryActionSecondaryActionDuration(titleVariants: NSArray<interop.Object> | Array<interop.Object>, subtitleVariants: NSArray<interop.Object> | Array<interop.Object> | null, image: UIImage | null, primaryAction: CPAlertAction, secondaryAction: CPAlertAction | null, duration: number): this;

  initWithTitleVariantsSubtitleVariantsAvatarImageAlertImageActionsDuration(titleVariants: NSArray<interop.Object> | Array<interop.Object>, subtitleVariants: NSArray<interop.Object> | Array<interop.Object>, avatarImage: UIImage | null, alertImage: UIImage | null, actions: NSArray<interop.Object> | Array<interop.Object>, duration: number): this;

  updateTitleVariantsSubtitleVariants(newTitleVariants: NSArray<interop.Object> | Array<interop.Object>, newSubtitleVariants: NSArray<interop.Object> | Array<interop.Object>): void;

  updateTitleVariantsSubtitleVariantsAvatarImageAlertImageActionsDuration(newTitleVariants: NSArray<interop.Object> | Array<interop.Object>, newSubtitleVariants: NSArray<interop.Object> | Array<interop.Object>, avatarImage: UIImage | null, alertImage: UIImage | null, actions: NSArray<interop.Object> | Array<interop.Object>, duration: number): void;

  readonly titleVariants: NSArray;

  readonly subtitleVariants: NSArray;

  readonly imageSet: CPImageSet;

  readonly image: UIImage;

  readonly avatarImage: UIImage;

  readonly alertImage: UIImage;

  readonly primaryAction: CPAlertAction;

  readonly secondaryAction: CPAlertAction;

  readonly duration: number;

  readonly actions: NSArray;

  static readonly maximumActionsCount: number;

  static readonly maximumAlertImageSize: CGSize;

  static readonly maximumAvatarImageSize: CGSize;

  showsCloseButton: boolean;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class CPPanel extends NSObject implements NSSecureCoding {
  static readonly maximumPanelItemsCount: number;

  showsCloseButton: boolean;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class CPMapPanelItem extends CPPanelItem {
  initWithTripHandler(trip: CPTrip, handler: (p1: CPMapPanelItem, p2: () => void) => void | null): this;

  initWithTravelEstimatesHandler(travelEstimates: CPTravelEstimates, handler: (p1: CPMapPanelItem, p2: () => void) => void | null): this;

  initWithRouteChoiceHandler(routeChoice: CPRouteChoice, handler: (p1: CPMapPanelItem, p2: () => void) => void | null): this;

  initWithRouteDetailsHandler(routeDetails: NSArray<interop.Object> | Array<interop.Object>, handler: (p1: CPMapPanelItem, p2: () => void) => void | null): this;

  initWithChargingStationConnectionHandler(chargingStationConnection: CPChargingStationConnection, handler: (p1: CPMapPanelItem, p2: () => void) => void | null): this;

  initWithMapTemplateWaypointImageHandler(mapTemplateWaypoint: CPMapTemplateWaypoint, image: UIImage | null, handler: (p1: CPMapPanelItem, p2: () => void) => void | null): this;
}

declare class CPManeuver extends NSObject implements NSCopying, NSSecureCoding {
  symbolSet: CPImageSet;

  cardBackgroundColor: UIColor;

  symbolImage: UIImage;

  junctionImage: UIImage;

  get instructionVariants(): NSArray;
  set instructionVariants(value: NSArray<interop.Object> | Array<interop.Object>);

  initialTravelEstimates: CPTravelEstimates;

  get attributedInstructionVariants(): NSArray;
  set attributedInstructionVariants(value: NSArray<interop.Object> | Array<interop.Object>);

  dashboardSymbolImage: UIImage;

  dashboardJunctionImage: UIImage;

  get dashboardInstructionVariants(): NSArray;
  set dashboardInstructionVariants(value: NSArray<interop.Object> | Array<interop.Object>);

  get dashboardAttributedInstructionVariants(): NSArray;
  set dashboardAttributedInstructionVariants(value: NSArray<interop.Object> | Array<interop.Object>);

  notificationSymbolImage: UIImage;

  get notificationInstructionVariants(): NSArray;
  set notificationInstructionVariants(value: NSArray<interop.Object> | Array<interop.Object>);

  get notificationAttributedInstructionVariants(): NSArray;
  set notificationAttributedInstructionVariants(value: NSArray<interop.Object> | Array<interop.Object>);

  maneuverType: interop.Enum<typeof CPManeuverType>;

  get roadFollowingManeuverVariants(): NSArray;
  set roadFollowingManeuverVariants(value: NSArray<interop.Object> | Array<interop.Object>);

  trafficSide: interop.Enum<typeof CPTrafficSide>;

  junctionType: interop.Enum<typeof CPJunctionType>;

  junctionExitAngle: NSMeasurement;

  junctionElementAngles: NSSet;

  linkedLaneGuidance: CPLaneGuidance;

  highwayExitLabel: string;

  userInfo: interop.Object;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class CPListTemplateDetailsHeader extends NSObject implements NSSecureCoding, CPPlayableItem {
  initWithThumbnailTitleSubtitleActionButtons(thumbnail: CPThumbnailImage, title: string | null, subtitle: string | null, actionButton: NSArray<interop.Object> | Array<interop.Object>): this;

  initWithThumbnailTitleSubtitleBodyVariantsActionButtons(thumbnail: CPThumbnailImage, title: string | null, subtitle: string | null, bodyVariants: NSArray<interop.Object> | Array<interop.Object>, actionButtons: NSArray<interop.Object> | Array<interop.Object>): this;

  thumbnail: CPThumbnailImage;

  title: string;

  subtitle: string;

  get bodyVariants(): NSArray;
  set bodyVariants(value: NSArray<interop.Object> | Array<interop.Object>);

  get actionButtons(): NSArray;
  set actionButtons(value: NSArray<interop.Object> | Array<interop.Object>);

  adaptiveBackgroundStyle: boolean;

  static readonly maximumActionButtonCount: number;

  static readonly maximumActionButtonSize: CGSize;

  wantsAdaptiveBackgroundStyle(): boolean;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;

  playbackConfiguration: CPPlaybackConfiguration;

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

declare class CPListItem extends NSObject implements CPSelectableListItem, CPPlayableItem {
  initWithTextDetailTextImageAccessoryImageAccessoryType(text: string | null, detailText: string | null, image: UIImage | null, accessoryImage: UIImage | null, accessoryType: interop.Enum<typeof CPListItemAccessoryType>): this;

  initWithTextDetailTextImage(text: string | null, detailText: string | null, image: UIImage | null): this;

  initWithTextDetailText(text: string | null, detailText: string | null): this;

  enabled: boolean;

  accessoryType: interop.Enum<typeof CPListItemAccessoryType>;

  explicitContent: boolean;

  playbackProgress: number;

  playing: boolean;

  playingIndicatorLocation: interop.Enum<typeof CPListItemPlayingIndicatorLocation>;

  static readonly maximumImageSize: CGSize;

  handler: (p1: CPSelectableListItem, p2: () => void) => void;

  readonly text: string;

  userInfo: interop.Object;

  readonly detailText: string;

  readonly image: UIImage;

  readonly accessoryImage: UIImage;

  readonly showsDisclosureIndicator: boolean;

  showsExplicitLabel: boolean;

  isEnabled(): boolean;

  isExplicitContent(): boolean;

  isPlaying(): boolean;

  initWithTextDetailTextImageShowsDisclosureIndicator(text: string | null, detailText: string | null, image: UIImage | null, showsDisclosureIndicator: boolean): this;

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

  playbackConfiguration: CPPlaybackConfiguration;
}

declare class CPListImageRowItem extends NSObject implements CPSelectableListItem {
  initWithTextImages(text: string, images: NSArray<interop.Object> | Array<interop.Object>): this;

  initWithTextImagesImageTitles(text: string, images: NSArray<interop.Object> | Array<interop.Object>, imageTitles: NSArray<interop.Object> | Array<interop.Object>): this;

  initWithTextElementsAllowsMultipleLines(text: string | null, elements: NSArray<interop.Object> | Array<interop.Object>, allowsMultipleLines: boolean): this;

  initWithTextCardElementsAllowsMultipleLines(text: string | null, elements: NSArray<interop.Object> | Array<interop.Object>, allowsMultipleLines: boolean): this;

  initWithTextCondensedElementsAllowsMultipleLines(text: string | null, elements: NSArray<interop.Object> | Array<interop.Object>, allowsMultipleLines: boolean): this;

  initWithTextGridElementsAllowsMultipleLines(text: string | null, elements: NSArray<interop.Object> | Array<interop.Object>, allowsMultipleLines: boolean): this;

  initWithTextImageGridElementsAllowsMultipleLines(text: string | null, elements: NSArray<interop.Object> | Array<interop.Object>, allowsMultipleLines: boolean): this;

  text: string;

  userInfo: interop.Object;

  handler: (p1: CPSelectableListItem, p2: () => void) => void;

  enabled: boolean;

  readonly gridImages: NSArray;

  updateImages(gridImages: NSArray<interop.Object> | Array<interop.Object>): void;

  readonly imageTitles: NSArray;

  get elements(): NSArray;
  set elements(value: NSArray<interop.Object> | Array<interop.Object>);

  readonly allowsMultipleLines: boolean;

  listImageRowHandler: (p1: CPListImageRowItem, p2: number, p3: () => void) => void;

  static readonly maximumImageSize: CGSize;

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
}

declare class CPListImageRowItemCondensedElement extends CPListImageRowItemElement {
  initWithImageImageShapeTitleSubtitleAccessorySymbolName(image: UIImage, imageShape: interop.Enum<typeof CPListImageRowItemCondensedElementShape>, title: string, subtitle: string | null, accessorySymbolName: string | null): this;

  title: string;

  subtitle: string;

  accessorySymbolName: string;

  readonly imageShape: interop.Enum<typeof CPListImageRowItemCondensedElementShape>;
}

declare class CPListImageRowItemCardElement extends CPListImageRowItemElement implements NSSecureCoding {
  initWithImageShowsImageFullHeightTitleSubtitleTintColor(image: UIImage, showsImageFullHeight: boolean, title: string | null, subtitle: string | null, tintColor: UIColor | null): this;

  initWithThumbnailTitleSubtitleTintColor(thumbnail: CPThumbnailImage, title: string | null, subtitle: string | null, tintColor: UIColor | null): this;

  thumbnail: CPThumbnailImage;

  title: string;

  subtitle: string;

  readonly showsImageFullHeight: boolean;

  tintColor: UIColor;

  static readonly maximumImageSize: CGSize;

  static readonly maximumFullHeightImageSize: CGSize;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class CPSportsOverlay extends NSObject implements NSSecureCoding {
  initWithLeftTeamRightTeamEventStatus(leftTeam: CPNowPlayingSportsTeam, rightTeam: CPNowPlayingSportsTeam, eventStatus: CPNowPlayingSportsEventStatus | null): this;

  readonly leftTeam: CPNowPlayingSportsTeam;

  readonly rightTeam: CPNowPlayingSportsTeam;

  readonly eventStatus: CPNowPlayingSportsEventStatus;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class CPListImageRowItemElement extends NSObject implements CPPlayableItem {
  image: UIImage;

  static readonly maximumImageSize: CGSize;

  enabled: boolean;

  isEnabled(): boolean;

  accessibilityLabel: string;

  playbackConfiguration: CPPlaybackConfiguration;

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

declare class CPPlaybackConfiguration extends NSObject implements NSCopying, NSSecureCoding {
  initWithPreferredPresentationPlaybackActionElapsedTimeDuration(preferredPresentation: interop.Enum<typeof CPPlaybackPresentation>, playbackAction: interop.Enum<typeof CPPlaybackAction>, elapsedTime: CMTime, duration: CMTime): this;

  readonly preferredPresentation: interop.Enum<typeof CPPlaybackPresentation>;

  readonly playbackAction: interop.Enum<typeof CPPlaybackAction>;

  readonly elapsedTime: CMTime;

  readonly duration: CMTime;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class CPLaneGuidance extends NSObject implements NSCopying, NSSecureCoding {
  get lanes(): NSArray;
  set lanes(value: NSArray<interop.Object> | Array<interop.Object>);

  get instructionVariants(): NSArray;
  set instructionVariants(value: NSArray<interop.Object> | Array<interop.Object>);

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class CPAlertAction extends NSObject implements NSSecureCoding {
  initWithTitleStyleHandler(title: string, style: interop.Enum<typeof CPAlertActionStyle>, handler: (p1: CPAlertAction) => void): this;

  initWithTitleColorHandler(title: string, color: UIColor, handler: (p1: CPAlertAction) => void): this;

  readonly title: string;

  readonly style: interop.Enum<typeof CPAlertActionStyle>;

  readonly handler: (p1: CPAlertAction) => void;

  readonly color: UIColor;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class CPInterfaceController extends NSObject {
  delegate: CPInterfaceControllerDelegate | null;

  prefersDarkUserInterfaceStyle: boolean;

  setRootTemplateAnimatedCompletion(rootTemplate: CPTemplate, animated: boolean, completion: (p1: boolean, p2: NSError) => void | null): void;

  pushTemplateAnimatedCompletion(templateToPush: CPTemplate, animated: boolean, completion: (p1: boolean, p2: NSError) => void | null): void;

  popTemplateAnimatedCompletion(animated: boolean, completion: (p1: boolean, p2: NSError) => void | null): void;

  popToRootTemplateAnimatedCompletion(animated: boolean, completion: (p1: boolean, p2: NSError) => void | null): void;

  popToTemplateAnimatedCompletion(targetTemplate: CPTemplate, animated: boolean, completion: (p1: boolean, p2: NSError) => void | null): void;

  presentTemplateAnimatedCompletion(templateToPresent: CPTemplate, animated: boolean, completion: (p1: boolean, p2: NSError) => void | null): void;

  dismissTemplateAnimatedCompletion(animated: boolean, completion: (p1: boolean, p2: NSError) => void | null): void;

  showOverlayTemplateAnimatedCompletion(templateToShow: CPTemplate, animated: boolean, completion: (p1: boolean, p2: NSError) => void | null): void;

  hideOverlayTemplateAnimatedCompletion(animated: boolean, completion: (p1: boolean, p2: NSError) => void | null): void;

  readonly presentedTemplate: CPTemplate;

  readonly rootTemplate: CPTemplate;

  readonly topTemplate: CPTemplate;

  readonly templates: NSArray;

  readonly carTraitCollection: UITraitCollection;

  setRootTemplateAnimated(rootTemplate: CPTemplate, animated: boolean): void;

  pushTemplateAnimated(templateToPush: CPTemplate, animated: boolean): void;

  popTemplateAnimated(animated: boolean): void;

  popToRootTemplateAnimated(animated: boolean): void;

  popToTemplateAnimated(targetTemplate: CPTemplate, animated: boolean): void;

  presentTemplateAnimated(templateToPresent: CPTemplate, animated: boolean): void;

  dismissTemplateAnimated(animated: boolean): void;
}

declare class CPInformationTemplate extends CPTemplate implements CPBarButtonProviding {
  initWithTitleLayoutItemsActions(title: string, layout: interop.Enum<typeof CPInformationTemplateLayout>, items: NSArray<interop.Object> | Array<interop.Object>, actions: NSArray<interop.Object> | Array<interop.Object>): this;

  readonly layout: interop.Enum<typeof CPInformationTemplateLayout>;

  title: string;

  get items(): NSArray;
  set items(value: NSArray<interop.Object> | Array<interop.Object>);

  get actions(): NSArray;
  set actions(value: NSArray<interop.Object> | Array<interop.Object>);

  get leadingNavigationBarButtons(): NSArray;
  set leadingNavigationBarButtons(value: NSArray<interop.Object> | Array<interop.Object>);

  get trailingNavigationBarButtons(): NSArray;
  set trailingNavigationBarButtons(value: NSArray<interop.Object> | Array<interop.Object>);

  backButton: CPBarButton;

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

declare class CPTextButton extends NSObject {
  initWithTitleTextStyleHandler(title: string, textStyle: interop.Enum<typeof CPTextButtonStyle>, handler: (p1: CPTextButton) => void | null): this;

  title: string;

  textStyle: interop.Enum<typeof CPTextButtonStyle>;
}

declare class CPImageSet extends NSObject implements NSSecureCoding {
  initWithLightContentImageDarkContentImage(lightImage: UIImage, darkImage: UIImage): this;

  readonly lightContentImage: UIImage;

  readonly darkContentImage: UIImage;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class CPGridButton extends NSObject implements NSSecureCoding {
  initWithTitleVariantsImageHandler(titleVariants: NSArray<interop.Object> | Array<interop.Object>, image: UIImage, handler: (p1: CPGridButton) => void | null): this;

  initWithTitleVariantsImageMessageConfigurationHandler(titleVariants: NSArray<interop.Object> | Array<interop.Object>, image: UIImage, messageConfiguration: CPMessageGridItemConfiguration | null, handler: (p1: CPGridButton) => void | null): this;

  enabled: boolean;

  readonly messageConfiguration: CPMessageGridItemConfiguration;

  readonly image: UIImage;

  updateImage(image: UIImage): void;

  readonly titleVariants: NSArray;

  updateTitleVariants(titleVariants: NSArray<interop.Object> | Array<interop.Object>): void;

  isEnabled(): boolean;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class CPContactMessageButton extends CPButton {
  initWithPhoneOrEmail(phoneOrEmail: string): this;

  readonly phoneOrEmail: string;
}

declare class CPContactCallButton extends CPButton {
  initWithHandler(handler: (p1: CPButton) => void | null): this;
}

declare class CPButton extends NSObject {
  initWithImageHandler(image: UIImage, handler: (p1: CPButton) => void | null): this;

  readonly image: UIImage;

  title: string;

  enabled: boolean;

  isEnabled(): boolean;
}

declare class CPTemplate extends NSObject implements NSSecureCoding {
  userInfo: interop.Object;

  tabTitle: string;

  tabImage: UIImage;

  tabSystemItem: interop.Enum<typeof UITabBarSystemItem>;

  showsTabBadge: boolean;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class CPMessageListItem extends NSObject implements CPListTemplateItem {
  initWithConversationIdentifierTextLeadingConfigurationTrailingConfigurationDetailTextTrailingText(conversationIdentifier: string, text: string, leadingConfiguration: CPMessageListItemLeadingConfiguration, trailingConfiguration: CPMessageListItemTrailingConfiguration | null, detailText: string | null, trailingText: string | null): this;

  initWithFullNamePhoneOrEmailAddressLeadingConfigurationTrailingConfigurationDetailTextTrailingText(fullName: string, phoneOrEmailAddress: string, leadingConfiguration: CPMessageListItemLeadingConfiguration, trailingConfiguration: CPMessageListItemTrailingConfiguration | null, detailText: string | null, trailingText: string | null): this;

  text: string;

  conversationIdentifier: string;

  phoneOrEmailAddress: string;

  leadingConfiguration: CPMessageListItemLeadingConfiguration;

  trailingConfiguration: CPMessageListItemTrailingConfiguration;

  detailText: string;

  trailingText: string;

  enabled: boolean;

  userInfo: interop.Object;

  leadingDetailTextImage: UIImage;

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
}

declare class CPMessageListItemTrailingConfiguration extends NSObject {
  readonly trailingItem: interop.Enum<typeof CPMessageTrailingItem>;

  readonly trailingImage: UIImage;

  initWithTrailingItemTrailingImage(trailingItem: interop.Enum<typeof CPMessageTrailingItem>, trailingImage: UIImage | null): this;
}

declare class CPNowPlayingAddToLibraryButton extends CPNowPlayingButton {
}

declare class CPInstrumentClusterController extends NSObject {
  delegate: CPInstrumentClusterControllerDelegate | null;

  readonly instrumentClusterWindow: UIWindow;

  readonly speedLimitSetting: interop.Enum<typeof CPInstrumentClusterSetting>;

  readonly compassSetting: interop.Enum<typeof CPInstrumentClusterSetting>;

  get inactiveDescriptionVariants(): NSArray;
  set inactiveDescriptionVariants(value: NSArray<interop.Object> | Array<interop.Object>);

  get attributedInactiveDescriptionVariants(): NSArray;
  set attributedInactiveDescriptionVariants(value: NSArray<interop.Object> | Array<interop.Object>);
}

declare class CPListImageRowItemImageGridElement extends CPListImageRowItemElement {
  initWithImageImageShapeTitleAccessorySymbolName(image: UIImage, imageShape: interop.Enum<typeof CPListImageRowItemImageGridElementShape>, title: string, accessorySymbolName: string | null): this;

  title: string;

  accessorySymbolName: string;

  readonly imageShape: interop.Enum<typeof CPListImageRowItemImageGridElementShape>;
}

declare class CPRouteSegment extends NSObject implements NSCopying {
  initWithOriginDestinationManeuversLaneGuidancesCurrentManeuversCurrentLaneGuidanceTripTravelEstimatesManeuverTravelEstimatesCoordinatesCoordinatesCount(origin: CPNavigationWaypoint, destination: CPNavigationWaypoint, maneuvers: NSArray<interop.Object> | Array<interop.Object>, laneGuidances: NSArray<interop.Object> | Array<interop.Object>, currentManeuvers: NSArray<interop.Object> | Array<interop.Object>, currentLaneGuidance: CPLaneGuidance, tripTravelEstimates: CPTravelEstimates, maneuverTravelEstimates: CPTravelEstimates, coordinates: interop.PointerConvertible, coordinatesCount: number): this;

  readonly identifier: NSUUID;

  readonly origin: CPNavigationWaypoint;

  readonly destination: CPNavigationWaypoint;

  readonly coordinates: interop.Pointer;

  readonly coordinatesCount: number;

  readonly maneuvers: NSArray;

  readonly laneGuidances: NSArray;

  readonly currentManeuvers: NSArray;

  readonly currentLaneGuidance: CPLaneGuidance;

  readonly tripTravelEstimates: CPTravelEstimates;

  readonly maneuverTravelEstimates: CPTravelEstimates;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

declare class CPMultiStopCardConfiguration extends NSObject implements NSSecureCoding {
  initWithTitleButtons(title: string | null, buttons: NSArray<interop.Object> | Array<interop.Object>): this;

  initWithTitleButtonsImage(title: string | null, buttons: NSArray<interop.Object> | Array<interop.Object>, image: UIImage | null): this;

  readonly title: string;

  readonly image: UIImage;

  readonly buttons: NSArray;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class CPNowPlayingSportsTeamLogo extends NSObject implements NSSecureCoding {
  initWithTeamLogo(teamLogo: UIImage): this;

  initWithTeamInitials(teamInitials: string): this;

  readonly logo: UIImage;

  readonly initials: string;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class CPListSection extends NSObject implements NSSecureCoding {
  initWithItemsHeaderSectionIndexTitle(items: NSArray<interop.Object> | Array<interop.Object>, header: string | null, sectionIndexTitle: string | null): this;

  initWithItemsHeaderHeaderSubtitleHeaderImageHeaderButtonSectionIndexTitle(items: NSArray<interop.Object> | Array<interop.Object>, header: string, headerSubtitle: string | null, headerImage: UIImage | null, headerButton: CPButton | null, sectionIndexTitle: string | null): this;

  initWithItems(items: NSArray<interop.Object> | Array<interop.Object>): this;

  readonly header: string;

  readonly headerSubtitle: string;

  headerImage: UIImage;

  readonly headerButton: CPButton;

  readonly sectionIndexTitle: string;

  readonly items: NSArray;

  indexOfItem(item: CPListTemplateItem): number;

  itemAtIndex(index: number): CPListTemplateItem;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class CPInformationItem extends NSObject implements NSSecureCoding {
  initWithTitleDetail(title: string | null, detail: string | null): this;

  readonly title: string;

  readonly detail: string;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class CPRouteChoice extends NSObject implements NSCopying, NSSecureCoding {
  initWithSummaryVariantsAdditionalInformationVariantsSelectionSummaryVariants(summaryVariants: NSArray<interop.Object> | Array<interop.Object>, additionalInformationVariants: NSArray<interop.Object> | Array<interop.Object>, selectionSummaryVariants: NSArray<interop.Object> | Array<interop.Object>): this;

  initWithSummaryVariantsAdditionalInformationVariantsSelectionSummaryVariantsTravelEstimates(summaryVariants: NSArray<interop.Object> | Array<interop.Object>, additionalInformationVariants: NSArray<interop.Object> | Array<interop.Object>, selectionSummaryVariants: NSArray<interop.Object> | Array<interop.Object>, travelEstimates: CPTravelEstimates | null): this;

  readonly summaryVariants: NSArray;

  readonly selectionSummaryVariants: NSArray;

  readonly additionalInformationVariants: NSArray;

  userInfo: interop.Object;

  readonly travelEstimates: CPTravelEstimates;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class CPNowPlayingSportsEventStatus extends NSObject implements NSSecureCoding {
  initWithEventStatusTextEventStatusImageEventClock(eventStatusText: NSArray<interop.Object> | Array<interop.Object> | null, eventStatusImage: UIImage | null, eventClock: CPNowPlayingSportsClock | null): this;

  readonly eventStatusText: NSArray;

  readonly eventClock: CPNowPlayingSportsClock;

  readonly eventStatusImage: UIImage;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class CPNavigationSession extends NSObject {
  pauseTripForReasonDescription(reason: interop.Enum<typeof CPTripPauseReason>, description: string | null): void;

  pauseTripForReasonDescriptionTurnCardColor(reason: interop.Enum<typeof CPTripPauseReason>, description: string | null, turnCardColor: UIColor | null): void;

  resumeTripWithUpdatedRouteInformation(routeInformation: CPRouteInformation): void;

  resumeTripWithUpdatedRouteSegmentsCurrentSegmentRerouteReason(routeSegments: NSArray<interop.Object> | Array<interop.Object>, currentSegment: CPRouteSegment, rerouteReason: interop.Enum<typeof CPRerouteReason>): void;

  resumeNavigationWithUpdatedTripRouteSegmentsCurrentSegmentRerouteReason(trip: CPTrip, routeSegments: NSArray<interop.Object> | Array<interop.Object>, currentSegment: CPRouteSegment, rerouteReason: interop.Enum<typeof CPRerouteReason>): void;

  finishTrip(): void;

  cancelTrip(): void;

  get upcomingManeuvers(): NSArray;
  set upcomingManeuvers(value: NSArray<interop.Object> | Array<interop.Object>);

  currentLaneGuidance: CPLaneGuidance;

  addManeuvers(maneuvers: NSArray<interop.Object> | Array<interop.Object>): void;

  addLaneGuidances(laneGuidances: NSArray<interop.Object> | Array<interop.Object>): void;

  addRouteSegments(routeSegments: NSArray<interop.Object> | Array<interop.Object>): void;

  get currentRoadNameVariants(): NSArray;
  set currentRoadNameVariants(value: NSArray<interop.Object> | Array<interop.Object>);

  maneuverState: interop.Enum<typeof CPManeuverState>;

  readonly trip: CPTrip;

  updateTravelEstimatesForManeuver(estimates: CPTravelEstimates, maneuver: CPManeuver): void;

  optionsPanel: CPMapPanel;

  readonly routeSegments: NSArray;

  currentSegment: CPRouteSegment;

  readonly routeSharingEnabled: boolean;

  readonly routeSharingSupported: boolean;

  isRouteSharingEnabled(): boolean;

  isRouteSharingSupported(): boolean;
}

declare class CPTripPreviewTextConfiguration extends NSObject implements NSSecureCoding {
  initWithStartButtonTitleAdditionalRoutesButtonTitleOverviewButtonTitle(startButtonTitle: string | null, additionalRoutesButtonTitle: string | null, overviewButtonTitle: string | null): this;

  readonly startButtonTitle: string;

  readonly additionalRoutesButtonTitle: string;

  readonly overviewButtonTitle: string;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class CPLane extends NSObject implements NSCopying, NSSecureCoding {
  init(): this;

  initWithAngles(angles: NSArray<interop.Object> | Array<interop.Object>): this;

  initWithAnglesHighlightedAngleIsPreferred(angles: NSArray<interop.Object> | Array<interop.Object>, highlightedAngle: NSMeasurement, preferred: boolean): this;

  status: interop.Enum<typeof CPLaneStatus>;

  primaryAngle: NSMeasurement;

  readonly highlightedAngle: NSMeasurement;

  get secondaryAngles(): NSArray;
  set secondaryAngles(value: NSArray<interop.Object> | Array<interop.Object>);

  readonly angles: NSArray;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class CPActionSheetTemplate extends CPTemplate {
  initWithTitleMessageActions(title: string | null, message: string | null, actions: NSArray<interop.Object> | Array<interop.Object>): this;

  readonly title: string;

  readonly message: string;

  readonly actions: NSArray;
}

declare class CPContact extends NSObject implements NSSecureCoding {
  initWithNameImage(name: string, image: UIImage): this;

  name: string;

  image: UIImage;

  get actions(): NSArray;
  set actions(value: NSArray<interop.Object> | Array<interop.Object>);

  subtitle: string;

  informativeText: string;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class CPImageOverlay extends NSObject implements NSSecureCoding {
  initWithImageAlignment(image: UIImage, alignment: interop.Enum<typeof CPImageOverlayAlignment>): this;

  initWithTextTextColorBackgroundColorAlignment(text: string, textColor: UIColor, backgroundColor: UIColor, alignment: interop.Enum<typeof CPImageOverlayAlignment>): this;

  readonly text: string;

  readonly textColor: UIColor;

  readonly backgroundColor: UIColor;

  readonly image: UIImage;

  readonly alignment: interop.Enum<typeof CPImageOverlayAlignment>;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class CPVoiceControlTemplate extends CPTemplate implements CPBarButtonProviding {
  initWithVoiceControlStates(voiceControlStates: NSArray<interop.Object> | Array<interop.Object>): this;

  readonly voiceControlStates: NSArray;

  activateVoiceControlStateWithIdentifier(identifier: string): void;

  readonly activeStateIdentifier: string;

  get leadingNavigationBarButtons(): NSArray;
  set leadingNavigationBarButtons(value: NSArray<interop.Object> | Array<interop.Object>);

  get trailingNavigationBarButtons(): NSArray;
  set trailingNavigationBarButtons(value: NSArray<interop.Object> | Array<interop.Object>);

  backButton: CPBarButton;

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

declare class CPNowPlayingRepeatButton extends CPNowPlayingButton {
}

declare class CPNowPlayingImageButton extends CPNowPlayingButton {
  initWithImageHandler(image: UIImage, handler: (p1: CPNowPlayingButton) => void | null): this;

  readonly image: UIImage;
}

declare class CPAssistantCellConfiguration extends NSObject implements NSSecureCoding {
  initWithPositionVisibilityAssistantAction(position: interop.Enum<typeof CPAssistantCellPosition>, visibility: interop.Enum<typeof CPAssistantCellVisibility>, assistantAction: interop.Enum<typeof CPAssistantCellActionType>): this;

  readonly position: interop.Enum<typeof CPAssistantCellPosition>;

  readonly visibility: interop.Enum<typeof CPAssistantCellVisibility>;

  readonly assistantAction: interop.Enum<typeof CPAssistantCellActionType>;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class CPTabBarTemplate extends CPTemplate {
  initWithTemplates(templates: NSArray<interop.Object> | Array<interop.Object>): this;

  delegate: CPTabBarTemplateDelegate;

  static readonly maximumTabCount: number;

  readonly templates: NSArray;

  readonly selectedTemplate: CPTemplate;

  updateTemplates(newTemplates: NSArray<interop.Object> | Array<interop.Object>): void;

  selectTemplate(newTemplate: CPTemplate): void;

  selectTemplateAtIndex(index: number): void;
}

declare class CPBarButton extends NSObject implements NSSecureCoding {
  initWithImageHandler(image: UIImage, handler: (p1: CPBarButton) => void | null): this;

  initWithTitleHandler(title: string, handler: (p1: CPBarButton) => void | null): this;

  enabled: boolean;

  buttonStyle: interop.Enum<typeof CPBarButtonStyle>;

  image: UIImage;

  title: string;

  initWithTypeHandler(type: interop.Enum<typeof CPBarButtonType>, handler: (p1: CPBarButton) => void | null): this;

  readonly buttonType: interop.Enum<typeof CPBarButtonType>;

  isEnabled(): boolean;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class CPTravelEstimates extends NSObject implements NSSecureCoding {
  initWithDistanceRemainingTimeRemaining(distance: NSMeasurement, time: number): this;

  initWithDistanceRemainingDistanceRemainingToDisplayTimeRemaining(distanceRemaining: NSMeasurement, distanceRemainingToDisplay: NSMeasurement, time: number): this;

  initWithDistanceRemainingDistanceRemainingToDisplayTimeRemainingRouteDetails(distanceRemaining: NSMeasurement, distanceRemainingToDisplay: NSMeasurement, time: number, routeDetails: NSArray<interop.Object> | Array<interop.Object>): this;

  readonly distanceRemainingToDisplay: NSMeasurement;

  readonly distanceRemaining: NSMeasurement;

  readonly timeRemaining: number;

  readonly routeDetails: NSArray;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class CPNowPlayingModeSports extends CPNowPlayingMode implements NSSecureCoding {
  initWithLeftTeamRightTeamEventStatusBackgroundArtwork(leftTeam: CPNowPlayingSportsTeam, rightTeam: CPNowPlayingSportsTeam, eventStatus: CPNowPlayingSportsEventStatus | null, backgroundArtwork: UIImage | null): this;

  readonly leftTeam: CPNowPlayingSportsTeam;

  readonly rightTeam: CPNowPlayingSportsTeam;

  readonly eventStatus: CPNowPlayingSportsEventStatus;

  readonly backgroundArtwork: UIImage;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class CPPanelItem extends NSObject implements NSSecureCoding {
  enabled: boolean;

  showsBottomSeparator: boolean;

  userInfo: interop.Object;

  initWithListItem(listItem: CPListItem): this;

  initWithGridButtons(gridButtons: NSArray<interop.Object> | Array<interop.Object>): this;

  isEnabled(): boolean;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class CPDashboardButton extends NSObject implements NSSecureCoding {
  initWithTitleVariantsSubtitleVariantsImageHandler(titleVariants: NSArray<interop.Object> | Array<interop.Object>, subtitleVariants: NSArray<interop.Object> | Array<interop.Object>, image: UIImage, handler: (p1: CPDashboardButton) => void | null): this;

  readonly image: UIImage;

  readonly titleVariants: NSArray;

  readonly subtitleVariants: NSArray;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class CPMapPanelButtonConfiguration extends CPPanelButtonConfiguration {
  initWithPrimaryActionSecondaryButtonTravelEstimates(primaryAction: CPTextButton, secondaryButton: CPButton | null, travelEstimates: CPTravelEstimates): this;

  travelEstimates: CPTravelEstimates;

  readonly secondaryButton: CPButton;
}

declare class CPContactDirectionsButton extends CPButton {
  initWithHandler(handler: (p1: CPButton) => void | null): this;
}

declare class CPChargingStationConnection extends NSObject implements NSCopying, NSSecureCoding {
  initWithConnectorVoltagePower(connector: interop.Enum<typeof CPChargingStationConnectionConnector>, voltage: NSMeasurement, power: NSMeasurement): this;

  readonly connector: interop.Enum<typeof CPChargingStationConnectionConnector>;

  readonly voltage: NSMeasurement;

  readonly power: NSMeasurement;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class CPNowPlayingSportsTeam extends NSObject implements NSSecureCoding {
  initWithNameLogoTeamStandingsEventScorePossessionIndicatorFavorite(name: string, logo: CPNowPlayingSportsTeamLogo, teamStandings: string | null, eventScore: string, possessionIndicator: UIImage | null, favorite: boolean): this;

  readonly name: string;

  readonly logo: CPNowPlayingSportsTeamLogo;

  readonly teamStandings: string;

  readonly eventScore: string;

  readonly possessionIndicator: UIImage;

  readonly favorite: boolean;

  isFavorite(): boolean;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class CPListImageRowItemRowElement extends CPListImageRowItemElement {
  initWithImageTitleSubtitle(image: UIImage, title: string | null, subtitle: string | null): this;

  title: string;

  subtitle: string;
}

declare class CPInformationRatingItem extends CPInformationItem {
  initWithRatingMaximumRatingTitleDetail(rating: NSNumber | null, maximumRating: NSNumber | null, title: string | null, detail: string | null): this;

  readonly rating: NSNumber;

  readonly maximumRating: NSNumber;
}

declare class CPMapButton extends NSObject implements NSSecureCoding {
  initWithHandler(handler: (p1: CPMapButton) => void | null): this;

  enabled: boolean;

  hidden: boolean;

  image: UIImage;

  focusedImage: UIImage;

  isEnabled(): boolean;

  isHidden(): boolean;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class CPMessageListItemLeadingConfiguration extends NSObject {
  readonly unread: boolean;

  readonly leadingItem: interop.Enum<typeof CPMessageLeadingItem>;

  readonly leadingImage: UIImage;

  initWithLeadingItemLeadingImageUnread(leadingItem: interop.Enum<typeof CPMessageLeadingItem>, leadingImage: UIImage | null, unread: boolean): this;

  isUnread(): boolean;
}

declare class CPSearchTemplate extends CPTemplate {
  delegate: CPSearchTemplateDelegate;
}

declare class CPThumbnailImage extends NSObject implements NSSecureCoding {
  initWithImage(image: UIImage): this;

  initWithImageImageOverlaySportsOverlay(image: UIImage, imageOverlay: CPImageOverlay | null, sportsOverlay: CPSportsOverlay | null): this;

  image: UIImage;

  imageOverlay: CPImageOverlay;

  sportsOverlay: CPSportsOverlay;

  static maximumImageSizeForAspectRatio(aspectRatio: number): CGSize;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

// @ts-ignore ClassDecl.tsIgnore
declare class CPTemplateApplicationScene extends UIScene {
  // @ts-ignore MemberDecl.tsIgnore
  delegate: CPTemplateApplicationSceneDelegate;

  readonly interfaceController: CPInterfaceController;

  readonly carWindow: CPWindow;

  readonly contentStyle: interop.Enum<typeof UIUserInterfaceStyle>;
}

// @ts-ignore ClassDecl.tsIgnore
declare class CPTemplateApplicationInstrumentClusterScene extends UIScene {
  // @ts-ignore MemberDecl.tsIgnore
  delegate: CPTemplateApplicationInstrumentClusterSceneDelegate;

  readonly instrumentClusterController: CPInstrumentClusterController;

  readonly contentStyle: interop.Enum<typeof UIUserInterfaceStyle>;
}

declare class CPListImageRowItemGridElement extends CPListImageRowItemElement {
  initWithImage(image: UIImage): this;
}

declare class CPDashboardController extends NSObject {
  get shortcutButtons(): NSArray;
  set shortcutButtons(value: NSArray<interop.Object> | Array<interop.Object>);
}

declare class CPRouteDetail extends NSObject implements NSCopying, NSSecureCoding {
  static routeDetailWithTollAmountLocale<This extends abstract new (...args: any) => any>(this: This, value: number, locale: NSLocale): InstanceType<This>;

  static routeDetailWithFuelLevel<This extends abstract new (...args: any) => any>(this: This, fuelLevel: NSMeasurement): InstanceType<This>;

  static routeDetailWithFuelEnergy<This extends abstract new (...args: any) => any>(this: This, fuelEnergy: NSMeasurement): InstanceType<This>;

  static routeDetailWithFuelMass<This extends abstract new (...args: any) => any>(this: This, fuelMass: NSMeasurement): InstanceType<This>;

  static routeDetailWithBatteryLevel<This extends abstract new (...args: any) => any>(this: This, batteryLevel: number): InstanceType<This>;

  static routeDetailWithKilowattHours<This extends abstract new (...args: any) => any>(this: This, kilowattHours: NSMeasurement): InstanceType<This>;

  static routeDetailWithCarbonFootprint<This extends abstract new (...args: any) => any>(this: This, carbonFootprint: NSMeasurement): InstanceType<This>;

  static routeDetailWithEcoScore<This extends abstract new (...args: any) => any>(this: This, value: number): InstanceType<This>;

  static routeDetailWithEmissions<This extends abstract new (...args: any) => any>(this: This, emissions: NSMeasurement): InstanceType<This>;

  static routeDetailWithRating<This extends abstract new (...args: any) => any>(this: This, rating: number): InstanceType<This>;

  static routeDetailWithHOV<This extends abstract new (...args: any) => any>(this: This, hovInfo: string): InstanceType<This>;

  static routeDetailWithTrafficLights<This extends abstract new (...args: any) => any>(this: This, trafficLights: number): InstanceType<This>;

  static routeDetailWithWarning<This extends abstract new (...args: any) => any>(this: This, warning: string): InstanceType<This>;

  static routeDetailWithInfo<This extends abstract new (...args: any) => any>(this: This, info: string): InstanceType<This>;

  static routeDetailWithParking<This extends abstract new (...args: any) => any>(this: This, parking: string): InstanceType<This>;

  static routeDetailWithSymbolNameValue<This extends abstract new (...args: any) => any>(this: This, symbolName: string, value: string): InstanceType<This>;

  symbolTintColor: UIColor;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class CPMapPanel extends CPPanel {
  initWithTitleSectionsButtonConfiguration(title: string | null, sections: NSArray<interop.Object> | Array<interop.Object>, buttonConfiguration: CPMapPanelButtonConfiguration | null): this;

  readonly title: string;

  get sections(): NSArray;
  set sections(value: NSArray<interop.Object> | Array<interop.Object>);

  readonly buttonConfiguration: CPMapPanelButtonConfiguration;

  delegate: CPMapPanelDelegate;
}

declare class CPMapTemplateWaypoint extends NSObject implements NSSecureCoding {
  waypoint: CPNavigationWaypoint;

  travelEstimates: CPTravelEstimates;

  initWithWaypointTravelEstimates(waypoint: CPNavigationWaypoint, travelEstimates: CPTravelEstimates): this;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class CPContactTemplate extends CPTemplate implements CPBarButtonProviding {
  initWithContact(contact: CPContact): this;

  contact: CPContact;

  get leadingNavigationBarButtons(): NSArray;
  set leadingNavigationBarButtons(value: NSArray<interop.Object> | Array<interop.Object>);

  get trailingNavigationBarButtons(): NSArray;
  set trailingNavigationBarButtons(value: NSArray<interop.Object> | Array<interop.Object>);

  backButton: CPBarButton;

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

declare class CPAlertTemplate extends CPTemplate {
  initWithTitleVariantsActions(titleVariants: NSArray<interop.Object> | Array<interop.Object>, actions: NSArray<interop.Object> | Array<interop.Object>): this;

  readonly titleVariants: NSArray;

  static readonly maximumActionCount: number;

  readonly actions: NSArray;
}

// @ts-ignore ClassDecl.tsIgnore
declare class CPTemplateApplicationDashboardScene extends UIScene {
  // @ts-ignore MemberDecl.tsIgnore
  delegate: CPTemplateApplicationDashboardSceneDelegate;

  readonly dashboardController: CPDashboardController;

  readonly dashboardWindow: UIWindow;
}

declare class CPListTemplate extends CPTemplate implements CPBarButtonProviding {
  initWithTitleSections(title: string | null, sections: NSArray<interop.Object> | Array<interop.Object>): this;

  initWithTitleSectionsAssistantCellConfiguration(title: string | null, sections: NSArray<interop.Object> | Array<interop.Object>, assistantCellConfiguration: CPAssistantCellConfiguration | null): this;

  initWithTitleSectionsAssistantCellConfigurationHeaderGridButtons(title: string | null, sections: NSArray<interop.Object> | Array<interop.Object>, assistantCellConfiguration: CPAssistantCellConfiguration | null, headerGridButtons: NSArray<interop.Object> | Array<interop.Object> | null): this;

  initWithTitleListHeaderSectionsAssistantCellConfiguration(title: string | null, listHeader: CPListTemplateDetailsHeader | null, sections: NSArray<interop.Object> | Array<interop.Object>, assistantCellConfiguration: CPAssistantCellConfiguration | null): this;

  listHeader: CPListTemplateDetailsHeader;

  delegate: CPListTemplateDelegate;

  static readonly maximumItemCount: number;

  static readonly maximumSectionCount: number;

  readonly sections: NSArray;

  readonly title: string;

  updateSections(sections: NSArray<interop.Object> | Array<interop.Object>): void;

  readonly sectionCount: number;

  readonly itemCount: number;

  indexPathForItem(item: CPListTemplateItem): NSIndexPath;

  get emptyViewTitleVariants(): NSArray;
  set emptyViewTitleVariants(value: NSArray<interop.Object> | Array<interop.Object>);

  get emptyViewSubtitleVariants(): NSArray;
  set emptyViewSubtitleVariants(value: NSArray<interop.Object> | Array<interop.Object>);

  showsSpinnerWhileEmpty: boolean;

  assistantCellConfiguration: CPAssistantCellConfiguration;

  static readonly maximumHeaderGridButtonCount: number;

  static readonly maximumGridButtonImageSize: CGSize;

  get headerGridButtons(): NSArray;
  set headerGridButtons(value: NSArray<interop.Object> | Array<interop.Object>);

  get leadingNavigationBarButtons(): NSArray;
  set leadingNavigationBarButtons(value: NSArray<interop.Object> | Array<interop.Object>);

  get trailingNavigationBarButtons(): NSArray;
  set trailingNavigationBarButtons(value: NSArray<interop.Object> | Array<interop.Object>);

  backButton: CPBarButton;

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

declare class CPNowPlayingPlaybackRateButton extends CPNowPlayingButton {
}

declare class CPTrip extends NSObject implements NSSecureCoding {
  initWithOriginWaypointDestinationWaypointRouteChoices(origin: CPNavigationWaypoint, destination: CPNavigationWaypoint, routeChoices: NSArray<interop.Object> | Array<interop.Object>): this;

  initWithOriginDestinationRouteChoices(origin: MKMapItem, destination: MKMapItem, routeChoices: NSArray<interop.Object> | Array<interop.Object>): this;

  readonly origin: MKMapItem;

  readonly destination: MKMapItem;

  readonly originWaypoint: CPNavigationWaypoint;

  readonly destinationWaypoint: CPNavigationWaypoint;

  readonly routeChoices: NSArray;

  userInfo: interop.Object;

  get destinationNameVariants(): NSArray;
  set destinationNameVariants(value: NSArray<interop.Object> | Array<interop.Object>);

  hasShareableDestination: boolean;

  routeSegmentsAvailableForRegion: boolean;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class CPMapPanelSection extends NSObject implements NSSecureCoding {
  initWithTitleItems(title: string | null, items: NSArray<interop.Object> | Array<interop.Object>): this;

  title: string;

  get items(): NSArray;
  set items(value: NSArray<interop.Object> | Array<interop.Object>);

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class CPNowPlayingShuffleButton extends CPNowPlayingButton {
}

declare class CPWindow extends UIWindow {
  readonly mapButtonSafeAreaLayoutGuide: UILayoutGuide;

  templateApplicationScene: CPTemplateApplicationScene;
}

declare class CPRouteInformation extends NSObject {
  initWithManeuversLaneGuidancesCurrentManeuversCurrentLaneGuidanceTripTravelEstimatesManeuverTravelEstimates(maneuvers: NSArray<interop.Object> | Array<interop.Object>, laneGuidances: NSArray<interop.Object> | Array<interop.Object>, currentManeuvers: NSArray<interop.Object> | Array<interop.Object>, currentLaneGuidance: CPLaneGuidance, tripTravelEstimates: CPTravelEstimates, maneuverTravelEstimates: CPTravelEstimates): this;

  readonly maneuvers: NSArray;

  readonly laneGuidances: NSArray;

  readonly currentManeuvers: NSArray;

  readonly currentLaneGuidance: CPLaneGuidance;

  readonly tripTravelEstimates: CPTravelEstimates;

  readonly maneuverTravelEstimates: CPTravelEstimates;
}

