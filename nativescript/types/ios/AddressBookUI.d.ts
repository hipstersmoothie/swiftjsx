/// <reference types="@nativescript/objc-node-api" />
/// <reference path="./UIKit.d.ts" />

declare const ABPersonNicknameProperty: string;

declare const ABPersonJobTitleProperty: string;

declare const ABPersonBirthdayProperty: string;

declare const ABPersonPhoneticGivenNameProperty: string;

declare const ABPersonPostalAddressesProperty: string;

declare const ABPersonSocialProfilesProperty: string;

declare const ABPersonPhoneNumbersProperty: string;

declare const ABPersonDepartmentNameProperty: string;

declare const ABPersonOrganizationNameProperty: string;

declare const ABPersonPhoneticFamilyNameProperty: string;

declare const ABPersonPreviousFamilyNameProperty: string;

declare const ABPersonMiddleNameProperty: string;

declare const ABPersonGivenNameProperty: string;

declare const ABPersonNamePrefixProperty: string;

declare const ABPersonPhoneticMiddleNameProperty: string;

declare const ABPersonFamilyNameProperty: string;

declare const ABPersonDatesProperty: string;

declare const ABPersonEmailAddressesProperty: string;

declare const ABPersonInstantMessageAddressesProperty: string;

declare const ABPersonRelatedNamesProperty: string;

declare const ABPersonNameSuffixProperty: string;

declare const ABPersonNoteProperty: string;

declare const ABPersonUrlAddressesProperty: string;

declare function ABCreateStringWithAddressDictionary(address: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>, addCountryName: boolean): string;

declare interface ABNewPersonViewControllerDelegate extends NSObjectProtocol {
  newPersonViewControllerDidCompleteWithNewPerson(newPersonView: ABNewPersonViewController, person: interop.Object | null): void;
}

declare class ABNewPersonViewControllerDelegate extends NativeObject implements ABNewPersonViewControllerDelegate {
}

declare interface ABUnknownPersonViewControllerDelegate extends NSObjectProtocol {
  unknownPersonViewControllerDidResolveToPerson(unknownCardViewController: ABUnknownPersonViewController, person: interop.Object | null): void;

  unknownPersonViewControllerShouldPerformDefaultActionForPersonPropertyIdentifier?(personViewController: ABUnknownPersonViewController, person: interop.Object, property: number, identifier: number): boolean;
}

declare class ABUnknownPersonViewControllerDelegate extends NativeObject implements ABUnknownPersonViewControllerDelegate {
}

declare interface ABPersonViewControllerDelegate extends NSObjectProtocol {
  personViewControllerShouldPerformDefaultActionForPersonPropertyIdentifier(personViewController: ABPersonViewController, person: interop.Object, property: number, identifier: number): boolean;
}

declare class ABPersonViewControllerDelegate extends NativeObject implements ABPersonViewControllerDelegate {
}

declare interface ABPeoplePickerNavigationControllerDelegate extends NSObjectProtocol {
  peoplePickerNavigationControllerDidSelectPerson?(peoplePicker: ABPeoplePickerNavigationController, person: interop.Object): void;

  peoplePickerNavigationControllerDidSelectPersonPropertyIdentifier?(peoplePicker: ABPeoplePickerNavigationController, person: interop.Object, property: number, identifier: number): void;

  peoplePickerNavigationControllerDidCancel?(peoplePicker: ABPeoplePickerNavigationController): void;

  peoplePickerNavigationControllerShouldContinueAfterSelectingPerson?(peoplePicker: ABPeoplePickerNavigationController, person: interop.Object): boolean;

  peoplePickerNavigationControllerShouldContinueAfterSelectingPersonPropertyIdentifier?(peoplePicker: ABPeoplePickerNavigationController, person: interop.Object, property: number, identifier: number): boolean;
}

declare class ABPeoplePickerNavigationControllerDelegate extends NativeObject implements ABPeoplePickerNavigationControllerDelegate {
}

declare class ABNewPersonViewController extends UIViewController {
  newPersonViewDelegate: ABNewPersonViewControllerDelegate;

  addressBook: interop.Object;

  displayedPerson: interop.Object;

  parentGroup: interop.Object;
}

declare class ABPersonViewController extends UIViewController implements UIViewControllerRestoration {
  personViewDelegate: ABPersonViewControllerDelegate;

  addressBook: interop.Object;

  displayedPerson: interop.Object;

  get displayedProperties(): NSArray;
  set displayedProperties(value: NSArray<interop.Object> | Array<interop.Object>);

  allowsEditing: boolean;

  allowsActions: boolean;

  shouldShowLinkedPeople: boolean;

  setHighlightedItemForPropertyWithIdentifier(property: number, identifier: number): void;

  static viewControllerWithRestorationIdentifierPathCoder(identifierComponents: NSArray<interop.Object> | Array<interop.Object>, coder: NSCoder): UIViewController;
}

declare class ABUnknownPersonViewController extends UIViewController {
  unknownPersonViewDelegate: ABUnknownPersonViewControllerDelegate;

  addressBook: interop.Object;

  displayedPerson: interop.Object;

  alternateName: string;

  message: string;

  allowsActions: boolean;

  allowsAddingToAddressBook: boolean;
}

declare class ABPeoplePickerNavigationController extends UINavigationController {
  peoplePickerDelegate: ABPeoplePickerNavigationControllerDelegate;

  get displayedProperties(): NSArray;
  set displayedProperties(value: NSArray<interop.Object> | Array<interop.Object>);

  addressBook: interop.Object;

  predicateForEnablingPerson: NSPredicate;

  predicateForSelectionOfPerson: NSPredicate;

  predicateForSelectionOfProperty: NSPredicate;
}

