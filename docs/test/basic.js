/* global
JoelPurra,
jQuery,
console,
QUnit,
*/

(function($)
{
    var $container;

    // Tab focus emulation
    function getSimulatedTabkeyEventOptions(shift)
    {
        shift = !!shift;

        var key = {
                // Cannot use "which" with $.simulate
            keyCode: $.simulate.keyCode.TAB,
            shiftKey: shift,
        };

        return key;
    }

    // Keyboard simulation
    // DEBUG
    function logArguments()
    {
        try
        {
            /* eslint-disable no-console */
            console.log(arguments);
            /* eslint-enable no-console */
        }
        catch (e)
        {
            // Could show an alert message, but what the hell
        }
    }

    function performDeferredAsync(fnc, timeout)
    {
        var deferred = new $.Deferred();

        setTimeout($.proxy(function()
        {
            try
            {
                var result = fnc();

                deferred.resolve(result);
            }
            catch (e)
            {
                deferred.reject(e);
            }
        }, this), timeout);

        return deferred.promise();
    }

    function deferredEvent(eventName, $element, fnc)
    {
        function resolveEvent(event)
        {
            deferred.resolve(event);
        }

        var deferred = new $.Deferred();

        try
        {
            $element.one(eventName + ".deferredPressKey", resolveEvent);
            fnc();
        }
        catch (e)
        {
            deferred.reject(e);
        }

        return deferred.promise();
    }

    function deferredPressKey(eventName, $element, key)
    {
        return deferredEvent(eventName, $element, function() {
            $element.simulate(eventName, key);
        });
    }

    function pressKeyDown($element, key, keyDownAction)
    {
        keyDownAction = keyDownAction || $.noop;

        return deferredPressKey("keydown", $element, key)
            .pipe(keyDownAction);
    }

    function pressKeyPress($element, key)
    {
        return deferredPressKey("keypress", $element, key);
    }

    function pressKeyUp($element, key)
    {
        return deferredPressKey("keyup", $element, key);
    }

    function pressKey($element, key, keyDownAction)
    {
        return pressKeyDown($element, key, keyDownAction)
            .pipe(function()
            {
                return pressKeyPress($element, key)
                    .pipe(function()
                        {
                        return pressKeyUp($element, key);
                    });
            });
    }

    // Tab simulation
    // Can't actually trigger the TAB key in the browser,
    // so simulate by focusing the next element
    // NOTE: this is pretty bad as it's using the internals
    // of SkipOnTab/PlusAsTab - might be better to find a way to make
    // the browser do it.
    // TRY: Flash, Java applet, Silverlight, ActiveX, browser plugin
    function pressTab($element, shift)
    {
        shift = !!shift;

        var key = getSimulatedTabkeyEventOptions(shift);

        return pressKey(
            $element,
            key, function()
            {
                $element.emulateTab((shift ? -1 : 1));
            }
        );
    }

    // Simulated keypress helpers
    function getSimulatedKeyEventOptions(keyCode, shift)
    {
        shift = !!shift;

        var key
                = {
                    // Cannot use "which" with $.simulate
                    keyCode: keyCode,
                    shiftKey: shift,
                };

        return key;
    }

    function pressSimulatedKeyCode($element, keyCode, shift)
    {
        var key = getSimulatedKeyEventOptions(keyCode, shift);

        // TODO: simulate 'keyCode' being added to text boxes (but it will be cancelled)
        return pressKey($element, key, $.noop);
    }

    // Tabbing related key press helpers
    function getFocusedElement()
    {
        return $(document.activeElement);
    }

    function pressKeyFromFocusedElement(keyCode, shift)
    {
        return pressSimulatedKeyCode(getFocusedElement(), keyCode, shift);
    }

    function pressKeyAndGetFocusedElement(keyCode, shift)
    {
        return pressKeyFromFocusedElement(keyCode, shift)
            .pipe(getFocusedElement);
    }

    // Test keys simulation helpers
    // Keys from
    // https://api.jquery.com/event.which/
    // https://developer.mozilla.org/en/DOM/KeyboardEvent#Virtual_key_codes
    var KEY_TAB = 9;
    var KEY_ENTER = 13;
    var KEY_ARROW_DOWN = 40;
    var KEY_NUM_PLUS = 107;

    function pressEnterAndGetFocusedElement(shift)
    {
        return pressKeyAndGetFocusedElement(KEY_ENTER, shift);
    }

    function pressArrowDownAndGetFocusedElement(shift)
    {
        return pressKeyAndGetFocusedElement(KEY_ARROW_DOWN, shift);
    }

    function pressNumpadPlusAndGetFocusedElement(shift)
    {
        return pressKeyAndGetFocusedElement(KEY_NUM_PLUS, shift);
    }

    function pressTabFromFocusedElement(shift)
    {
        return pressTab(getFocusedElement(), shift);
    }

    function pressTabAndGetFocusedElement(shift)
    {
        return pressTabFromFocusedElement(shift)
            .pipe(getFocusedElement);
    }

    // Test helpers
    function normalSetup()
    {
        var $qunitFixture = $("#qunit-fixture"),
            $div = $("<div />");

        $div.appendTo($qunitFixture);

        $container = $div;
    }

    function resetKeyOptions() {
        // NOTE: different defaults.
        JoelPurra.PlusAsTab.setOptions({
            key: KEY_NUM_PLUS,
        });
        JoelPurra.SkipOnTab.setOptions({
            key: KEY_TAB,
        });
    }

    function setKeyOptions(key) {
        JoelPurra.PlusAsTab.setOptions({
            key: key,
        });
        JoelPurra.SkipOnTab.setOptions({
            key: key,
        });
    }

    function useNumPadPlusKeyOptions() {
        setKeyOptions(KEY_NUM_PLUS);
    }

    function useEnterKeyOptions() {
        setKeyOptions(KEY_ENTER);
    }

    function useEnterArrowDownKeysOptions() {
        setKeyOptions([KEY_ENTER, KEY_ARROW_DOWN]);
    }

    function fnSkipA()
    {
        $("#a").skipOnTab();
    }

    function fnSkipContainer()
    {
        $("#container").skipOnTab();
    }

    // Assertion functions
    function assertId(assert, $element, id)
    {
        // DEBUG
        if ($element.attr("id") !== id)
        {
            try
            {
                /* eslint-disable no-console */
                console.error([$element, $element.attr("id"), id]);
                /* eslint-enable no-console */
            } catch (e)
            {
                // Could show an alert message, but what the hell
            }
        }

        assert.strictEqual($element.attr("id"), id, "The id did not match for element " + $element);
    }

    function tabAssertId(assert, id, shift)
    {
        shift = !!shift;

        return function()
        {
            return pressTabAndGetFocusedElement(shift)
                .pipe(function($focused)
                {
                    assertId(assert, $focused, id);
                });
        };
    }

    function enterAssertId(assert, id, shift)
    {
        return function()
        {
            return pressEnterAndGetFocusedElement(shift)
                .pipe(function($focused)
                {
                    assertId(assert, $focused, id);
                });
        };
    }

    function arrowDownAssertId(assert, id, shift)
    {
        return function()
        {
            return pressArrowDownAndGetFocusedElement(shift)
                .pipe(function($focused)
                {
                    assertId(assert, $focused, id);
                });
        };
    }

    function numpadPlusAssertId(assert, id, shift)
    {
        return function()
        {
            return pressNumpadPlusAndGetFocusedElement(shift)
                .pipe(function($focused)
                {
                    assertId(assert, $focused, id);
                });
        };
    }

    function randomEnterArrowDownAssertId(assert, id, shift) {
        if (Math.random() > (1 / 2)) {
            return arrowDownAssertId(assert, id, shift);
        }
        return enterAssertId(assert, id, shift);
    }

    // Enabling SkipOnTab on the element (class/attribute)
    function assertElementStartAEnd(assert, done, keyAssertFn)
    {
        keyAssertFn = keyAssertFn || tabAssertId;

        $("#start").focus();

        assertId(assert, getFocusedElement(), "start");

        return $.when()
            // Skip all skippable elements
            .pipe(keyAssertFn(assert, "end"))
            // Reverse tab back to the start
            .pipe(keyAssertFn(assert, "a", true))
            .pipe(keyAssertFn(assert, "start", true))
            // Async test, must run start()
            .pipe(done);
    }

    function assertElementStartBEnd(assert, done)
    {
        $("#start").focus();

        assertId(assert, getFocusedElement(), "start");

        return $.when()
            // Skip all skippable elements
            .pipe(tabAssertId(assert, "b"))
            .pipe(tabAssertId(assert, "end"))
            // Reverse tab back to the start
            .pipe(tabAssertId(assert, "c", true))
            .pipe(tabAssertId(assert, "b", true))
            .pipe(tabAssertId(assert, "a", true))
            .pipe(tabAssertId(assert, "start", true))
            // Async test, must run start()
            .pipe(done);
    }

    function assertElementStartABCEnd(assert, done)
    {
        $("#start").focus();

        assertId(assert, getFocusedElement(), "start");

        return $.when()
            // Skip all skippable elements
            .pipe(tabAssertId(assert, "b"))
            .pipe(tabAssertId(assert, "end"))
            // Reverse tab back to the start
            .pipe(tabAssertId(assert, "c", true))
            .pipe(tabAssertId(assert, "b", true))
            .pipe(tabAssertId(assert, "a", true))
            .pipe(tabAssertId(assert, "start", true))
            // Async test, must run start()
            .pipe(done);
    }

    function assertElementStartACEnd(assert, done)
    {
        $("#start").focus();

        assertId(assert, getFocusedElement(), "start");

        return $.when()
            // Skip all skippable elements
            .pipe(tabAssertId(assert, "end"))
            // Reverse tab back to the start
            .pipe(tabAssertId(assert, "c", true))
            .pipe(tabAssertId(assert, "a", true))
            .pipe(tabAssertId(assert, "start", true))
            // Async test, must run start()
            .pipe(done);
    }

    // Dynamically enabling SkipOnTab
    function assertStartAEnd(assert, done, fnc)
    {
        $("#start").focus();

        assertId(assert, getFocusedElement(), "start");

        // Forward tab as normal when skipping has not been initialized
        return $.when()
            .pipe(tabAssertId(assert, "a"))
            .pipe(tabAssertId(assert, "end"))
            // Reverse tab as normal when skipping has not been initialized
            .pipe(tabAssertId(assert, "a", true))
            .pipe(tabAssertId(assert, "start", true))
            // Initialize SkipOnTab
            .pipe(function()
            {
                fnc();

                assertId(assert, getFocusedElement(), "start");
            })
            .pipe($.proxy(assertElementStartAEnd, null, assert, done));
    }

    function assertStartBEnd(assert, done, fnc)
    {
        $("#start").focus();

        assertId(assert, getFocusedElement(), "start");

        // Forward tab as normal when disabling skipping has not been initialized
        return $.when()
            .pipe(tabAssertId(assert, "end"))
            // Reverse tab as normal when disabling skipping has not been initialized
            .pipe(tabAssertId(assert, "c", true))
            .pipe(tabAssertId(assert, "b", true))
            .pipe(tabAssertId(assert, "a", true))
            .pipe(tabAssertId(assert, "start", true))
            // Initialize SkipOnTab
            .pipe(function()
            {
                fnc();

                assertId(assert, getFocusedElement(), "start");
            })
            .pipe($.proxy(assertElementStartBEnd, null, assert, done));
    }

    function assertStartABCEnd(assert, done, fnc)
    {
        $("#start").focus();

        assertId(assert, getFocusedElement(), "start");

        // Forward tab as normal when skipping has not been initialized
        return $.when()
            .pipe(tabAssertId(assert, "a"))
            .pipe(tabAssertId(assert, "b"))
            .pipe(tabAssertId(assert, "c"))
            .pipe(tabAssertId(assert, "end"))
            // Reverse tab as normal when skipping has not been initialized
            .pipe(tabAssertId(assert, "c", true))
            .pipe(tabAssertId(assert, "b", true))
            .pipe(tabAssertId(assert, "a", true))
            .pipe(tabAssertId(assert, "start", true))
            // Initialize SkipOnTab
            .pipe(function()
            {
                fnc();

                assertId(assert, getFocusedElement(), "start");
            })
            .pipe($.proxy(assertElementStartABCEnd, null, assert, done));
    }

    function assertStartACEnd(assert, done, fnc)
    {
        $("#start").focus();

        assertId(assert, getFocusedElement(), "start");

        // Forward tab as normal when skipping has not been initialized
        return $.when()
            .pipe(tabAssertId(assert, "a"))
            .pipe(tabAssertId(assert, "c"))
            .pipe(tabAssertId(assert, "end"))
            // Reverse tab as normal when skipping has not been initialized
            .pipe(tabAssertId(assert, "c", true))
            .pipe(tabAssertId(assert, "a", true))
            .pipe(tabAssertId(assert, "start", true))
            // Initialize SkipOnTab
            .pipe(function()
            {
                fnc();

                assertId(assert, getFocusedElement(), "start");
            })
            .pipe($.proxy(assertElementStartACEnd, null, assert, done));
    }

    (function()
    {
        QUnit.module("Library load");

        QUnit.test("Object exists", function(assert)
        {
            assert.expect(2);

            assert.notStrictEqual(typeof (JoelPurra.SkipOnTab), "undefined", "JoelPurra.SkipOnTab is undefined.");
            assert.strictEqual(typeof (JoelPurra.SkipOnTab), "function", "JoelPurra.SkipOnTab is not a function.");
        });
    }());

    (function()
    {
        QUnit.module("init");

        QUnit.test("Static elements", function(assert)
        {
            assert.expect(7);

            var done = assert.async(),
                $staticContainer = $("#elements-initialized-at-startup");

            assertElementStartABCEnd(assert, done)
                .pipe(function()
                {
                    // Run the static tests only once
                    $staticContainer.remove();
                });
        });
    }());

    (function()
    {
        QUnit.module("Elements",
            {
                beforeEach: normalSetup,
            });

        QUnit.test("With class name", function(assert)
        {
            assert.expect(4);

            var done = assert.async();

            $container
                .append("<input id=\"start\" type=\"text\" value=\"text field that is the starting point\" />")
                .append("<input id=\"a\" type=\"text\" value=\"text field that is skipped\" class=\"skip-on-tab\" />")
                .append("<input id=\"end\" type=\"submit\" value=\"submit button that is at the end of the skipped elements\" />");

            assertElementStartAEnd(assert, done);
        });

        QUnit.test("With data attribute", function(assert)
        {
            assert.expect(4);

            var done = assert.async();

            $container
                .append("<input id=\"start\" type=\"text\" value=\"text field that is the starting point\" />")
                .append("<input id=\"a\" type=\"text\" value=\"text field that is skipped\" data-skip-on-tab=\"true\" />")
                .append("<input id=\"end\" type=\"submit\" value=\"submit button that is at the end of the skipped elements\" />");

            assertElementStartAEnd(assert, done);
        });

        QUnit.test("Container with class name", function(assert)
        {
            assert.expect(4);

            var done = assert.async();

            $container
                .append("<input id=\"start\" type=\"text\" value=\"text field that is the starting point\" />")
                .append($("<div id=\"container\" class=\"skip-on-tab\" />")
                    .append("<input id=\"a\" type=\"text\" value=\"text field that is skipped\" />"))
                .append("<input id=\"end\" type=\"submit\" value=\"submit button that is at the end of the skipped elements\" />");

            assertElementStartAEnd(assert, done);
        });

        QUnit.test("Container with data attribute", function(assert)
        {
            assert.expect(4);

            var done = assert.async();

            $container
                .append("<input id=\"start\" type=\"text\" value=\"text field that is the starting point\" />")
                .append($("<div id=\"container\" data-skip-on-tab=\"true\" />")
                    .append("<input id=\"a\" type=\"text\" value=\"text field that is skipped\" />"))
                .append("<input id=\"end\" type=\"submit\" value=\"submit button that is at the end of the skipped elements\" />");

            assertElementStartAEnd(assert, done);
        });

        QUnit.test("Container with nested skippables", function(assert)
        {
            assert.expect(4);

            var done = assert.async();

            $container
                .append("<input id=\"start\" type=\"text\" value=\"text field that is the starting point\" />")
                .append($("<ol id=\"container\" data-skip-on-tab=\"true\" />")
                    .append($("<li />")
                        .append("<input id=\"a\" type=\"text\" value=\"text field that is skipped\" />")))
                .append("<input id=\"end\" type=\"submit\" value=\"submit button that is at the end of the skipped elements\" />");

            assertElementStartAEnd(assert, done);
        });

        QUnit.test("Container excludes by class name", function(assert)
        {
            assert.expect(7);

            var done = assert.async();

            $container
                .append("<input id=\"start\" type=\"text\" value=\"text field that is the starting point\" />")
                .append($("<div id=\"container\" data-skip-on-tab=\"true\" />")
                    .append("<input id=\"a\" type=\"text\" value=\"text field that is skipped\" />")
                    .append("<input id=\"b\" type=\"text\" value=\"text field that is not skipped\" class=\"disable-skip-on-tab\" />")
                    .append("<input id=\"c\" type=\"text\" value=\"text field that is skipped\" />"))
                .append("<input id=\"end\" type=\"submit\" value=\"submit button that is at the end of the skipped elements\" />");

            assertElementStartABCEnd(assert, done);
        });

        QUnit.test("Container excludes by data attribute", function(assert)
        {
            assert.expect(7);

            var done = assert.async();

            $container
                .append("<input id=\"start\" type=\"text\" value=\"text field that is the starting point\" />")
                .append($("<div id=\"container\" data-skip-on-tab=\"true\" />")
                    .append("<input id=\"a\" type=\"text\" value=\"text field that is skipped\" />")
                    .append("<input id=\"b\" type=\"text\" value=\"text field that is not skipped\" data-skip-on-tab=\"false\" />")
                    .append("<input id=\"c\" type=\"text\" value=\"text field that is skipped\" />"))
                .append("<input id=\"end\" type=\"submit\" value=\"submit button that is at the end of the skipped elements\" />");

            assertElementStartABCEnd(assert, done);
        });

        QUnit.test("Container excludes hidden", function(assert)
        {
            assert.expect(5);

            var done = assert.async();

            $container
                .append("<input id=\"start\" type=\"text\" value=\"text field that is the starting point\" />")
                .append($("<div id=\"container\" data-skip-on-tab=\"true\" />")
                    .append("<input id=\"a\" type=\"text\" value=\"text field that is skipped\" />")
                    .append("<input id=\"b\" type=\"hidden\" value=\"hidden field that is always skipped\" />")
                    .append("<input id=\"c\" type=\"text\" value=\"text field that is skipped\" />"))
                .append("<input id=\"end\" type=\"submit\" value=\"submit button that is at the end of the skipped elements\" />");

            assertElementStartACEnd(assert, done);
        });

        QUnit.test("Container excludes disabled", function(assert)
        {
            assert.expect(5);

            var done = assert.async();

            $container
                .append("<input id=\"start\" type=\"text\" value=\"text field that is the starting point\" />")
                .append($("<div id=\"container\" data-skip-on-tab=\"true\" />")
                    .append("<input id=\"a\" type=\"text\" value=\"text field that is skipped\" />")
                    .append("<input id=\"b\" type=\"text\" value=\"disabled text field that is always skipped\" disabled=\"disabled\" />")
                    .append("<input id=\"c\" type=\"text\" value=\"text field that is skipped\" />"))
                .append("<input id=\"end\" type=\"submit\" value=\"submit button that is at the end of the skipped elements\" />");

            assertElementStartACEnd(assert, done);
        });

        QUnit.test("Container excludes anchors without href", function(assert)
        {
            assert.expect(5);

            var done = assert.async();

            $container
                .append("<input id=\"start\" type=\"text\" value=\"text field that is the starting point\" />")
                .append($("<div id=\"container\" data-skip-on-tab=\"true\" />")
                    .append("<input id=\"a\" type=\"text\" value=\"text field that is skipped\" />")
                    .append("<a id=\"b\">anchor without href that is always skipped</a>")
                    .append("<input id=\"c\" type=\"text\" value=\"text field that is skipped\" />"))
                .append("<input id=\"end\" type=\"submit\" value=\"submit button that is at the end of the skipped elements\" />");

            assertElementStartACEnd(assert, done);
        });
    }());

    (function()
    {
        QUnit.module("skipOnTab",
            {
                beforeEach: normalSetup,
            });

        QUnit.test("Element", function(assert)
        {
            assert.expect(10);

            var done = assert.async();

            $container
                .append("<input id=\"start\" type=\"text\" value=\"text field that is the starting point\" />")
                .append("<input id=\"a\" type=\"text\" value=\"text field that is skipped\" />")
                .append("<input id=\"end\" type=\"submit\" value=\"submit button that is at the end of the skipped elements\" />");

            assertStartAEnd(assert, done, function()
            {
                JoelPurra.SkipOnTab.skipOnTab($("#a"));
            });
        });

        QUnit.test("Container", function(assert)
        {
            assert.expect(10);

            var done = assert.async();

            $container
                .append("<input id=\"start\" type=\"text\" value=\"text field that is the starting point\" />")
                .append($("<div id=\"container\" />")
                    .append("<input id=\"a\" type=\"text\" value=\"text field that is skipped\" />"))
                .append("<input id=\"end\" type=\"submit\" value=\"submit button that is at the end of the skipped elements\" />");

            assertStartAEnd(assert, done, function()
            {
                JoelPurra.SkipOnTab.skipOnTab($("#container"));
            });
        });

        QUnit.test("Element explicit enable", function(assert)
        {
            assert.expect(10);

            var done = assert.async();

            $container
                .append("<input id=\"start\" type=\"text\" value=\"text field that is the starting point\" />")
                .append("<input id=\"a\" type=\"text\" value=\"text field that is skipped\" />")
                .append("<input id=\"end\" type=\"submit\" value=\"submit button that is at the end of the skipped elements\" />");

            assertStartAEnd(assert, done, function()
            {
                JoelPurra.SkipOnTab.skipOnTab($("#a"), true);
            });
        });

        QUnit.test("Container explicit enable", function(assert)
        {
            assert.expect(10);

            var done = assert.async();

            $container
                .append("<input id=\"start\" type=\"text\" value=\"text field that is the starting point\" />")
                .append($("<div id=\"container\" />")
                    .append("<input id=\"a\" type=\"text\" value=\"text field that is skipped\" />"))
                .append("<input id=\"end\" type=\"submit\" value=\"submit button that is at the end of the skipped elements\" />");

            assertStartAEnd(assert, done, function()
            {
                JoelPurra.SkipOnTab.skipOnTab($("#container"), true);
            });
        });

        QUnit.test("Element explicit disable", function(assert)
        {
            assert.expect(14);

            var done = assert.async();

            $container
                .append("<input id=\"start\" type=\"text\" value=\"text field that is the starting point\" />")
                .append($("<div id=\"container\" data-skip-on-tab=\"true\" />")
                    .append("<input id=\"a\" type=\"text\" value=\"text field that is skipped\" />")
                    .append("<input id=\"b\" type=\"text\" value=\"text field that is not skipped\" />")
                    .append("<input id=\"c\" type=\"text\" value=\"text field that is skipped\" />"))
                .append("<input id=\"end\" type=\"submit\" value=\"submit button that is at the end of the skipped elements\" />");

            assertStartBEnd(assert, done, function()
            {
                JoelPurra.SkipOnTab.skipOnTab($("#b"), false);
            });
        });

        QUnit.test("Container explicit disable", function(assert)
        {
            assert.expect(14);

            var done = assert.async();

            $container
                .append("<input id=\"start\" type=\"text\" value=\"text field that is the starting point\" />")
                .append($("<div id=\"outer-container\" data-skip-on-tab=\"true\" />")
                    .append("<input id=\"a\" type=\"text\" value=\"text field that is skipped\" />")
                    .append($("<div id=\"inner-container\" />")
                        .append("<input id=\"b\" type=\"text\" value=\"text field that is not skipped\" />"))
                    .append("<input id=\"c\" type=\"text\" value=\"text field that is skipped\" />"))
                .append("<input id=\"end\" type=\"submit\" value=\"submit button that is at the end of the skipped elements\" />");

            assertStartBEnd(assert, done, function()
            {
                JoelPurra.SkipOnTab.skipOnTab($("#inner-container"), false);
            });
        });
    }());

    (function()
    {
        QUnit.module("$.fn.skipOnTab",
            {
                beforeEach: normalSetup,
            });

        QUnit.test("With class name", function(assert)
        {
            assert.expect(10);

            var done = assert.async();

            $container
                .append("<input id=\"start\" type=\"text\" value=\"text field that is the starting point\" />")
                .append("<input id=\"a\" type=\"text\" value=\"text field that is skipped\" />")
                .append("<input id=\"end\" type=\"submit\" value=\"submit button that is at the end of the skipped elements\" />");

            assertStartAEnd(assert, done, fnSkipA);
        });

        QUnit.test("With data attribute", function(assert)
        {
            assert.expect(10);

            var done = assert.async();

            $container
                .append("<input id=\"start\" type=\"text\" value=\"text field that is the starting point\" />")
                .append("<input id=\"a\" type=\"text\" value=\"text field that is skipped\" />")
                .append("<input id=\"end\" type=\"submit\" value=\"submit button that is at the end of the skipped elements\" />");

            assertStartAEnd(assert, done, fnSkipA);
        });

        QUnit.test("Container with class name", function(assert)
        {
            assert.expect(10);

            var done = assert.async();

            $container
                .append("<input id=\"start\" type=\"text\" value=\"text field that is the starting point\" />")
                .append($("<div id=\"container\" />")
                    .append("<input id=\"a\" type=\"text\" value=\"text field that is skipped\" />"))
                .append("<input id=\"end\" type=\"submit\" value=\"submit button that is at the end of the skipped elements\" />");

            assertStartAEnd(assert, done, fnSkipContainer);
        });

        QUnit.test("Container with data attribute", function(assert)
        {
            assert.expect(10);

            var done = assert.async();

            $container
                .append("<input id=\"start\" type=\"text\" value=\"text field that is the starting point\" />")
                .append($("<div id=\"container\" />")
                    .append("<input id=\"a\" type=\"text\" value=\"text field that is skipped\" />"))
                .append("<input id=\"end\" type=\"submit\" value=\"submit button that is at the end of the skipped elements\" />");

            assertStartAEnd(assert, done, fnSkipContainer);
        });

        QUnit.test("Container with nested skippables", function(assert)
        {
            assert.expect(10);

            var done = assert.async();

            $container
                .append("<input id=\"start\" type=\"text\" value=\"text field that is the starting point\" />")
                .append($("<ol id=\"container\" />")
                    .append($("<li />")
                        .append("<input id=\"a\" type=\"text\" value=\"text field that is skipped\" />")))
                .append("<input id=\"end\" type=\"submit\" value=\"submit button that is at the end of the skipped elements\" />");

            assertStartAEnd(assert, done, fnSkipContainer);
        });

        QUnit.test("Container excludes by class name", function(assert)
        {
            assert.expect(17);

            var done = assert.async();

            $container
                .append("<input id=\"start\" type=\"text\" value=\"text field that is the starting point\" />")
                .append($("<div id=\"container\" />")
                    .append("<input id=\"a\" type=\"text\" value=\"text field that is skipped\" />")
                    .append("<input id=\"b\" type=\"text\" value=\"text field that is not skipped\" class=\"disable-skip-on-tab\" />")
                    .append("<input id=\"c\" type=\"text\" value=\"text field that is skipped\" />"))
                .append("<input id=\"end\" type=\"submit\" value=\"submit button that is at the end of the skipped elements\" />");

            assertStartABCEnd(assert, done, fnSkipContainer);
        });

        QUnit.test("Container excludes by data attribute", function(assert)
        {
            assert.expect(17);

            var done = assert.async();

            $container
                .append("<input id=\"start\" type=\"text\" value=\"text field that is the starting point\" />")
                .append($("<div id=\"container\" />")
                    .append("<input id=\"a\" type=\"text\" value=\"text field that is skipped\" />")
                    .append("<input id=\"b\" type=\"text\" value=\"text field that is not skipped\" data-skip-on-tab=\"false\" />")
                    .append("<input id=\"c\" type=\"text\" value=\"text field that is skipped\" />"))
                .append("<input id=\"end\" type=\"submit\" value=\"submit button that is at the end of the skipped elements\" />");

            assertStartABCEnd(assert, done, fnSkipContainer);
        });

        QUnit.test("Container excludes hidden", function(assert)
        {
            assert.expect(13);

            var done = assert.async();

            $container
                .append("<input id=\"start\" type=\"text\" value=\"text field that is the starting point\" />")
                .append($("<div id=\"container\" />")
                    .append("<input id=\"a\" type=\"text\" value=\"text field that is skipped\" />")
                    .append("<input id=\"b\" type=\"hidden\" value=\"hidden field that is always skipped\" />")
                    .append("<input id=\"c\" type=\"text\" value=\"text field that is skipped\" />"))
                .append("<input id=\"end\" type=\"submit\" value=\"submit button that is at the end of the skipped elements\" />");

            assertStartACEnd(assert, done, fnSkipContainer);
        });

        QUnit.test("Container excludes disabled", function(assert)
        {
            assert.expect(13);

            var done = assert.async();

            $container
                .append("<input id=\"start\" type=\"text\" value=\"text field that is the starting point\" />")
                .append($("<div id=\"container\" />")
                    .append("<input id=\"a\" type=\"text\" value=\"text field that is skipped\" />")
                    .append("<input id=\"b\" type=\"text\" value=\"disabled text field that is always skipped\" disabled=\"disabled\" />")
                    .append("<input id=\"c\" type=\"text\" value=\"text field that is skipped\" />"))
                .append("<input id=\"end\" type=\"submit\" value=\"submit button that is at the end of the skipped elements\" />");

            assertStartACEnd(assert, done, fnSkipContainer);
        });

        QUnit.test("Container excludes anchors without href", function(assert)
        {
            assert.expect(13);

            var done = assert.async();

            $container
                .append("<input id=\"start\" type=\"text\" value=\"text field that is the starting point\" />")
                .append($("<div id=\"container\" />")
                    .append("<input id=\"a\" type=\"text\" value=\"text field that is skipped\" />")
                    .append("<a id=\"b\">anchor without href that is always skipped</a>")
                    .append("<input id=\"c\" type=\"text\" value=\"text field that is skipped\" />"))
                .append("<input id=\"end\" type=\"submit\" value=\"submit button that is at the end of the skipped elements\" />");

            assertStartACEnd(assert, done, fnSkipContainer);
        });

        QUnit.test("Element", function(assert)
        {
            assert.expect(10);

            var done = assert.async();

            $container
                .append("<input id=\"start\" type=\"text\" value=\"text field that is the starting point\" />")
                .append("<input id=\"a\" type=\"text\" value=\"text field that is skipped\" />")
                .append("<input id=\"end\" type=\"submit\" value=\"submit button that is at the end of the skipped elements\" />");

            assertStartAEnd(assert, done, fnSkipA);
        });

        QUnit.test("Container", function(assert)
        {
            assert.expect(10);

            var done = assert.async();

            $container
                .append("<input id=\"start\" type=\"text\" value=\"text field that is the starting point\" />")
                .append($("<div id=\"container\" />")
                    .append("<input id=\"a\" type=\"text\" value=\"text field that is skipped\" />"))
                .append("<input id=\"end\" type=\"submit\" value=\"submit button that is at the end of the skipped elements\" />");

            assertStartAEnd(assert, done, fnSkipContainer);
        });

        QUnit.test("Element explicit disable", function(assert)
        {
            assert.expect(14);

            var done = assert.async();

            $container
                .append("<input id=\"start\" type=\"text\" value=\"text field that is the starting point\" />")
                .append($("<div id=\"container\" data-skip-on-tab=\"true\" />")
                    .append("<input id=\"a\" type=\"text\" value=\"text field that is skipped\" />")
                    .append("<input id=\"b\" type=\"text\" value=\"text field that is not skipped\" />")
                    .append("<input id=\"c\" type=\"text\" value=\"text field that is skipped\" />"))
                .append("<input id=\"end\" type=\"submit\" value=\"submit button that is at the end of the skipped elements\" />");

            assertStartBEnd(assert, done, function()
            {
                $("#b").skipOnTab(false);
            });
        });

        QUnit.test("Container explicit disable", function(assert)
        {
            assert.expect(14);

            var done = assert.async();

            $container
                .append("<input id=\"start\" type=\"text\" value=\"text field that is the starting point\" />")
                .append($("<div id=\"outer-container\" data-skip-on-tab=\"true\" />")
                    .append("<input id=\"a\" type=\"text\" value=\"text field that is skipped\" />")
                    .append($("<div id=\"inner-container\" />")
                        .append("<input id=\"b\" type=\"text\" value=\"text field that is not skipped\" />"))
                    .append("<input id=\"c\" type=\"text\" value=\"text field that is skipped\" />"))
                .append("<input id=\"end\" type=\"submit\" value=\"submit button that is at the end of the skipped elements\" />");

            assertStartBEnd(assert, done, function()
            {
                $("#inner-container").skipOnTab(false);
            });
        });
    }());

    (function()
    {
        QUnit.module("Element types",
            {
                beforeEach: normalSetup,
            });

        QUnit.test("Standard", function(assert)
        {
            assert.expect(56);

            var done = assert.async();

            $container
                .append("<input id=\"start\" type=\"text\" value=\"text field that is the starting point\" />")
                .append($("<div id=\"container\" />")
                    .append("<input id=\"a\" type=\"text\" value=\"text field that is skipped\" />")
                    .append("<input id=\"b\" type=\"password\" value=\"password field that is skipped\" />")
                    .append("<input id=\"c\" type=\"checkbox\" value=\"checkbox that is skipped\" />")
                    .append("<input id=\"d\" type=\"radio\" value=\"radio button that is skipped\" />")
                    .append("<input id=\"e\" type=\"file\" value=\"file field that is skipped\" />")
                    .append("<input id=\"f\" type=\"hidden\" value=\"hidden field that is always skipped\" />")
                    .append("<input id=\"g\" type=\"submit\" value=\"submit button that is skipped\" />")
                    .append("<input id=\"h\" type=\"image\" value=\"image button that is skipped\" />")
                    .append("<input id=\"i\" type=\"reset\" value=\"reset button that is skipped\" />")
                    .append("<input id=\"j\" type=\"button\" value=\"button button that is skipped\" />")
                    .append("<button id=\"k\" type=\"button\" value=\"button button button that is skipped\"></button>")
                    .append("<button id=\"l\" type=\"submit\" value=\"submit button button that is skipped\"></button>")
                    .append("<button id=\"m\" type=\"reset\" value=\"reset button button that is skipped\"></button>")
                    .append("<textarea id=\"n\" value=\"textarea that is skipped\"></textarea>")
                    .append("<a id=\"o\">anchor without href that is always skipped</a>")
                    .append("<a id=\"p\" href=\"about:blank\">anchor that is skipped</a>")
                    .append("<input id=\"q\" type=\"text\" disabled=\"disabled\" value=\"disabled input that is always skipped\" />")
                    .append("<input id=\"r\" type=\"text\" class=\"disable-skip-on-tab\" value=\"input that will not be skipped\" />")
                    .append("<input id=\"s\" type=\"text\" data-skip-on-tab=\"false\" value=\"input that will not be skipped\" />"))
                .append("<input id=\"end\" type=\"submit\" value=\"submit button that is at the end of the skipped elements\" />");

            $("#start").focus();

            assertId(assert, getFocusedElement(), "start");

            // Forward tab as normal when skipping has not been initialized
            $.when()
                .pipe(tabAssertId(assert, "a"))
                .pipe(tabAssertId(assert, "b"))
                .pipe(tabAssertId(assert, "c"))
                .pipe(tabAssertId(assert, "d"))
                .pipe(tabAssertId(assert, "e"))
                .pipe(tabAssertId(assert, "g"))
                .pipe(tabAssertId(assert, "h"))
                .pipe(tabAssertId(assert, "i"))
                .pipe(tabAssertId(assert, "j"))
                .pipe(tabAssertId(assert, "k"))
                .pipe(tabAssertId(assert, "l"))
                .pipe(tabAssertId(assert, "m"))
                .pipe(tabAssertId(assert, "n"))
                .pipe(tabAssertId(assert, "p"))
                .pipe(tabAssertId(assert, "r"))
                .pipe(tabAssertId(assert, "s"))
                .pipe(tabAssertId(assert, "end"))
                // Reverse tab as normal when skipping has not been initialized
                .pipe(tabAssertId(assert, "s", true))
                .pipe(tabAssertId(assert, "r", true))
                .pipe(tabAssertId(assert, "p", true))
                .pipe(tabAssertId(assert, "n", true))
                .pipe(tabAssertId(assert, "m", true))
                .pipe(tabAssertId(assert, "l", true))
                .pipe(tabAssertId(assert, "k", true))
                .pipe(tabAssertId(assert, "j", true))
                .pipe(tabAssertId(assert, "i", true))
                .pipe(tabAssertId(assert, "h", true))
                .pipe(tabAssertId(assert, "g", true))
                .pipe(tabAssertId(assert, "e", true))
                .pipe(tabAssertId(assert, "d", true))
                .pipe(tabAssertId(assert, "c", true))
                .pipe(tabAssertId(assert, "b", true))
                .pipe(tabAssertId(assert, "a", true))
                .pipe(tabAssertId(assert, "start", true))
                // Initialize SkipOnTab
                .pipe(
                function()
                {
                    fnSkipContainer();

                    assertId(assert, getFocusedElement(), "start");
                })
                // Skip all skippable elements
                .pipe(tabAssertId(assert, "r"))
                .pipe(tabAssertId(assert, "s"))
                .pipe(tabAssertId(assert, "end"))
                // Reverse tab back to the start
                .pipe(tabAssertId(assert, "s", true))
                .pipe(tabAssertId(assert, "r", true))
                .pipe(tabAssertId(assert, "p", true))
                .pipe(tabAssertId(assert, "n", true))
                .pipe(tabAssertId(assert, "m", true))
                .pipe(tabAssertId(assert, "l", true))
                .pipe(tabAssertId(assert, "k", true))
                .pipe(tabAssertId(assert, "j", true))
                .pipe(tabAssertId(assert, "i", true))
                .pipe(tabAssertId(assert, "h", true))
                .pipe(tabAssertId(assert, "g", true))
                .pipe(tabAssertId(assert, "e", true))
                .pipe(tabAssertId(assert, "d", true))
                .pipe(tabAssertId(assert, "c", true))
                .pipe(tabAssertId(assert, "b", true))
                .pipe(tabAssertId(assert, "a", true))
                .pipe(tabAssertId(assert, "start", true))
                // Async test, must run start()
                .pipe(done);
        });
    }());

    (function()
    {
        QUnit.module("setOptions",
            {
                beforeEach: normalSetup,
            });

        QUnit.test("Plus as tab", function(assert)
            {
            assert.expect(4);
            var done = assert.async();

            useNumPadPlusKeyOptions();

            $container
                .append("<input id=\"start\" type=\"text\" value=\"text field that is the starting point\" />")
                .append("<input id=\"a\" type=\"text\" value=\"text field that is skipped\" class=\"skip-on-tab\" />")
                .append("<input id=\"end\" type=\"submit\" value=\"submit button that is at the end of the skipped elements\" />");

            assertElementStartAEnd(assert, function() { done(); resetKeyOptions(); }, numpadPlusAssertId);
        });

        QUnit.test("Enter as tab", function(assert)
        {
            assert.expect(4);
            var done = assert.async();

            useEnterKeyOptions();

            $container
                .append("<input id=\"start\" type=\"text\" value=\"text field that is the starting point\" />")
                .append("<input id=\"a\" type=\"text\" value=\"text field that is skipped\" class=\"skip-on-tab\" />")
                .append("<input id=\"end\" type=\"submit\" value=\"submit button that is at the end of the skipped elements\" />");

            assertElementStartAEnd(assert, function() { done(); resetKeyOptions(); }, enterAssertId);
        });

        QUnit.module("setOptions multiple keys",
            {
                beforeEach: normalSetup,
            });

        QUnit.test("Elements", function(assert)
        {
            assert.expect(4);
            var done = assert.async();

            $container
                .append("<input id=\"start\" type=\"text\" value=\"text field that is the starting point\" />")
                .append("<input id=\"a\" type=\"text\" value=\"text field that is skipped\" class=\"skip-on-tab\" />")
                .append("<input id=\"end\" type=\"submit\" value=\"submit button that is at the end of the skipped elements\" />");

            assertElementStartAEnd(assert, function() { done(); resetKeyOptions(); }, randomEnterArrowDownAssertId);
        });
    }());
}(jQuery));
