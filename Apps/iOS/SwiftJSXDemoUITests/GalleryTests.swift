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

    /// Taps a gallery row, scrolling to it first (the list is lazy).
    private func open(_ demo: String) {
        let row = app.buttons.containing(.staticText, identifier: demo).firstMatch
        for _ in 0..<6 where !row.isHittable { app.swipeUp() }
        row.tap()
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
        app.staticTexts["Mars"].tap()
        let facts = label("planet-facts")
        XCTAssert(facts.waitForExistence(timeout: 5))
        XCTAssert(facts.label.contains("Olympus Mons"))
        // Back to the sidebar (compact): React hears it and clears the selection.
        app.navigationBars.buttons.element(boundBy: 0).tap()
        XCTAssert(app.staticTexts["Venus"].waitForExistence(timeout: 5))
        app.staticTexts["Venus"].tap()
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

    private func openApp(_ name: String) { open(name) }

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
        let conversation = element("conversation-row")
        XCTAssert(conversation.waitForExistence(timeout: 5))
        sleep(2)  // connect
        snapshot("chat-list")
        conversation.tap()
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

    func testControls() {
        open("Controls & layout")
        XCTAssert(app.staticTexts["Milk"].waitForExistence(timeout: 5))
        // Swipe to delete (Section onDelete).
        let milk = app.staticTexts["Milk"]
        for _ in 0..<4 where !milk.isHittable { app.swipeUp() }
        app.cells.containing(.staticText, identifier: "Milk").firstMatch.swipeLeft(velocity: .fast)
        snapshot("controls-swiped")
        app.buttons["Delete"].firstMatch.tap()
        XCTAssert(app.staticTexts["Milk"].waitForNonExistence(timeout: 5))
        // Item-based sheet.
        app.staticTexts["Eggs"].tap()
        XCTAssert(app.staticTexts["EDITING EGGS"].waitForExistence(timeout: 5) || app.staticTexts["Editing Eggs"].waitForExistence(timeout: 1))
        snapshot("controls-sheet")
        app.buttons["Done"].tap()
        // Toolbar menu with a submenu.
        app.buttons["More"].tap()
        XCTAssert(app.buttons["Share"].waitForExistence(timeout: 5))
        snapshot("controls-menu")
        app.buttons["Share"].tap()
        XCTAssert(app.buttons["Copy link"].waitForExistence(timeout: 5))
        app.buttons["Copy link"].tap()
        app.swipeUp()
        app.swipeUp()
        XCTAssert(element("mail-badge").waitForExistence(timeout: 5))
        snapshot("controls-bottom")
    }

    func testSettings() {
        openApp("Settings")
        let profile = element("profile-row")
        XCTAssert(profile.waitForExistence(timeout: 5))
        snapshot("settings-root")
        profile.tap()
        let name = app.textFields["name-field"]
        XCTAssert(name.waitForExistence(timeout: 5))
        snapshot("settings-profile")
    }

    func testCalculator() {
        openApp("Calculator")
        XCTAssert(element("key-7").waitForExistence(timeout: 5))
        for key in ["key-7", "key-*", "key-6", "key-="] { element(key).tap() }
        let display = element("display")
        let predicate = NSPredicate(format: "label CONTAINS '42'")
        XCTAssertEqual(XCTWaiter().wait(for: [expectation(for: predicate, evaluatedWith: display)], timeout: 5), .completed,
                       "display: \(display.label)")
        snapshot("calculator")
    }

    func testKanban() {
        openApp("Kanban")
        sleep(2)
        snapshot("kanban-boards")
        let board = app.buttons.containing(NSPredicate(format: "label CONTAINS ' cards'")).firstMatch
        if board.waitForExistence(timeout: 5) { board.tap() }
        sleep(2)
        snapshot("kanban-board")
        XCTAssert(element("card").waitForExistence(timeout: 5))
        sleep(1)
        snapshot("kanban-board")
    }

    func testFitness() {
        openApp("Fitness")
        XCTAssert(element("activity-rings").waitForExistence(timeout: 5))
        sleep(2)
        snapshot("fitness-summary")
        let steps = element("metric-steps")
        for _ in 0..<4 where !steps.isHittable { app.swipeUp() }
        steps.tap()
        XCTAssert(element("range-picker").waitForExistence(timeout: 5))
        sleep(1)
        snapshot("fitness-metric")
    }

    func testMusic() {
        openApp("Music")
        sleep(2)
        snapshot("music-start")
        let search = app.searchFields.firstMatch
        XCTAssert(search.waitForExistence(timeout: 5))
        search.tap()
        search.typeText("Daft Punk")
        let result = element("search-result")
        XCTAssert(result.waitForExistence(timeout: 20), "no results")
        sleep(2)
        snapshot("music-search")
        result.tap()
        XCTAssert(element("mini-player").waitForExistence(timeout: 10))
        sleep(2)
        snapshot("music-playing")
    }

    func testNotes() {
        openApp("Notes")
        let note = element("note-row")
        for _ in 0..<2 where !note.waitForExistence(timeout: 3) {
            app.buttons.containing(NSPredicate(format: "label CONTAINS 'All Notes'")).firstMatch.tap()
        }
        XCTAssert(note.waitForExistence(timeout: 5))
        snapshot("notes-list")
        note.tap()
        XCTAssert(element("note-title").waitForExistence(timeout: 5))
        sleep(1)
        snapshot("notes-editor")
    }

    func testShop() {
        openApp("Shop")
        let card = element("product-card")
        XCTAssert(card.waitForExistence(timeout: 20), "no products")
        sleep(2)
        snapshot("shop-home")
        // onScrollIndexChange drives the page dots' label.
        let carousel = element("featured-carousel")
        XCTAssert(carousel.waitForExistence(timeout: 10))
        carousel.swipeLeft()
        let first = app.descendants(matching: .any).matching(NSPredicate(format: "label BEGINSWITH 'Deal 1 of'")).firstMatch
        XCTAssert(XCTWaiter().wait(for: [expectation(for: NSPredicate(format: "exists == false"), evaluatedWith: first)], timeout: 3) == .completed,
                  "carousel page didn't change")
        card.tap()
        XCTAssert(element("add-to-cart").waitForExistence(timeout: 10))
        sleep(2)
        snapshot("shop-product")
        element("add-to-cart").tap()
        sleep(2)
        snapshot("shop-added")
        element("cart-button").tap()
        sleep(2)
        snapshot("shop-cart")
    }

    func test2048() {
        openApp("2048")
        let board = element("board")
        XCTAssert(board.waitForExistence(timeout: 5))
        sleep(1)
        snapshot("2048-start")
        let moves = element("moves")
        for direction in ["left", "up", "right", "down", "left", "up"] {
            element("move-\(direction)").tap()
            usleep(300_000)
        }
        board.swipeLeft()
        usleep(300_000)
        board.swipeDown()
        sleep(1)
        XCTAssertFalse(moves.label.hasPrefix("0"), "moves: \(moves.label)")
        snapshot("2048-played")
    }

    func testSocial() {
        openApp("Social")
        let post = element("post")
        XCTAssert(post.waitForExistence(timeout: 10))
        sleep(3)
        snapshot("social-feed")
        let like = element("like-button")
        like.tap()
        sleep(1)
        snapshot("social-liked")
        element("story").tap()
        XCTAssert(element("story-viewer").waitForExistence(timeout: 5))
        sleep(2)
        snapshot("social-story")
    }

    func testHabits() {
        openApp("Habits")
        let row = element("habit-row")
        XCTAssert(row.waitForExistence(timeout: 5))
        sleep(1)
        snapshot("habits-today")
        let check = app.descendants(matching: .any).matching(NSPredicate(format: "identifier BEGINSWITH 'complete-'")).firstMatch
        check.tap()
        sleep(1)
        snapshot("habits-checked")
        row.tap()
        XCTAssert(element("month-grid").waitForExistence(timeout: 5))
        sleep(2)
        snapshot("habits-detail")
    }

    func testRecipes() {
        openApp("Recipes")
        let card = element("recipe-card")
        XCTAssert(card.waitForExistence(timeout: 20), "no recipes")
        sleep(2)
        snapshot("recipes-browse")
        card.tap()
        let start = element("start-cooking")
        XCTAssert(start.waitForExistence(timeout: 20))
        sleep(2)
        snapshot("recipes-recipe")
        start.tap()
        XCTAssert(element("step-page").waitForExistence(timeout: 5))
        sleep(1)
        snapshot("recipes-cooking")
    }

    func testCharts() {
        open("Charts")
        let caption = app.staticTexts["Drag across the chart"]
        XCTAssert(caption.waitForExistence(timeout: 5))
        // Scrub across the steps chart (its selection drives the caption).
        let chart = app.otherElements.containing(.staticText, identifier: "Oct 18").firstMatch
        let start = app.coordinate(withNormalizedOffset: CGVector(dx: 0.3, dy: 0.38))
        start.press(forDuration: 0.3, thenDragTo: app.coordinate(withNormalizedOffset: CGVector(dx: 0.6, dy: 0.38)), withVelocity: .slow, thenHoldForDuration: 0.5)
        _ = chart
        snapshot("charts-scrub")
        XCTAssert(app.staticTexts.containing(NSPredicate(format: "label CONTAINS 'steps'")).firstMatch.waitForExistence(timeout: 3))
    }
}
