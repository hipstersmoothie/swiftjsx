import XCTest

/// Drives the gallery like a user: real taps, typing and gestures through
/// SwiftUI, React on the JS thread, and back.
final class GalleryTests: XCTestCase {
    private var app: XCUIApplication!

    override func setUp() {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launch()
    }

    private func open(_ demo: String) {
        app.buttons.containing(.staticText, identifier: demo).firstMatch.tap()
    }

    /// Saved in the result bundle (see Apps/iOS/README.md for exporting them).
    private func snapshot(_ name: String) {
        let attachment = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }

    private func label(_ identifier: String) -> XCUIElement {
        app.staticTexts[identifier]
    }

    private func waitFor(_ element: XCUIElement, label expected: String, timeout: TimeInterval = 5,
                         file: StaticString = #filePath, line: UInt = #line) {
        let predicate = NSPredicate(format: "label == %@", expected)
        let found = XCTWaiter().wait(for: [expectation(for: predicate, evaluatedWith: element)], timeout: timeout) == .completed
        XCTAssert(found, "expected \"\(expected)\", got \"\(element.label)\"", file: file, line: line)
    }

    func testRejectedInputKeepsValueAndFocus() {
        open("Hooks")
        let zip = app.textFields["zip"]
        zip.tap()
        zip.typeText("12a34")
        XCTAssertEqual(zip.value as? String, "1234")
        // Reaching 5 digits adds an opacity prop; deleting one removes it. Typing
        // after each proves the field kept keyboard focus (same SwiftUI identity).
        zip.typeText("5")
        XCTAssertEqual(zip.value as? String, "12345")
        zip.typeText(XCUIKeyboardKey.delete.rawValue)
        XCTAssertEqual(zip.value as? String, "1234")
        zip.typeText("9")
        XCTAssertEqual(zip.value as? String, "12349")
    }

    func testTabs() {
        open("Tabs")
        waitFor(label("unread"), label: "3 unread")
        app.buttons["Read one"].tap()
        waitFor(label("unread"), label: "2 unread")

        app.tabBars.buttons["Pager"].tap()
        waitFor(label("page"), label: "Page 1 of 3")
        app.staticTexts["Welcome"].swipeLeft()
        waitFor(label("page"), label: "Page 2 of 3")

        app.tabBars.buttons["Settings"].tap()
        app.buttons["Go to Inbox"].tap()
        waitFor(label("unread"), label: "2 unread")
    }

    func testGestures() {
        open("Gestures")
        let status = label("gesture-status")
        let heart = app.images["heart"]
        heart.doubleTap()
        waitFor(status, label: "Liked!")
        XCTAssertEqual(heart.value as? String, "liked")

        app.images["bell"].press(forDuration: 1)
        waitFor(status, label: "Long-pressed the bell")

        let card = app.otherElements["drag-card"].exists ? app.otherElements["drag-card"] : app.descendants(matching: .any)["drag-card"]
        let start = card.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5))
        start.press(forDuration: 0.1, thenDragTo: start.withOffset(CGVector(dx: 0, dy: -200)))
        let dropped = NSPredicate(format: "label BEGINSWITH 'Dropped'")
        XCTAssertEqual(XCTWaiter().wait(for: [expectation(for: dropped, evaluatedWith: status)], timeout: 5), .completed,
                       "status: \(status.label)")
    }

    func testSplitView() {
        open("Split view")
        app.buttons["Open split view"].tap()
        app.buttons["Mars"].tap()
        let facts = label("planet-facts")
        XCTAssert(facts.waitForExistence(timeout: 5))
        XCTAssert(facts.label.contains("Olympus Mons"))
        // Back to the sidebar (compact): React hears it and clears the selection.
        app.navigationBars.buttons.element(boundBy: 0).tap()
        XCTAssert(app.buttons["Venus"].waitForExistence(timeout: 5))
        app.buttons["Venus"].tap()
        XCTAssert(facts.waitForExistence(timeout: 5))
        XCTAssert(facts.label.contains("sulfuric"))
    }

    func testRemoteImages() {
        open("Images")
        let count = label("loaded-count")
        let someLoaded = NSPredicate(format: "NOT (label BEGINSWITH '0 of')")
        XCTAssertEqual(XCTWaiter().wait(for: [expectation(for: someLoaded, evaluatedWith: count)], timeout: 20), .completed,
                       "no images loaded (network?): \(count.label)")
        // The "button" trait makes it a button to accessibility.
        app.buttons["Photo 10"].tap()
        XCTAssert(app.images["Photo 10, large"].waitForExistence(timeout: 10))
    }

    // MARK: Toy apps (live network)

    private func openApp(_ name: String) {
        app.buttons.containing(.staticText, identifier: name).firstMatch.tap()
    }

    func testHackerNews() {
        openApp("Hacker News")
        let firstStory = app.buttons.containing(NSPredicate(format: "label CONTAINS '▲'")).firstMatch
        XCTAssert(firstStory.waitForExistence(timeout: 15), "no stories loaded")
        snapshot("hn-feed")
        firstStory.tap()
        XCTAssert(app.buttons["Read article"].waitForExistence(timeout: 10) || app.staticTexts.containing(NSPredicate(format: "label CONTAINS 'points'")).firstMatch.exists)
        sleep(3)  // comments
        snapshot("hn-story")
        app.buttons["Save"].tap()
        app.navigationBars.buttons.element(boundBy: 0).tap()
        app.tabBars.buttons["Saved"].tap()
        XCTAssert(app.buttons.containing(NSPredicate(format: "label CONTAINS '▲'")).firstMatch.waitForExistence(timeout: 5))
        snapshot("hn-saved")
        app.buttons.containing(NSPredicate(format: "label CONTAINS '▲'")).firstMatch.tap()
        app.buttons["Unsave"].tap()
    }

    private func element(_ identifier: String) -> XCUIElement {
        app.descendants(matching: .any)[identifier].firstMatch
    }

    func testTodos() {
        openApp("Todos")
        let firstList = app.buttons.containing(NSPredicate(format: "label CONTAINS 'Inbox'")).firstMatch
        if firstList.waitForExistence(timeout: 5) { firstList.tap() }
        let field = app.textFields["new-todo"]
        XCTAssert(field.waitForExistence(timeout: 5))
        field.tap()
        field.typeText("Buy oat milk\n")
        let row = app.staticTexts["Buy oat milk"]
        XCTAssert(row.waitForExistence(timeout: 5))
        snapshot("todos-list")
        row.swipeLeft()
        snapshot("todos-swipe")
        let delete = app.buttons["Delete"]
        if delete.waitForExistence(timeout: 3) { delete.tap() }
        XCTAssert(row.waitForNonExistence(timeout: 5))
    }

    func testWeather() {
        openApp("Weather")
        let city = element("city-row")
        XCTAssert(city.waitForExistence(timeout: 20), "no cities")
        sleep(2)
        snapshot("weather-cities")
        city.tap()
        XCTAssert(element("current-temp").waitForExistence(timeout: 20))
        sleep(2)
        snapshot("weather-detail")
    }

    func testPokedex() {
        openApp("Pokédex")
        let card = element("pokemon-card")
        XCTAssert(card.waitForExistence(timeout: 20), "no pokemon")
        sleep(3)
        snapshot("pokedex-grid")
        card.tap()
        XCTAssert(element("pokemon-name").waitForExistence(timeout: 20))
        sleep(2)
        snapshot("pokedex-detail")
    }

    func testChat() {
        openApp("Chat")
        let conversation = app.buttons.element(boundBy: 0)
        XCTAssert(app.buttons.firstMatch.waitForExistence(timeout: 5))
        snapshot("chat-list")
        let rows = app.buttons.matching(NSPredicate(format: "label CONTAINS ' '"))
        (rows.count > 0 ? rows.element(boundBy: 0) : conversation).tap()
        let input = app.textFields["message-input"]
        XCTAssert(input.waitForExistence(timeout: 5))
        input.tap()
        input.typeText("Hello from SwiftJSX")
        app.buttons["send-button"].tap()
        XCTAssert(app.staticTexts["Hello from SwiftJSX"].waitForExistence(timeout: 5))
        sleep(4)  // echo + bot reply
        snapshot("chat-conversation")
    }

    func testFlashcards() {
        openApp("Flashcards")
        let deck = element("deck-row")
        XCTAssert(deck.waitForExistence(timeout: 5))
        snapshot("flashcards-decks")
        deck.tap()
        let card = element("study-card")
        XCTAssert(card.waitForExistence(timeout: 5))
        snapshot("flashcards-card")
        card.tap()
        sleep(1)
        snapshot("flashcards-flipped")
        app.buttons["got-it"].tap()
        let start = card.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5))
        start.press(forDuration: 0.1, thenDragTo: start.withOffset(CGVector(dx: -300, dy: 0)))
        sleep(1)
        snapshot("flashcards-after-swipe")
    }
}
