/// <reference types="@nativescript/objc-node-api" />
/// <reference path="./Runtime.d.ts" />

declare const BEBrowserDataExchangeImportActivity: string;

declare const BEBrowserDataExchangeErrorDomain: string;

declare const BEBrowserDataExchangeImportToken: string;

declare const BEBrowserDataExchangeExportToken: string;

declare const BEBrowserDataExchangeExportActivity: string;

declare const BEBrowserDataExchangeError: {
  Unknown: 0,
  Export: 1,
  Import: 2,
};

declare const BEExportDataTypes: {
  None: 0,
  Bookmarks: 1,
  ReadingList: 2,
  History: 4,
  Extensions: 8,
};

declare const BEEligibilityContext: {
  BEEligibilityContextWebBrowser: 0,
};

declare class BEBrowserDataImportManager extends NSObject {
  init(): this;

  initWithScene(scene: UIWindowScene | null): this;

  importBrowserDataWithTokenImportBlock(token: NSUUID, importBlock: (p1: BEBrowserData, p2: boolean, p3: NSError) => void | null): void;

  requestImportForMetadataCompletionHandler(metadata: BEImportMetadata, completionHandler: (p1: BEImportOptions, p2: NSError) => void | null): void;
}

declare class BEBrowserDataBookmark extends BEBrowserData {
  readonly isFolder: boolean;

  readonly title: string;

  readonly identifier: string;

  readonly url: NSURL;

  readonly parentIdentifier: string;

  initAsFolderTitleIdentifierUrlParentIdentifier(isFolder: boolean, title: string, identifier: string, url: NSURL | null, parentIdentifier: string | null): this;
}

declare class BEBrowserData extends NSObject implements NSSecureCoding {
  readonly sourceApplicationBundleIdentifier: string;

  readonly sourceApplicationLocalizedName: string;

  initWithSourceApplicationBundleIdentifierSourceApplicationLocalizedName(sourceApplicationBundleIdentifier: string | null, sourceApplicationLocalizedName: string | null): this;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class BEAvailability extends NSObject {
  static isEligibleForContextCompletionHandler(context: interop.Enum<typeof BEEligibilityContext>, completionHandler: (p1: boolean, p2: NSError) => void | null): void;
}

declare class BEBrowserContentFilter extends NSObject {
  evaluateURLCompletionHandler(url: NSURL, completionHandler: (p1: boolean) => void): void;
}

declare class BEExportMetadata extends NSObject implements NSSecureCoding {
  readonly supportExportToFiles: boolean;

  readonly bookmarksCount: number;

  readonly readingListCount: number;

  readonly historyCount: number;

  readonly extensionsCount: number;

  initWithSupportForExportToFilesBookmarksCountReadingListCountHistoryCountExtensionsCount(supportExportToFiles: boolean, bookmarksCount: number, readingListCount: number, historyCount: number, extensionsCount: number): this;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class BEBrowserDataExportManager extends NSObject {
  initWithScene(scene: UIWindowScene): this;

  requestExportForMetadataTokenCompletionHandler(metadata: BEExportMetadata, token: NSUUID | null, completionHandler: (p1: BEExportOptions, p2: NSError) => void | null): void;

  exportBrowserDataCompletionHandler(browserData: BEBrowserData, completionHandler: (p1: NSError) => void | null): void;

  exportFinishedWithCompletionHandler(completionHandler: (p1: NSError) => void | null): void;
}

declare class BEBrowserDataExtension extends BEBrowserData {
  readonly displayName: string;

  readonly developerName: string;

  readonly identifier: string;

  readonly storeIdentifier: string;

  initWithDisplayNameDeveloperNameIdentifierStoreIdentifier(displayName: string, developerName: string, identifier: string, storeIdentifier: string): this;
}

declare class BEBrowserDataHistoryVisit extends BEBrowserData {
  readonly url: NSURL;

  readonly dateOfLastVisit: NSDate;

  readonly title: string;

  readonly loadedSuccessfully: boolean;

  readonly httpGet: boolean;

  readonly redirectSourceURL: NSURL;

  readonly redirectSourceDateOfVisit: NSDate;

  readonly redirectDestinationURL: NSURL;

  readonly redirectDestinationDateOfVisit: NSDate;

  readonly visitCount: number;

  initWithURLDateOfLastVisitTitleLoadedSuccessfullyHttpGetRedirectSourceURLRedirectSourceDateOfVisitRedirectDestinationURLRedirectDestinationDateOfVisitVisitCount(url: NSURL, dateOfLastVisit: NSDate, title: string | null, loadedSuccessfully: boolean, httpGet: boolean, redirectSourceURL: NSURL | null, redirectSourceDateOfVisit: NSDate | null, redirectDestinationURL: NSURL | null, redirectDestinationDateOfVisit: NSDate | null, visitCount: number): this;
}

declare class BEImportMetadata extends NSObject implements NSSecureCoding {
  readonly supportImportFromFiles: boolean;

  initWithSupportForImportFromFiles(supportImportFromFiles: boolean): this;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class BEExportOptions extends NSObject implements NSSecureCoding {
  readonly exportToFiles: boolean;

  readonly dataTypes: interop.Enum<typeof BEExportDataTypes>;

  initWithExportToFilesDataTypes(exportToFiles: boolean, dataTypes: interop.Enum<typeof BEExportDataTypes>): this;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class BEImportOptions extends NSObject implements NSSecureCoding {
  readonly importFromFiles: boolean;

  initWithImportFromFiles(importFromFiles: boolean): this;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class BEBrowserDataReadingListItem extends BEBrowserData {
  readonly title: string;

  readonly url: NSURL;

  readonly dateOfLastVisit: NSDate;

  initWithTitleUrlDateOfLastVisit(title: string, url: NSURL, dateOfLastVisit: NSDate | null): this;
}

