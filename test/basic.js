/// <reference path="qunit/qunit/qunit.js" />
/// <reference path="jquery-ui/jquery-1.7.1.js" />
/// <reference path="jquery-ui/tests/jquery.simulate.js" />
/// <reference path="../src/skipontab.joelpurra.js" />

/*jslint browser: true, vars: true, white: true, regexp: true, maxlen: 150*/
/*global JoelPurra, jQuery, console, module, test, asyncTest, start, ok, strictEqual, notStrictEqual*/

(function ($)
{
	var 
		$container,
		defaultKeyTimeout = 1;

	// Tab focus emulation
	{
		// Can't actually trigger the TAB key in the browser,
		// so simulate by focusing the next element
		// NOTE: this is pretty bad as it's using the internals
		// of SkipOnTab/PlusAsTab - might be better to find a way to make
		// the browser do it.
		// TRY: Flash, Java applet, Silverlight, ActiveX, browser plugin
		var focusable = ":input, a[href]";

		// Copy of function in plusastab.joelpurra.js/skipontab.joelpurra.js
		function findNextFocusable($from, offset)
		{
			var $focusable = $(focusable)
				.not(":disabled")
				.not(":hidden");

			var currentIndex = $focusable.index($from);

			var nextIndex = (currentIndex + offset) % $focusable.length;

			if (nextIndex <= -1)
			{
				nextIndex = $focusable.length + nextIndex;
			}

			var $next = $focusable.eq(nextIndex);

			return $next;
		}

		function getSimulatedTabkeyEventOptions(shift)
		{
			shift = !!shift;

			var key =
				{
					// Cannot use "which" with $.simulate
					keyCode: $.simulate.VK_TAB,
					shiftKey: shift
				};

			return key;
		}

		// Copy of function in plusastab.joelpurra.js/skipontab.joelpurra.js
		function emulateTabbing($from, offset)
		{
			var $next = findNextFocusable($from, offset);

			$next.focus();
		}
	}

	// Keyboard simulation
	{
		// DEBUG
		function logArguments()
		{
			try
			{
				console.log.call(console, arguments);

			} catch (e)
			{
				// Could show an alert message, but what the hell
			}
		}

		function performDeferredAsync(fnc, timeout)
		{
			var deferred = new $.Deferred();

			setTimeout($.proxy(function ()
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

		function deferredPressKey(eventName, $element, key)
		{
			return performDeferredAsync(function ()
			{
				var savedEvent;

				function saveEvent(event)
				{
					savedEvent = event;
				}

				$element.on(eventName + ".deferredPressKey", saveEvent);
				$element.simulate(eventName, key);
				$element.off(eventName + ".deferredPressKey", saveEvent);

				return savedEvent;

			}, defaultKeyTimeout);
		}

		function pressKeyDown($element, key, keyDownAction)
		{
			keyDownAction = keyDownAction || $.noop;

			return deferredPressKey("keydown", $element, key)
				.then(keyDownAction);
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
			return $.when(
				pressKeyDown($element, key, keyDownAction)
					.pipe(function ()
					{
						return pressKeyPress($element, key)
								.pipe(function ()
								{
									return pressKeyUp($element, key);
								});
					}));
		}
	}

	// Tab simulation
	{
		function pressTab($element, shift)
		{
			shift = !!shift;

			var key = getSimulatedTabkeyEventOptions(shift);

			return pressKey(
			$element,
			key,
			function ()
			{
				emulateTabbing($element, (shift ? -1 : 1));
			});
		}

		function getFocusedElement()
		{
			return $(document.activeElement);
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
	}

	// Test helpers
	{
		function normalSetup()
		{
			var $qunitFixture = $("#qunit-fixture");
			var $div = $("<div />");

			$div.appendTo($qunitFixture);

			$container = $div;
		}

		function fnSkipA()
		{
			$("#a").skipOnTab();
		}

		function fnSkipContainer()
		{
			$("#container").skipOnTab();
		}
	}

	// Assertion functions
	{
		function assertId($element, id)
		{
			// DEBUG
			if ($element.attr("id") !== id)
			{
				try
				{
					console.error([$element, $element.attr("id"), id]);

				} catch (e)
				{
					// Could show an alert message, but what the hell
				}
			}

			strictEqual($element.attr("id"), id, "The id did not match for element " + $element);
		}

		function tabAssertId(id, shift)
		{
			shift = !!shift;

			return function ()
			{
				return pressTabAndGetFocusedElement(shift)
					.pipe(function ($focused)
					{
						assertId($focused, id);
					});
			};
		}

		// Enabling SkipOnTab on the element (class/attribute)
		{
			function assertElementStartAEnd()
			{
				$("#start").focus();

				assertId(getFocusedElement(), "start");

				return $.when()
				// Skip all skippable elements
					.pipe(tabAssertId("end"))
				// Reverse tab back to the start
					.pipe(tabAssertId("a", true))
					.pipe(tabAssertId("start", true))
				// Async test, must run start()
					.pipe(start);
			}

			function assertElementStartABCEnd()
			{
				$("#start").focus();

				assertId(getFocusedElement(), "start");

				return $.when()
				// Skip all skippable elements
					.pipe(tabAssertId("b"))
					.pipe(tabAssertId("end"))
				// Reverse tab back to the start
					.pipe(tabAssertId("c", true))
					.pipe(tabAssertId("b", true))
					.pipe(tabAssertId("a", true))
					.pipe(tabAssertId("start", true))
				// Async test, must run start()
					.pipe(start);
			}

			function assertElementStartACEnd()
			{
				$("#start").focus();

				assertId(getFocusedElement(), "start");

				return $.when()
				// Skip all skippable elements
					.pipe(tabAssertId("end"))
				// Reverse tab back to the start
					.pipe(tabAssertId("c", true))
					.pipe(tabAssertId("a", true))
					.pipe(tabAssertId("start", true))
				// Async test, must run start()
					.pipe(start);
			}
		}

		// Dynamically enabling SkipOnTab
		{
			function assertStartAEnd(fnc)
			{
				$("#start").focus();

				assertId(getFocusedElement(), "start");

				// Forward tab as normal when skipping has not been initialized
				return $.when()
					.pipe(tabAssertId("a"))
					.pipe(tabAssertId("end"))
				// Reverse tab as normal when skipping has not been initialized
					.pipe(tabAssertId("a", true))
					.pipe(tabAssertId("start", true))
				// Initialize SkipOnTab
					.pipe(
					function ()
					{
						fnc();

						assertId(getFocusedElement(), "start");
					})
					.pipe(assertElementStartAEnd);
			}

			function assertStartABCEnd(fnc)
			{
				$("#start").focus();

				assertId(getFocusedElement(), "start");

				// Forward tab as normal when skipping has not been initialized
				return $.when()
					.pipe(tabAssertId("a"))
					.pipe(tabAssertId("b"))
					.pipe(tabAssertId("c"))
					.pipe(tabAssertId("end"))
				// Reverse tab as normal when skipping has not been initialized
					.pipe(tabAssertId("c", true))
					.pipe(tabAssertId("b", true))
					.pipe(tabAssertId("a", true))
					.pipe(tabAssertId("start", true))
				// Initialize SkipOnTab
					.pipe(
					function ()
					{
						fnc();

						assertId(getFocusedElement(), "start");
					})
					.pipe(assertElementStartABCEnd);
			}

			function assertStartACEnd(fnc)
			{
				$("#start").focus();

				assertId(getFocusedElement(), "start");

				// Forward tab as normal when skipping has not been initialized
				return $.when()
					.pipe(tabAssertId("a"))
					.pipe(tabAssertId("c"))
					.pipe(tabAssertId("end"))
				// Reverse tab as normal when skipping has not been initialized
					.pipe(tabAssertId("c", true))
					.pipe(tabAssertId("a", true))
					.pipe(tabAssertId("start", true))
				// Initialize SkipOnTab
					.pipe(
					function ()
					{
						fnc();

						assertId(getFocusedElement(), "start");
					})
					.pipe(assertElementStartACEnd);
			}
		}
	}

	(function ()
	{
		module("Library load");

		test("Object exists", 2, function ()
		{
			notStrictEqual(typeof (JoelPurra.SkipOnTab), "undefined", "JoelPurra.SkipOnTab is undefined.");
			strictEqual(typeof (JoelPurra.SkipOnTab), "function", "JoelPurra.SkipOnTab is not a function.");
		});

	} ());

	(function ()
	{
		module("init");

		asyncTest("Static elements", 7, function ()
		{
			var $staticContainer = $("#elements-initialized-at-startup");

			assertElementStartABCEnd()
				.pipe(function ()
				{
					// Run the static tests only once
					$staticContainer.remove();
				});
		});

	} ());

	(function ()
	{
		module("Elements",
		{
			setup: normalSetup
		});

		asyncTest("With class name", 4, function ()
		{
			$container
				.append('<input id="start" type="text" value="text field that is the starting point" />')
				.append('<input id="a" type="text" value="text field that is skipped" class="skip-on-tab" />')
				.append('<input id="end" type="submit" value="submit button that is at the end of the skipped elements" />');

			assertElementStartAEnd();
		});

		asyncTest("With data attribute", 4, function ()
		{
			$container
				.append('<input id="start" type="text" value="text field that is the starting point" />')
				.append('<input id="a" type="text" value="text field that is skipped" data-skip-on-tab="true" />')
				.append('<input id="end" type="submit" value="submit button that is at the end of the skipped elements" />');

			assertElementStartAEnd();
		});

		asyncTest("Container with class name", 4, function ()
		{
			$container
				.append('<input id="start" type="text" value="text field that is the starting point" />')
				.append($('<div id="container" class="skip-on-tab" />')
					.append('<input id="a" type="text" value="text field that is skipped" />'))
				.append('<input id="end" type="submit" value="submit button that is at the end of the skipped elements" />');

			assertElementStartAEnd();
		});

		asyncTest("Container with data attribute", 4, function ()
		{
			$container
				.append('<input id="start" type="text" value="text field that is the starting point" />')
				.append($('<div id="container" data-skip-on-tab="true" />')
					.append('<input id="a" type="text" value="text field that is skipped" />'))
				.append('<input id="end" type="submit" value="submit button that is at the end of the skipped elements" />');

			assertElementStartAEnd();
		});

		asyncTest("Container with nested skippables", 4, function ()
		{
			$container
				.append('<input id="start" type="text" value="text field that is the starting point" />')
				.append($('<ol id="container" data-skip-on-tab="true" />')
					.append($('<li />')
						.append('<input id="a" type="text" value="text field that is skipped" />')))
				.append('<input id="end" type="submit" value="submit button that is at the end of the skipped elements" />');

			assertElementStartAEnd();
		});

		asyncTest("Container excludes by class name", 7, function ()
		{
			$container
				.append('<input id="start" type="text" value="text field that is the starting point" />')
				.append($('<div id="container" data-skip-on-tab="true" />')
					.append('<input id="a" type="text" value="text field that is skipped" />')
					.append('<input id="b" type="text" value="text field that is not skipped" class="disable-skip-on-tab" />')
					.append('<input id="c" type="text" value="text field that is skipped" />'))
				.append('<input id="end" type="submit" value="submit button that is at the end of the skipped elements" />');

			assertElementStartABCEnd();
		});

		asyncTest("Container excludes by data attribute", 7, function ()
		{
			$container
				.append('<input id="start" type="text" value="text field that is the starting point" />')
				.append($('<div id="container" data-skip-on-tab="true" />')
					.append('<input id="a" type="text" value="text field that is skipped" />')
					.append('<input id="b" type="text" value="text field that is not skipped" data-skip-on-tab="false" />')
					.append('<input id="c" type="text" value="text field that is skipped" />'))
				.append('<input id="end" type="submit" value="submit button that is at the end of the skipped elements" />');

			assertElementStartABCEnd();
		});

		asyncTest("Container excludes hidden", 5, function ()
		{
			$container
				.append('<input id="start" type="text" value="text field that is the starting point" />')
				.append($('<div id="container" data-skip-on-tab="true" />')
					.append('<input id="a" type="text" value="text field that is skipped" />')
					.append('<input id="b" type="hidden" value="hidden field that is always skipped" />')
					.append('<input id="c" type="text" value="text field that is skipped" />'))
				.append('<input id="end" type="submit" value="submit button that is at the end of the skipped elements" />');

			assertElementStartACEnd();
		});

		asyncTest("Container excludes disabled", 5, function ()
		{
			$container
				.append('<input id="start" type="text" value="text field that is the starting point" />')
				.append($('<div id="container" data-skip-on-tab="true" />')
					.append('<input id="a" type="text" value="text field that is skipped" />')
					.append('<input id="b" type="text" value="disabled text field that is always skipped" disabled="disabled" />')
					.append('<input id="c" type="text" value="text field that is skipped" />'))
				.append('<input id="end" type="submit" value="submit button that is at the end of the skipped elements" />');

			assertElementStartACEnd();
		});

		asyncTest("Container excludes anchors without href", 5, function ()
		{
			$container
				.append('<input id="start" type="text" value="text field that is the starting point" />')
				.append($('<div id="container" data-skip-on-tab="true" />')
					.append('<input id="a" type="text" value="text field that is skipped" />')
					.append('<a id="b">anchor without href that is always skipped</a>')
					.append('<input id="c" type="text" value="text field that is skipped" />'))
				.append('<input id="end" type="submit" value="submit button that is at the end of the skipped elements" />');

			assertElementStartACEnd();
		});

	} ());

	(function ()
	{
		module("skipOnTab",
		{
			setup: normalSetup
		});

		asyncTest("Element", 10, function ()
		{
			$container
				.append('<input id="start" type="text" value="text field that is the starting point" />')
				.append('<input id="a" type="text" value="text field that is skipped" />')
				.append('<input id="end" type="submit" value="submit button that is at the end of the skipped elements" />');

			assertStartAEnd(function ()
			{
				JoelPurra.SkipOnTab.skipOnTab($("#a"));
			});
		});

		asyncTest("Container", 10, function ()
		{
			$container
				.append('<input id="start" type="text" value="text field that is the starting point" />')
				.append($('<div id="container" />')
					.append('<input id="a" type="text" value="text field that is skipped" />'))
				.append('<input id="end" type="submit" value="submit button that is at the end of the skipped elements" />');

			assertStartAEnd(function ()
			{
				JoelPurra.SkipOnTab.skipOnTab($("#container"));
			});
		});

	} ());

	(function ()
	{
		module("$.fn.skipOnTab",
		{
			setup: normalSetup
		});

		asyncTest("With class name", 10, function ()
		{
			$container
				.append('<input id="start" type="text" value="text field that is the starting point" />')
				.append('<input id="a" type="text" value="text field that is skipped" />')
				.append('<input id="end" type="submit" value="submit button that is at the end of the skipped elements" />');

			assertStartAEnd(fnSkipA);
		});

		asyncTest("With data attribute", 10, function ()
		{
			$container
				.append('<input id="start" type="text" value="text field that is the starting point" />')
				.append('<input id="a" type="text" value="text field that is skipped" />')
				.append('<input id="end" type="submit" value="submit button that is at the end of the skipped elements" />');

			assertStartAEnd(fnSkipA);
		});

		asyncTest("Container with class name", 10, function ()
		{
			$container
				.append('<input id="start" type="text" value="text field that is the starting point" />')
				.append($('<div id="container" />')
					.append('<input id="a" type="text" value="text field that is skipped" />'))
				.append('<input id="end" type="submit" value="submit button that is at the end of the skipped elements" />');

			assertStartAEnd(fnSkipContainer);
		});

		asyncTest("Container with data attribute", 10, function ()
		{
			$container
				.append('<input id="start" type="text" value="text field that is the starting point" />')
				.append($('<div id="container" />')
					.append('<input id="a" type="text" value="text field that is skipped" />'))
				.append('<input id="end" type="submit" value="submit button that is at the end of the skipped elements" />');

			assertStartAEnd(fnSkipContainer);
		});

		asyncTest("Container with nested skippables", 10, function ()
		{
			$container
				.append('<input id="start" type="text" value="text field that is the starting point" />')
				.append($('<ol id="container" />')
					.append($('<li />')
						.append('<input id="a" type="text" value="text field that is skipped" />')))
				.append('<input id="end" type="submit" value="submit button that is at the end of the skipped elements" />');

			assertStartAEnd(fnSkipContainer);
		});

		asyncTest("Container excludes by class name", 17, function ()
		{
			$container
				.append('<input id="start" type="text" value="text field that is the starting point" />')
				.append($('<div id="container" />')
					.append('<input id="a" type="text" value="text field that is skipped" />')
					.append('<input id="b" type="text" value="text field that is not skipped" class="disable-skip-on-tab" />')
					.append('<input id="c" type="text" value="text field that is skipped" />'))
				.append('<input id="end" type="submit" value="submit button that is at the end of the skipped elements" />');

			assertStartABCEnd(fnSkipContainer);
		});

		asyncTest("Container excludes by data attribute", 17, function ()
		{
			$container
				.append('<input id="start" type="text" value="text field that is the starting point" />')
				.append($('<div id="container" />')
					.append('<input id="a" type="text" value="text field that is skipped" />')
					.append('<input id="b" type="text" value="text field that is not skipped" data-skip-on-tab="false" />')
					.append('<input id="c" type="text" value="text field that is skipped" />'))
				.append('<input id="end" type="submit" value="submit button that is at the end of the skipped elements" />');

			assertStartABCEnd(fnSkipContainer);
		});

		asyncTest("Container excludes hidden", 13, function ()
		{
			$container
				.append('<input id="start" type="text" value="text field that is the starting point" />')
				.append($('<div id="container" />')
					.append('<input id="a" type="text" value="text field that is skipped" />')
					.append('<input id="b" type="hidden" value="hidden field that is always skipped" />')
					.append('<input id="c" type="text" value="text field that is skipped" />'))
				.append('<input id="end" type="submit" value="submit button that is at the end of the skipped elements" />');

			assertStartACEnd(fnSkipContainer);
		});

		asyncTest("Container excludes disabled", 13, function ()
		{
			$container
				.append('<input id="start" type="text" value="text field that is the starting point" />')
				.append($('<div id="container" />')
					.append('<input id="a" type="text" value="text field that is skipped" />')
					.append('<input id="b" type="text" value="disabled text field that is always skipped" disabled="disabled" />')
					.append('<input id="c" type="text" value="text field that is skipped" />'))
				.append('<input id="end" type="submit" value="submit button that is at the end of the skipped elements" />');

			assertStartACEnd(fnSkipContainer);
		});

		asyncTest("Container excludes anchors without href", 13, function ()
		{
			$container
				.append('<input id="start" type="text" value="text field that is the starting point" />')
				.append($('<div id="container" />')
					.append('<input id="a" type="text" value="text field that is skipped" />')
					.append('<a id="b">anchor without href that is always skipped</a>')
					.append('<input id="c" type="text" value="text field that is skipped" />'))
				.append('<input id="end" type="submit" value="submit button that is at the end of the skipped elements" />');

			assertStartACEnd(fnSkipContainer);
		});

		asyncTest("Element", 10, function ()
		{
			$container
				.append('<input id="start" type="text" value="text field that is the starting point" />')
				.append('<input id="a" type="text" value="text field that is skipped" />')
				.append('<input id="end" type="submit" value="submit button that is at the end of the skipped elements" />');

			assertStartAEnd(fnSkipA);
		});

		asyncTest("Container", 10, function ()
		{
			$container
				.append('<input id="start" type="text" value="text field that is the starting point" />')
				.append($('<div id="container" />')
					.append('<input id="a" type="text" value="text field that is skipped" />'))
				.append('<input id="end" type="submit" value="submit button that is at the end of the skipped elements" />');

			assertStartAEnd(fnSkipContainer);
		});

	} ());

	(function ()
	{
		module("Element types",
		{
			setup: normalSetup
		});

		asyncTest("Standard", 56, function ()
		{
			$container
				.append('<input id="start" type="text" value="text field that is the starting point" />')
				.append($('<div id="container" />')
					.append('<input id="a" type="text" value="text field that is skipped" />')
					.append('<input id="b" type="password" value="password field that is skipped" />')
					.append('<input id="c" type="checkbox" value="checkbox that is skipped" />')
					.append('<input id="d" type="radio" value="radio button that is skipped" />')
					.append('<input id="e" type="file" value="file field that is skipped" />')
					.append('<input id="f" type="hidden" value="hidden field that is always skipped" />')
					.append('<input id="g" type="submit" value="submit button that is skipped" />')
					.append('<input id="h" type="image" value="image button that is skipped" />')
					.append('<input id="i" type="reset" value="reset button that is skipped" />')
					.append('<input id="j" type="button" value="button button that is skipped" />')
					.append('<button id="k" type="button" value="button button button that is skipped"></button>')
					.append('<button id="l" type="submit" value="submit button button that is skipped"></button>')
					.append('<button id="m" type="reset" value="reset button button that is skipped"></button>')
					.append('<textarea id="n" value="textarea that is skipped"></textarea>')
					.append('<a id="o">anchor without href that is always skipped</a>')
					.append('<a id="p" href="about:blank">anchor that is skipped</a>')
					.append('<input id="q" type="text" disabled="disabled" value="disabled input that is always skipped" />')
					.append('<input id="r" type="text" class="disable-skip-on-tab" value="input that will not be skipped" />')
					.append('<input id="s" type="text" data-skip-on-tab="false" value="input that will not be skipped" />'))
				.append('<input id="end" type="submit" value="submit button that is at the end of the skipped elements" />');

			$("#start").focus();

			assertId(getFocusedElement(), "start");

			// Forward tab as normal when skipping has not been initialized
			$.when()
				.pipe(tabAssertId("a"))
				.pipe(tabAssertId("b"))
				.pipe(tabAssertId("c"))
				.pipe(tabAssertId("d"))
				.pipe(tabAssertId("e"))
				.pipe(tabAssertId("g"))
				.pipe(tabAssertId("h"))
				.pipe(tabAssertId("i"))
				.pipe(tabAssertId("j"))
				.pipe(tabAssertId("k"))
				.pipe(tabAssertId("l"))
				.pipe(tabAssertId("m"))
				.pipe(tabAssertId("n"))
				.pipe(tabAssertId("p"))
				.pipe(tabAssertId("r"))
				.pipe(tabAssertId("s"))
				.pipe(tabAssertId("end"))
			// Reverse tab as normal when skipping has not been initialized
				.pipe(tabAssertId("s", true))
				.pipe(tabAssertId("r", true))
				.pipe(tabAssertId("p", true))
				.pipe(tabAssertId("n", true))
				.pipe(tabAssertId("m", true))
				.pipe(tabAssertId("l", true))
				.pipe(tabAssertId("k", true))
				.pipe(tabAssertId("j", true))
				.pipe(tabAssertId("i", true))
				.pipe(tabAssertId("h", true))
				.pipe(tabAssertId("g", true))
				.pipe(tabAssertId("e", true))
				.pipe(tabAssertId("d", true))
				.pipe(tabAssertId("c", true))
				.pipe(tabAssertId("b", true))
				.pipe(tabAssertId("a", true))
				.pipe(tabAssertId("start", true))
			// Initialize SkipOnTab
				.pipe(
				function ()
				{
					fnSkipContainer();

					assertId(getFocusedElement(), "start");
				})
			// Skip all skippable elements
				.pipe(tabAssertId("r"))
				.pipe(tabAssertId("s"))
				.pipe(tabAssertId("end"))
			// Reverse tab back to the start
				.pipe(tabAssertId("s", true))
				.pipe(tabAssertId("r", true))
				.pipe(tabAssertId("p", true))
				.pipe(tabAssertId("n", true))
				.pipe(tabAssertId("m", true))
				.pipe(tabAssertId("l", true))
				.pipe(tabAssertId("k", true))
				.pipe(tabAssertId("j", true))
				.pipe(tabAssertId("i", true))
				.pipe(tabAssertId("h", true))
				.pipe(tabAssertId("g", true))
				.pipe(tabAssertId("e", true))
				.pipe(tabAssertId("d", true))
				.pipe(tabAssertId("c", true))
				.pipe(tabAssertId("b", true))
				.pipe(tabAssertId("a", true))
				.pipe(tabAssertId("start", true))
			// Async test, must run start()
				.pipe(start);
		});

	} ());
} (jQuery));

