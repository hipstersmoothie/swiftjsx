/// <reference types="@nativescript/objc-node-api" />
/// <reference path="./Runtime.d.ts" />
/// <reference path="./UIKit.d.ts" />

declare const MFMessageComposeViewControllerTextMessageAvailabilityKey: string;

declare const MFMessageComposeViewControllerAttachmentAlternateFilename: string;

declare const MFMessageComposeViewControllerAttachmentURL: string;

declare const MFMessageComposeViewControllerTextMessageAvailabilityDidChangeNotification: string;

declare const MFMailComposeErrorDomain: string;

declare const MFMailComposeErrorCode: {
  Save: 0,
  Send: 1,
};

declare const MFMailComposeResult: {
  Cancelled: 0,
  Saved: 1,
  Sent: 2,
  Failed: 3,
};

declare const MFMailComposeControllerDeferredAction: {
  None: 0,
  AdjustInsertionPoint: 1,
  AddMissingRecipients: 2,
};

declare const MessageComposeResult: {
  Cancelled: 0,
  Sent: 1,
  Failed: 2,
};

declare interface MFMessageComposeViewControllerDelegate extends NSObjectProtocol {
  messageComposeViewControllerDidFinishWithResult(controller: MFMessageComposeViewController, result: interop.Enum<typeof MessageComposeResult>): void;
}

declare class MFMessageComposeViewControllerDelegate extends NativeObject implements MFMessageComposeViewControllerDelegate {
}

declare interface MFComposeAssistantViewControllerDelegate extends NSObjectProtocol {
  composeAssistantViewControllerDidComposeDraft(controller: MFComposeAssistantViewController, draft: MFMailDraft): void;
}

declare class MFComposeAssistantViewControllerDelegate extends NativeObject implements MFComposeAssistantViewControllerDelegate {
}

declare interface MFMailComposeViewControllerDelegate extends NSObjectProtocol {
  mailComposeControllerDidFinishWithResultError?(controller: MFMailComposeViewController, result: interop.Enum<typeof MFMailComposeResult>, error: NSError | null): void;
}

declare class MFMailComposeViewControllerDelegate extends NativeObject implements MFMailComposeViewControllerDelegate {
}

declare class MFMailComposeViewController extends UINavigationController {
  static canSendMail(): boolean;

  mailComposeDelegate: MFMailComposeViewControllerDelegate;

  setSubject(subject: string): void;

  setToRecipients(toRecipients: NSArray<interop.Object> | Array<interop.Object> | null): void;

  setCcRecipients(ccRecipients: NSArray<interop.Object> | Array<interop.Object> | null): void;

  setBccRecipients(bccRecipients: NSArray<interop.Object> | Array<interop.Object> | null): void;

  setMessageBodyIsHTML(body: string, isHTML: boolean): void;

  addAttachmentDataMimeTypeFileName(attachment: NSData, mimeType: string, filename: string): void;

  setPreferredSendingEmailAddress(emailAddress: string): void;

  insertCollaborationItemProviderCompletionHandler(itemProvider: NSItemProvider, completionHandler: (p1: boolean) => void): void;
}

declare class MFComposeAssistantViewController extends UIViewController {
  initWithDelegate(delegate: MFComposeAssistantViewControllerDelegate): this;
}

declare class MFMailDraft extends NSObject {
  readonly from: string;

  readonly subject: string;

  readonly body: NSAttributedString;

  readonly to: NSArray;

  readonly cc: NSArray;

  initWithSubjectBodyFromToCc(subject: string, body: NSAttributedString, from: string, to: NSArray<interop.Object> | Array<interop.Object>, cc: NSArray<interop.Object> | Array<interop.Object>): this;
}

declare class MFMessageComposeViewController extends UINavigationController {
  static canSendText(): boolean;

  static canSendSubject(): boolean;

  static canSendAttachments(): boolean;

  static isSupportedAttachmentUTI(uti: string): boolean;

  messageComposeDelegate: MFMessageComposeViewControllerDelegate;

  disableUserAttachments(): void;

  get recipients(): NSArray;
  set recipients(value: NSArray<interop.Object> | Array<interop.Object>);

  body: string;

  subject: string;

  readonly attachments: NSArray;

  message: MSMessage;

  addAttachmentURLWithAlternateFilename(attachmentURL: NSURL, alternateFilename: string | null): boolean;

  addAttachmentDataTypeIdentifierFilename(attachmentData: NSData, uti: string, filename: string): boolean;

  insertCollaborationItemProvider(itemProvider: NSItemProvider): boolean;

  setUPIVerificationCodeSendCompletion(completion: (p1: boolean) => void): void;
}

