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
        var swiped = false
        // Hittable isn't enough: a row half under the home indicator misses
        // the tap. Scroll in short drags (a swipe can fling it off the top)
        // until it's clear of both edges.
        let window = app.windows.firstMatch.frame
        for _ in 0..<12 {
            let frame = row.exists ? row.frame : .zero
            if row.exists, row.isHittable, frame.maxY < window.maxY - 100, frame.minY > window.minY + 100 { break }
            let up = !row.exists || frame.maxY >= window.maxY - 100
            let from = app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: up ? 0.7 : 0.35))
            from.press(forDuration: 0.05, thenDragTo: app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: up ? 0.4 : 0.65)))
            swiped = true
        }
        // Let the list stop decelerating before tapping.
        if swiped { sleep(1) }
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
        XCTAssert(zip.waitForExistence(timeout: 5))
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

        app.tabBars.buttons["settings-tab"].tap()
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
        // Swipe to delete (Section onDelete). The list is lazy: scroll to it.
        let milk = app.staticTexts["Milk"]
        for _ in 0..<5 where !milk.exists || !milk.isHittable { app.swipeUp() }
        XCTAssert(milk.waitForExistence(timeout: 5))
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
        // A Menu with a custom label: a tap runs onPress, a hold opens it.
        let water = element("water-menu")
        for _ in 0..<4 where !water.isHittable { app.swipeUp() }
        water.tap()
        XCTAssert(app.staticTexts["1"].waitForExistence(timeout: 3), "onPress didn't run")
        water.press(forDuration: 1)
        XCTAssert(app.buttons["Add two"].waitForExistence(timeout: 3))
        snapshot("controls-custom-menu")
        app.buttons["Add two"].tap()
        XCTAssert(app.staticTexts["3"].waitForExistence(timeout: 3))
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
        // (Scrubbing clears on release, like Health's, so it isn't checked
        // here; testCharts covers chart selection.)
        app.buttons["6M"].tap()
        sleep(1)
        snapshot("fitness-6m")
        // The sleep timeline (lane names on the y axis).
        app.navigationBars.buttons.firstMatch.tap()
        let sleepCard = element("metric-sleep")
        for _ in 0..<6 where !(sleepCard.exists && sleepCard.isHittable) { app.swipeUp() }
        sleepCard.tap()
        XCTAssert(element("range-picker").waitForExistence(timeout: 5))
        app.buttons["D"].tap()
        sleep(1)
        snapshot("fitness-sleep-day")
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
        // Arrow keys on a hardware keyboard (onKeyPress).
        let before = moves.label
        for key in [XCUIKeyboardKey.leftArrow, .upArrow, .rightArrow, .downArrow, .leftArrow] {
            app.typeKey(key.rawValue, modifierFlags: [])
            usleep(300_000)
        }
        XCTAssertNotEqual(moves.label, before, "arrow keys didn't move")
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

    func testBluesky() {
        // Screenshots go into the result bundle, and (in the simulator) to
        // $BSKY_SHOTS when it's set, so they survive a run that has to be stopped.
        let folder = ProcessInfo.processInfo.environment["BSKY_SHOTS"] ?? "/tmp/bsky-live"
        try? FileManager.default.createDirectory(atPath: folder, withIntermediateDirectories: true)
        var shots = 0
        func shot(_ name: String) {
            snapshot(name)
            shots += 1
            let file = URL(fileURLWithPath: folder).appendingPathComponent(String(format: "%02d-%@.png", shots, name))
            try? XCUIScreen.main.screenshot().pngRepresentation.write(to: file)
        }
        openApp("Bluesky")
        // The tab bar shows icons only: find its buttons by label, else by identifier.
        // It minimizes to the selected tab while you scroll down (tabBarMinimizeBehavior);
        // tapping the minimized bar expands it again.
        func tab(_ name: String) -> XCUIElement {
            func find() -> XCUIElement {
                let byLabel = app.tabBars.buttons[name]
                return byLabel.exists ? byLabel : app.tabBars.buttons["tab-\(name.lowercased())"]
            }
            for _ in 0..<2 where !find().exists {
                app.tabBars.buttons.firstMatch.tap()
                sleep(1)
            }
            return find()
        }
        // Discover (public AppView, signed out), after the splash.
        let post = element("feed-item")
        XCTAssert(post.waitForExistence(timeout: 25), "no posts loaded")
        sleep(4)  // images
        shot("bsky-feed")

        // Feed tabs: tap one (the pager scrolls to it), then swipe back.
        let scienceTab = element("feed-tab-2")
        if scienceTab.waitForExistence(timeout: 5) {
            scienceTab.tap()
            sleep(4)
            shot("bsky-feed-tabs")
            // Swipe back a page at a time (the pager follows the finger).
            for _ in 0..<2 {
                app.coordinate(withNormalizedOffset: CGVector(dx: 0.25, dy: 0.6))
                    .press(forDuration: 0.05, thenDragTo: app.coordinate(withNormalizedOffset: CGVector(dx: 0.95, dy: 0.6)), withVelocity: .fast, thenHoldForDuration: 0)
                sleep(1)
            }
            sleep(1)
            shot("bsky-feed-swiped-back")
            let discover = element("feed-tab-0")
            if discover.exists && !discover.isSelected { discover.tap(); sleep(2) }
        }
        // Scrolling down tucks the header away (it follows the drag, then snaps);
        // scrolling up brings it back.
        app.swipeUp(velocity: .slow)
        sleep(2)
        shot("bsky-feed-scrolled")
        XCTAssertFalse(element("open-drawer").isHittable, "the header didn't tuck away")
        app.swipeDown(velocity: .slow)
        sleep(2)
        shot("bsky-feed-header-back")
        XCTAssert(element("open-drawer").isHittable, "the header didn't come back")

        // The drawer, from the header's menu button, or a swipe in from the leading edge.
        let drawer = element("drawer-home")
        let openDrawer = element("open-drawer")
        if openDrawer.waitForExistence(timeout: 5) { openDrawer.tap() }
        sleep(2)
        if !(drawer.exists && drawer.isHittable) {
            shot("bsky-debug-drawer-tap")
            app.coordinate(withNormalizedOffset: CGVector(dx: 0.01, dy: 0.55))
                .press(forDuration: 0.05, thenDragTo: app.coordinate(withNormalizedOffset: CGVector(dx: 0.8, dy: 0.55)))
            sleep(2)
        }
        shot("bsky-drawer")
        if drawer.exists && drawer.isHittable { drawer.tap() } else {
            app.coordinate(withNormalizedOffset: CGVector(dx: 0.9, dy: 0.5)).tap()
        }
        sleep(1)
        // The header's Sign in opens the sign-in sheet.
        let signIn = element("toolbar-sign-in")
        if signIn.exists {
            signIn.tap()
            let back = element("sign-in-cancel")
            if back.waitForExistence(timeout: 3) {
                sleep(1)
                shot("bsky-sign-in")
                back.tap()
                sleep(1)
            } else {
                shot("bsky-debug-sign-in-tap")
            }
        }

        // A thread: tap the post's relative time (plain text in the cell, not a button).
        if !post.waitForExistence(timeout: 15) { shot("bsky-debug-no-post") }
        post.staticTexts.matching(NSPredicate(format: "label BEGINSWITH '· '")).firstMatch.tap()
        let focused = element("focused-post")
        XCTAssert(focused.waitForExistence(timeout: 15), "thread didn't open")
        sleep(3)
        shot("bsky-thread")
        app.swipeUp(velocity: .slow)
        sleep(2)
        shot("bsky-thread-replies")
        app.swipeDown(velocity: .fast)
        sleep(1)

        // The author's profile, from the focused post.
        focused.buttons.matching(NSPredicate(format: "label ENDSWITH \"'s profile\"")).firstMatch.tap()
        XCTAssert(element("profile-header").waitForExistence(timeout: 15), "profile didn't open")
        sleep(4)
        shot("bsky-profile")
        // Scrolled: the banner collapses into the bar and the tabs (the list's
        // sticky header) pin under it.
        app.swipeUp(velocity: .slow)
        sleep(2)
        shot("bsky-profile-collapsed")
        let repliesTab = element("profile-tab-replies")
        XCTAssert(repliesTab.exists && repliesTab.isHittable, "the profile's tabs didn't stay on screen")
        // Pinned below the bar's buttons, not under them.
        let options = app.buttons["Profile options"].firstMatch
        if options.exists {
            XCTAssert(repliesTab.frame.minY >= options.frame.maxY - 2, "the pinned tabs are under the navigation bar")
        }
        repliesTab.tap()
        sleep(4)
        shot("bsky-profile-replies")
        // A reply shown under its parent (joined by a thread line) opens a
        // thread with the ancestors above, scrolled to the reply.
        let times = "label BEGINSWITH '· '"
        var withParent: XCUIElement?
        for _ in 0..<4 {
            withParent = app.descendants(matching: .any).matching(identifier: "feed-item").allElementsBoundByIndex
                .first { $0.staticTexts.matching(NSPredicate(format: times)).count >= 2 && $0.staticTexts.matching(NSPredicate(format: times)).element(boundBy: 1).isHittable }
            if withParent != nil { break }
            app.swipeUp(velocity: .slow)
            sleep(1)
        }
        if let item = withParent {
            shot("bsky-profile-reply-with-parent")
            // A tap while the list still coasts from the swipe only stops it: tap again.
            let time = item.staticTexts.matching(NSPredicate(format: times)).element(boundBy: 1)
            time.tap()
            if !element("focused-post").waitForExistence(timeout: 4), time.exists { time.tap() }
            XCTAssert(element("focused-post").waitForExistence(timeout: 15), "reply thread didn't open")
            sleep(3)
            shot("bsky-thread-ancestors")
            app.navigationBars.buttons.element(boundBy: 0).tap()
            sleep(1)
        }
        // The Media tab, from the pinned tabs.
        let media = element("profile-tab-media")
        XCTAssert(media.waitForExistence(timeout: 5) && media.isHittable, "the profile's tabs aren't pinned")
        media.tap()
        sleep(4)
        shot("bsky-profile-media")
        // Back to Home's root (the feed), still on the feed we left (Discover).
        for _ in 0..<4 where !(element("open-drawer").exists && element("open-drawer").isHittable) {
            app.navigationBars.buttons.element(boundBy: 0).tap()
            sleep(1)
        }
        XCTAssert(element("feed-tab-0").isSelected, "Home came back on another feed")

        // Explore: trending topics, suggested accounts and feeds; then people as you type.
        tab("Search").tap()
        XCTAssert(element("trending-topic").waitForExistence(timeout: 15), "no trending topics")
        sleep(4)
        shot("bsky-search")
        app.swipeUp(velocity: .slow)
        sleep(2)
        shot("bsky-explore-more")
        app.swipeDown(velocity: .fast)
        sleep(1)
        let search = app.searchFields.firstMatch
        XCTAssert(search.waitForExistence(timeout: 5))
        search.tap()
        search.typeText("jay")
        XCTAssert(element("actor-row").waitForExistence(timeout: 15), "no typeahead results")
        sleep(3)
        shot("bsky-search-typeahead")
        // Put the field (and the keyboard) away so the tab bar comes back.
        for name in ["Cancel", "Close"] where app.buttons[name].exists {
            app.buttons[name].firstMatch.tap()
            break
        }
        sleep(1)

        // Signed out: notifications and profile ask you to sign in.
        tab("Notifications").tap()
        XCTAssert(element("notifications-signed-out").waitForExistence(timeout: 5))
        shot("bsky-notifications-signed-out")
        tab("Profile").tap()
        XCTAssert(element("sign-in-card").waitForExistence(timeout: 5))
        shot("bsky-me-signed-out")
        // Dark mode is Dim by default; then Dark (black). From the app's own settings.
        element("color-mode-dark").tap()
        sleep(1)
        shot("bsky-settings-dim")
        tab("Home").tap()
        sleep(2)
        shot("bsky-feed-dim")
        tab("Profile").tap()
        element("dark-theme-dark").tap()
        tab("Home").tap()
        sleep(2)
        shot("bsky-feed-dark")
        tab("Profile").tap()
        element("dark-theme-dim").tap()
        element("color-mode-system").tap()

        // The image viewer, from the first image in the feed: it zooms out of the thumbnail.
        tab("Home").tap()
        sleep(1)
        if element("feed-tab-0").exists { element("feed-tab-0").tap(); sleep(3) }
        let image = element("post-image")
        for _ in 0..<8 where !(image.exists && image.isHittable) {
            app.swipeUp(velocity: .slow)
        }
        if image.exists && image.isHittable {
            image.tap()
            usleep(150_000)
            shot("bsky-image-viewer-opening")
            XCTAssert(element("image-viewer").waitForExistence(timeout: 5), "viewer didn't open")
            sleep(3)
            shot("bsky-image-viewer")
            // A short, slow drag follows the finger and springs back.
            let middle = app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5))
            middle.press(forDuration: 0.1, thenDragTo: middle.withOffset(CGVector(dx: 0, dy: 60)), withVelocity: .slow, thenHoldForDuration: 0.3)
            sleep(1)
            XCTAssert(element("close-viewer").exists, "a short drag dismissed the viewer")
            app.swipeDown(velocity: .fast)
            XCTAssert(element("image-viewer").waitForNonExistence(timeout: 5), "swipe down didn't dismiss")
        }
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
        app.navigationBars.buttons.element(boundBy: 0).tap()

        // A form with unsaved changes can't be swiped away
        // (interactiveDismissDisabled set from inside the sheet).
        element("add-habit").tap()
        let name = element("habit-name")
        XCTAssert(name.waitForExistence(timeout: 5))
        name.tap()
        name.typeText("Stretch")
        app.navigationBars["New Habit"].swipeDown(velocity: .fast)
        sleep(1)
        XCTAssert(name.exists, "the dirty form was swiped away")
        // …and the swipe asks whether to discard (onDismissAttempt).
        let discard = app.buttons["Discard Changes"]
        XCTAssert(discard.waitForExistence(timeout: 3), "no discard prompt")
        snapshot("habits-discard-prompt")
        discard.tap()
        XCTAssert(name.waitForNonExistence(timeout: 3))
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
        // Built-in speech: reading aloud flips the button to "Stop reading"
        // while words are highlighted, and back when it finishes or stops.
        let read = element("read-aloud")
        read.tap()
        XCTAssert(XCTWaiter().wait(for: [expectation(for: NSPredicate(format: "label == 'Stop reading'"), evaluatedWith: read)], timeout: 5) == .completed,
                  "not reading: \(read.label)")
        sleep(2)
        snapshot("recipes-reading")
        read.tap()
        XCTAssert(XCTWaiter().wait(for: [expectation(for: NSPredicate(format: "label == 'Read this step aloud'"), evaluatedWith: read)], timeout: 5) == .completed)
    }

    func testAnimation() {
        open("Animation")
        sleep(2)
        snapshot("animation-start")
        XCTAssert(element("tile-1").waitForExistence(timeout: 5))
        let status = element("animation-status")
        element("shuffle").tap()
        XCTAssert(XCTWaiter().wait(for: [expectation(for: NSPredicate(format: "label CONTAINS 'finished: 1'"), evaluatedWith: status)], timeout: 5) == .completed,
                  "withAnimation completion: \(status.label)")
        element("add-tile").tap()
        XCTAssert(element("tile-4").waitForExistence(timeout: 3))
        snapshot("animation-shuffled")
        element("tile-2").tap()
        XCTAssert(XCTWaiter().wait(for: [expectation(for: NSPredicate(format: "label CONTAINS 'exited: 1'"), evaluatedWith: status)], timeout: 5) == .completed,
                  "exit: \(status.label)")
        XCTAssert(element("tile-2").waitForNonExistence(timeout: 3))
        snapshot("animation-exited")
        let card = element("flip-card")
        for _ in 0..<3 where !card.isHittable { app.swipeUp() }
        card.tap()
        XCTAssert(XCTWaiter().wait(for: [expectation(for: NSPredicate(format: "label == 'Back'"), evaluatedWith: card)], timeout: 3) == .completed)
        element("shake").tap()
        element("pop").tap()
        usleep(150_000)
        snapshot("animation-flip-pop")
    }

    func testFocusAndSelection() {
        open("Controls & layout")
        let first = app.textFields["first-field"], second = app.textFields["second-field"]
        XCTAssert(first.waitForExistence(timeout: 5))
        first.tap()
        first.typeText("hello")
        // Controlled focus: state moves it to the second field.
        element("next-field").tap()
        XCTAssert(XCTWaiter().wait(for: [expectation(for: NSPredicate(format: "hasKeyboardFocus == true"), evaluatedWith: second)], timeout: 3) == .completed,
                  "focus didn't move")
        second.typeText("world")
        XCTAssertEqual(second.value as? String, "world")
        // setSelection, then insert at the cursor.
        element("cursor-start").tap()
        element("insert-star").tap()
        XCTAssert(XCTWaiter().wait(for: [expectation(for: NSPredicate(format: "value == '★hello'"), evaluatedWith: first)], timeout: 3) == .completed,
                  "got \(first.value ?? "nil")")
        first.typeText("!")
        XCTAssertEqual(first.value as? String, "★!hello", "the cursor should sit after the inserted star")
        snapshot("focus-selection")
    }

    func testTodosSearch() {
        openApp("Todos")
        let search = app.searchFields.firstMatch
        XCTAssert(search.waitForExistence(timeout: 5))
        search.tap()
        // Suggestions (list names) before typing; scopes while searching.
        let suggestion = app.buttons.containing(NSPredicate(format: "label CONTAINS 'Inbox'")).firstMatch
        XCTAssert(suggestion.waitForExistence(timeout: 3), "no suggestions")
        snapshot("todos-search-suggestions")
        // The suggestion, not the hidden list row of the same name behind it.
        let visible = app.buttons.matching(NSPredicate(format: "label CONTAINS 'Inbox'")).allElementsBoundByIndex.first { $0.isHittable }
        XCTAssertNotNil(visible)
        visible?.tap()
        XCTAssert(XCTWaiter().wait(for: [expectation(for: NSPredicate(format: "value CONTAINS 'Inbox'"), evaluatedWith: search)], timeout: 3) == .completed)
        snapshot("todos-search-results")
        XCTAssert(app.segmentedControls.buttons["Done"].waitForExistence(timeout: 3), "no scopes")
    }

    func testPortal() {
        open("Animation")
        let openSheet = element("open-portal-sheet")
        for _ in 0..<4 where !openSheet.isHittable { app.swipeUp() }
        openSheet.tap()
        XCTAssert(element("show-toasts").waitForExistence(timeout: 5))
        element("show-toasts").tap()
        // Drawn above the presented sheet.
        XCTAssert(element("center-toast").waitForExistence(timeout: 3), "toast not shown")
        sleep(1)
        snapshot("portal-over-sheet")
        // The non-interactive toast lets taps through to the sheet's button.
        let through = element("tap-through")
        through.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
        XCTAssert(XCTWaiter().wait(for: [expectation(for: NSPredicate(format: "label CONTAINS 'through 1'"), evaluatedWith: through)], timeout: 3) == .completed,
                  "tap didn't reach the sheet: \(through.label)")
        // The interactive one takes its own taps.
        element("toast-undo").tap()
        XCTAssert(XCTWaiter().wait(for: [expectation(for: NSPredicate(format: "label == 'Undone'"), evaluatedWith: element("undo-state"))], timeout: 3) == .completed)
        XCTAssert(element("center-toast").waitForNonExistence(timeout: 3))
    }

    func testButtonLongPressInScrollView() {
        open("Animation")
        checkTapOrHold(element("tap-or-hold-scroll"))
    }

    func testButtonLongPress() {
        open("Controls & layout")
        checkTapOrHold(element("tap-or-hold"))
    }

    private func checkTapOrHold(_ button: XCUIElement) {
        for _ in 0..<5 where !button.isHittable { app.swipeUp() }
        button.tap()
        XCTAssert(XCTWaiter().wait(for: [expectation(for: NSPredicate(format: "label == 'Taps 1 · holds 0'"), evaluatedWith: button)], timeout: 3) == .completed,
                  button.label)
        button.press(forDuration: 1.2)
        XCTAssert(XCTWaiter().wait(for: [expectation(for: NSPredicate(format: "label == 'Taps 1 · holds 1'"), evaluatedWith: button)], timeout: 3) == .completed,
                  "a hold should fire onLongPress only: \(button.label)")
        button.tap()
        XCTAssert(XCTWaiter().wait(for: [expectation(for: NSPredicate(format: "label == 'Taps 2 · holds 1'"), evaluatedWith: button)], timeout: 3) == .completed,
                  "the next tap should count: \(button.label)")
    }

    func testDragAxis() {
        open("Animation")
        let card = element("swipe-card")
        XCTAssert(card.waitForExistence(timeout: 5))
        // Sideways: the card's drag.
        let start = card.coordinate(withNormalizedOffset: CGVector(dx: 0.3, dy: 0.5))
        start.press(forDuration: 0.05, thenDragTo: card.coordinate(withNormalizedOffset: CGVector(dx: 0.95, dy: 0.5)))
        XCTAssert(XCTWaiter().wait(for: [expectation(for: NSPredicate(format: "label CONTAINS 'last: right'"), evaluatedWith: card)], timeout: 3) == .completed,
                  card.label)
        // Up and down, starting on the card: the page scrolls.
        let before = card.frame.minY
        card.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5))
            .press(forDuration: 0.05, thenDragTo: app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.1)))
        sleep(1)
        XCTAssertLessThan(card.frame.minY, before - 50, "a vertical drag on the card should scroll the page")
        XCTAssert(card.label.contains("last: right"), "a vertical drag shouldn't swipe the card")
    }

    func testRichText() {
        open("Controls & layout")
        let rich = element("rich-text")
        for _ in 0..<5 where !rich.exists || !rich.isHittable { app.swipeUp() }
        XCTAssert(rich.waitForExistence(timeout: 5))
        // A tappable run is a link.
        app.links["@swiftjsx"].firstMatch.tap()
        XCTAssert(XCTWaiter().wait(for: [expectation(for: NSPredicate(format: "label CONTAINS 'mentions tapped: 1'"), evaluatedWith: rich)], timeout: 3) == .completed, rich.label)
        // A Markdown link goes to onOpenURL, not the system.
        app.links["open user 42"].firstMatch.tap()
        XCTAssert(XCTWaiter().wait(for: [expectation(for: NSPredicate(format: "label CONTAINS 'opened app://user/42'"), evaluatedWith: element("link-text"))], timeout: 3) == .completed)
        // Truncation shows "more"; expanding hides it.
        let more = element("more")
        XCTAssert(more.waitForExistence(timeout: 3), "not reported as truncated")
        snapshot("rich-text")
        more.tap()
        XCTAssert(more.waitForNonExistence(timeout: 3))
    }

    func testSwipeActionsOutsideList() {
        open("Animation")
        let row = element("swipe-row-2")
        XCTAssert(row.waitForExistence(timeout: 5))
        // Swipe left: Flag and Delete appear; Flag flags it and closes.
        row.coordinate(withNormalizedOffset: CGVector(dx: 0.8, dy: 0.5))
            .press(forDuration: 0.05, thenDragTo: row.coordinate(withNormalizedOffset: CGVector(dx: 0.45, dy: 0.5)))
        let flag = element("flag-2")
        XCTAssert(flag.waitForExistence(timeout: 3) && flag.isHittable, "actions not revealed")
        snapshot("swipe-open")
        flag.tap()
        sleep(1)
        // Swipe right: Pin.
        row.coordinate(withNormalizedOffset: CGVector(dx: 0.2, dy: 0.5))
            .press(forDuration: 0.05, thenDragTo: row.coordinate(withNormalizedOffset: CGVector(dx: 0.55, dy: 0.5)))
        XCTAssert(element("pin-2").waitForExistence(timeout: 3))
        element("pin-2").tap()
        sleep(1)
        // A full swipe deletes.
        row.coordinate(withNormalizedOffset: CGVector(dx: 0.95, dy: 0.5))
            .press(forDuration: 0.05, thenDragTo: row.coordinate(withNormalizedOffset: CGVector(dx: 0.0, dy: 0.5)), withVelocity: .fast, thenHoldForDuration: 0)
        XCTAssert(row.waitForNonExistence(timeout: 3), "full swipe didn't delete")
        snapshot("swipe-deleted")
    }

    func testHackerNewsSwipeToSave() {
        openApp("Hacker News")
        let story = app.cells.containing(NSPredicate(format: "label CONTAINS '▲'")).firstMatch
        XCTAssert(story.waitForExistence(timeout: 15), "no stories loaded")
        // UIKit swipe actions on the list-style VirtualList.
        story.swipeLeft()
        let save = app.buttons["Save"]
        XCTAssert(save.waitForExistence(timeout: 3), "no swipe action")
        snapshot("hn-swipe")
        save.tap()
        app.tabBars.buttons["Saved"].tap()
        XCTAssert(app.buttons.containing(NSPredicate(format: "label CONTAINS '▲'")).firstMatch.waitForExistence(timeout: 5), "not saved")
        // Clean up: unsave from the Saved list's own swipe.
        app.cells.containing(NSPredicate(format: "label CONTAINS '▲'")).firstMatch.swipeLeft()
        if app.buttons["Unsave"].waitForExistence(timeout: 3) { app.buttons["Unsave"].tap() }
    }

    func testCodeEntryDeleteBackward() {
        open("Controls & layout")
        let first = app.textFields["code-0"]
        for _ in 0..<5 where !first.exists || !first.isHittable { app.swipeUp() }
        XCTAssert(first.waitForExistence(timeout: 5))
        first.tap()
        // A digit at a time (focus moves to the next box in between).
        for (digit, next) in [("1", "code-1"), ("2", "code-2")] {
            app.typeText(digit)
            XCTAssert(XCTWaiter().wait(for: [expectation(for: NSPredicate(format: "hasKeyboardFocus == true"), evaluatedWith: app.textFields[next])], timeout: 3) == .completed,
                      "typing should advance to \(next)")
        }
        // Delete in the empty third box: back to the second, clearing it.
        app.keys["Delete"].tap()
        XCTAssert(XCTWaiter().wait(for: [expectation(for: NSPredicate(format: "value == '' OR value == nil"), evaluatedWith: app.textFields["code-1"])], timeout: 3) == .completed,
                  "got \(app.textFields["code-1"].value ?? "nil")")
        XCTAssertEqual(app.textFields["code-0"].value as? String, "1")
    }

    func testMoreControls() {
        open("Controls & layout")
        let servings = element("servings")
        for _ in 0..<5 where !servings.exists || !servings.isHittable { app.swipeUp() }
        XCTAssert(servings.waitForExistence(timeout: 5))
        // Wheel picker with number values.
        app.pickerWheels.firstMatch.adjust(toPickerWheelValue: "4 servings")
        XCTAssert(XCTWaiter().wait(for: [expectation(for: NSPredicate(format: "label == 'servings is a number: 4'"), evaluatedWith: servings)], timeout: 3) == .completed,
                  servings.label)
        snapshot("more-controls")
        // ShareLink opens the share sheet.
        element("share-link").tap()
        let close = app.buttons["Close"]
        XCTAssert(close.waitForExistence(timeout: 5) || app.otherElements["ActivityListView"].waitForExistence(timeout: 1), "no share sheet")
        snapshot("share-sheet")
        if close.exists { close.tap() }
    }

    func testMedia() {
        open("Media")
        // The video loads (Apple's sample stream).
        XCTAssert(XCTWaiter().wait(for: [expectation(for: NSPredicate(format: "label BEGINSWITH 'ready'"), evaluatedWith: element("video-status"))], timeout: 20) == .completed,
                  element("video-status").label)
        // The web page loads and its button posts a message to React.
        let message = element("web-message")
        XCTAssert(XCTWaiter().wait(for: [expectation(for: NSPredicate(format: "label BEGINSWITH 'loaded'"), evaluatedWith: message)], timeout: 10) == .completed)
        app.webViews.buttons["Send a message"].tap()
        XCTAssert(XCTWaiter().wait(for: [expectation(for: NSPredicate(format: "label CONTAINS 'clicked'"), evaluatedWith: message)], timeout: 5) == .completed, message.label)
        snapshot("media")
        // A UIKit view made in JS (AVRoutePickerView), hosted in SwiftUI.
        XCTAssert(element("route-picker").exists, "the native route picker")
        // A tap on the map moves it, and onRegionChange reports where.
        let map = element("map")
        for _ in 0..<3 where !map.isHittable { app.swipeUp() }
        map.tap()
        XCTAssert(XCTWaiter().wait(for: [expectation(for: NSPredicate(format: "label BEGINSWITH 'Centered on'"), evaluatedWith: element("map-center"))], timeout: 10) == .completed)
        snapshot("media-map")
    }

    func testDragAndDrop() {
        open("Animation")
        let apple = element("fruit-🍎")
        XCTAssert(apple.waitForExistence(timeout: 5))
        // A system drag: hold to lift, then move onto the basket.
        apple.press(forDuration: 1.0, thenDragTo: element("basket"), withVelocity: .slow, thenHoldForDuration: 0.5)
        XCTAssert(XCTWaiter().wait(for: [expectation(for: NSPredicate(format: "label CONTAINS '🍎'"), evaluatedWith: element("basket-contents"))], timeout: 5) == .completed,
                  element("basket-contents").label)
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
    func testPressInOut() {
        open("Animation")
        let card = element("hold-to-pause")
        for _ in 0..<6 where !(card.exists && card.isHittable) { app.swipeUp() }
        XCTAssert(card.waitForExistence(timeout: 5))
        card.press(forDuration: 1)
        XCTAssert(XCTWaiter().wait(for: [expectation(for: NSPredicate(format: "label CONTAINS 'Last press: released'"), evaluatedWith: card)], timeout: 3) == .completed,
                  card.label)
        // A drag that starts on it scrolls the page and cancels the press.
        let before = card.frame.minY
        card.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5))
            .press(forDuration: 0.05, thenDragTo: app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.15)))
        sleep(1)
        XCTAssertLessThan(card.frame.minY, before - 50, "a drag on the card should still scroll")
        XCTAssert(card.label.contains("Last press: cancelled"), card.label)
    }

    func testScrollingChart() {
        open("Charts")
        let chart = element("scroll-chart")
        for _ in 0..<4 where !(chart.exists && chart.isHittable) { app.swipeUp() }
        XCTAssert(chart.waitForExistence(timeout: 5))
        let status = label("scroll-chart-status")
        let start = status.label
        snapshot("chart-scroll-before")
        chart.swipeRight()
        sleep(2)
        snapshot("chart-scroll-after")
        XCTAssertNotEqual(status.label, start, "scrolling the chart should move its position")
    }

    func testTimeAndLabeledContent() {
        open("Controls & layout")
        let value = app.staticTexts["7:30"]
        for _ in 0..<6 where !(value.exists && value.isHittable) { app.swipeUp() }
        XCTAssert(value.waitForExistence(timeout: 5))
        XCTAssert(app.staticTexts["Wake up"].exists, "the LabeledContent's view label")
        // minuteInterval: a UIDatePicker listing every 5 minutes.
        XCTAssert(app.datePickers.firstMatch.exists, "the interval time picker")
        snapshot("time-picker")
    }
    func testMaterialCard() {
        open("Shapes, colors & fonts")
        let card = element("material-card")
        for _ in 0..<6 where !(card.exists && card.isHittable) { app.swipeUp() }
        XCTAssert(card.waitForExistence(timeout: 5))
        sleep(1)
        snapshot("material-card")
        XCTAssert(app.staticTexts["secondary stays vibrant"].exists)
        // The sparkline morphs to new values.
        app.swipeDown()
        let spark = element("sparkline")
        for _ in 0..<4 where !(spark.exists && spark.isHittable) { app.swipeDown() }
        spark.tap()
        snapshot("sparkline-morphing")
        sleep(1)
        snapshot("sparkline-morphed")
    }
    func testCanvas() {
        open("Canvas")
        let pad = element("drawing-pad")
        XCTAssert(pad.waitForExistence(timeout: 5))
        // Two strokes, drawn by worklets on the main thread.
        pad.coordinate(withNormalizedOffset: CGVector(dx: 0.2, dy: 0.3))
            .press(forDuration: 0.05, thenDragTo: pad.coordinate(withNormalizedOffset: CGVector(dx: 0.8, dy: 0.6)))
        pad.coordinate(withNormalizedOffset: CGVector(dx: 0.2, dy: 0.8))
            .press(forDuration: 0.05, thenDragTo: pad.coordinate(withNormalizedOffset: CGVector(dx: 0.7, dy: 0.2)))
        XCTAssert(XCTWaiter().wait(for: [expectation(for: NSPredicate(format: "label == '2 strokes'"), evaluatedWith: label("stroke-count"))], timeout: 5) == .completed,
                  label("stroke-count").label)
        app.buttons["Shuffle bars"].tap()
        snapshot("canvas-springing")
        sleep(2)
        snapshot("canvas")
    }

    func testWorkletAnimations() {
        open("Animation")
        let puck = element("puck")
        for _ in 0..<8 where !(puck.exists && puck.isHittable) { app.swipeUp() }
        XCTAssert(puck.waitForExistence(timeout: 5))
        app.buttons["ring-bell"].tap()
        snapshot("bell-ringing")
        // A fast flick right: decay to the right edge, then a spring home.
        puck.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5))
            .press(forDuration: 0.02, thenDragTo: puck.coordinate(withNormalizedOffset: CGVector(dx: 2.5, dy: 0.5)), withVelocity: .fast, thenHoldForDuration: 0)
        snapshot("puck-flicked")
        let side = label("puck-side")
        XCTAssert(XCTWaiter().wait(for: [expectation(for: NSPredicate(format: "label ENDSWITH 'edge hits: 1'"), evaluatedWith: side)], timeout: 5) == .completed, side.label)
        // Then the decay's callback springs it home.
        sleep(2)
        snapshot("puck-home")
        let middle = element("puck").frame.midX
        XCTAssertEqual(middle, app.windows.firstMatch.frame.midX, accuracy: 30, "the puck springs back to the middle")
    }
    func testVirtualListInitialScrollIndex() {
        open("Virtual list")
        app.buttons["More"].tap()
        app.buttons["Thread"].tap()
        let focused = element("focused-row")
        XCTAssert(focused.waitForExistence(timeout: 5))
        // The ancestors load above it half a second later; it stays at the top.
        sleep(2)
        snapshot("thread-list")
        let navBottom = app.navigationBars.firstMatch.frame.maxY
        XCTAssertEqual(focused.frame.minY, navBottom, accuracy: 24, "the focused row stays at the top")
        XCTAssertFalse(app.staticTexts["Ancestor 7"].isHittable, "the ancestors are above, out of view")
        // Scrolling up shows them.
        app.swipeDown()
        sleep(1)
        XCTAssert(app.staticTexts["Ancestor 7"].isHittable)
    }
    func testVirtualListKeepsPositionOnInsert() {
        open("Virtual list")
        app.buttons["More"].tap()
        app.buttons["New posts"].tap()
        XCTAssert(element("post-0").waitForExistence(timeout: 5))
        // Read a few posts down.
        app.swipeUp(velocity: .slow)
        sleep(2)
        let reading = app.descendants(matching: .any).matching(NSPredicate(format: "identifier BEGINSWITH 'post-'")).allElementsBoundByIndex
            .first { $0.isHittable && $0.frame.minY > 200 }
        guard let reading else { return XCTFail("no post on screen") }
        let id = reading.identifier
        let before = reading.frame.minY
        app.buttons["Load newer"].tap()
        sleep(2)
        snapshot("new-posts-kept")
        XCTAssertEqual(element(id).frame.minY, before, accuracy: 6, "\(id) stays where it was")
        XCTAssertFalse(element("post--1").exists && element("post--1").isHittable, "the new posts are above, out of view")
    }
}
