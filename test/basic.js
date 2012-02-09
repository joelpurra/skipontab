/// <reference path="qunit/qunit/qunit.js" />
/// <reference path="jquery-ui/jquery-1.7.1.js" />
/// <reference path="jquery-ui/tests/jquery.simulate.js" />
/// <reference path="../src/skipontab.joelpurra.js" />

/*jslint white: true, regexp: true, maxlen: 120*/
/*global JoelPurra, jQuery, module, test, ok, strictEqual, notStrictEqual*/

(function ($)
{
	var $container,
		defaultKeyTimeout = 1;

	function normalSetup()
	{
		$container = $("#qunit-fixture")
	}

	// Tab focus emulation
	{
		// Can't actually trigger the TAB key in the browser,
		// so simulate by focusing the next element
		// NOTE: this is pretty bad as it's using the internals
		// of SkipOnTab - might be better to find a way to make
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
			console.log.call(console, arguments);
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
				var savedEvent = undefined;

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
									return pressKeyUp($element, key)
								})
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
				emulateTabbing($element, 1 * (shift ? -1 : 1));
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

	// Assertion functions
	{
		function assertId($element, id)
		{
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
			}
		}

		function assertStartAEnd(fnc)
		{
			$("#start").focus();

			assertId(getFocusedElement(), "start");

			// Forward tab as normal when skipping has not been initialized
			$.when()
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
			// Skip all skippable elements
				.pipe(tabAssertId("end"))
			// Reverse tab back to the start
				.pipe(tabAssertId("a", true))
				.pipe(tabAssertId("start", true))
			// Async test, must run start()
				.pipe(start);
		}

		function assertStartABCEnd(fnc)
		{
			$("#start").focus();

			assertId(getFocusedElement(), "start");

			// Forward tab as normal when skipping has not been initialized
			$.when()
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

		function assertStartACEnd(fnc)
		{
			$("#start").focus();

			assertId(getFocusedElement(), "start");

			// Forward tab as normal when skipping has not been initialized
			$.when()
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
		module("init",
		{
			setup: normalSetup
		});

		asyncTest("With class name", 9, function ()
		{
			$container
				.append('<input id="start" type="text" value="text field that is the starting point" />')
				.append('<input id="a" type="text" value="text field that is skipped" class="skip-on-tab" />')
				.append('<input id="end" type="submit" value="submit button that is at the end of the skipped elements" />');

			assertStartAEnd(JoelPurra.SkipOnTab.init);
		});

		asyncTest("With data attribute", 9, function ()
		{
			$container
				.append('<input id="start" type="text" value="text field that is the starting point" />')
				.append('<input id="a" type="text" value="text field that is skipped" data-skip-on-tab="true" />')
				.append('<input id="end" type="submit" value="submit button that is at the end of the skipped elements" />');

			assertStartAEnd(JoelPurra.SkipOnTab.init);
		});

		asyncTest("Container with class name", 9, function ()
		{
			$container
				.append('<input id="start" type="text" value="text field that is the starting point" />')
				.append($('<div id="container" class="skip-on-tab" />')
					.append('<input id="a" type="text" value="text field that is skipped" />'))
				.append('<input id="end" type="submit" value="submit button that is at the end of the skipped elements" />');

			assertStartAEnd(JoelPurra.SkipOnTab.init);
		});

		asyncTest("Container with data attribute", 9, function ()
		{
			$container
				.append('<input id="start" type="text" value="text field that is the starting point" />')
				.append($('<div id="container" data-skip-on-tab="true" />')
					.append('<input id="a" type="text" value="text field that is skipped" />'))
				.append('<input id="end" type="submit" value="submit button that is at the end of the skipped elements" />');

			assertStartAEnd(JoelPurra.SkipOnTab.init);
		});

		asyncTest("Container excludes by class name", 16, function ()
		{
			$container
				.append('<input id="start" type="text" value="text field that is the starting point" />')
				.append($('<div id="container" data-skip-on-tab="true" />')
					.append('<input id="a" type="text" value="text field that is skipped" />')
					.append('<input id="b" type="text" value="text field that is not skipped" class="disable-skip-on-tab" />')
					.append('<input id="c" type="text" value="text field that is skipped" />'))
				.append('<input id="end" type="submit" value="submit button that is at the end of the skipped elements" />');

			assertStartABCEnd(JoelPurra.SkipOnTab.init);
		});

		asyncTest("Container excludes by data attribute", 16, function ()
		{
			$container
				.append('<input id="start" type="text" value="text field that is the starting point" />')
				.append($('<div id="container" data-skip-on-tab="true" />')
					.append('<input id="a" type="text" value="text field that is skipped" />')
					.append('<input id="b" type="text" value="text field that is not skipped" data-skip-on-tab="false" />')
					.append('<input id="c" type="text" value="text field that is skipped" />'))
				.append('<input id="end" type="submit" value="submit button that is at the end of the skipped elements" />');

			assertStartABCEnd(JoelPurra.SkipOnTab.init);
		});

		asyncTest("Container excludes hidden", 12, function ()
		{
			$container
				.append('<input id="start" type="text" value="text field that is the starting point" />')
				.append($('<div id="container" data-skip-on-tab="true" />')
					.append('<input id="a" type="text" value="text field that is skipped" />')
					.append('<input id="b" type="hidden" value="hidden field that is always skipped" />')
					.append('<input id="c" type="text" value="text field that is skipped" />'))
				.append('<input id="end" type="submit" value="submit button that is at the end of the skipped elements" />');

			assertStartACEnd(JoelPurra.SkipOnTab.init);
		});

		asyncTest("Container excludes disabled", 12, function ()
		{
			$container
				.append('<input id="start" type="text" value="text field that is the starting point" />')
				.append($('<div id="container" data-skip-on-tab="true" />')
					.append('<input id="a" type="text" value="text field that is skipped" />')
					.append('<input id="b" type="text" value="disabled text field that is always skipped" disabled="disabled" />')
					.append('<input id="c" type="text" value="text field that is skipped" />'))
				.append('<input id="end" type="submit" value="submit button that is at the end of the skipped elements" />');

			assertStartACEnd(JoelPurra.SkipOnTab.init);
		});

		asyncTest("Container excludes anchors without href", 12, function ()
		{
			$container
				.append('<input id="start" type="text" value="text field that is the starting point" />')
				.append($('<div id="container" data-skip-on-tab="true" />')
					.append('<input id="a" type="text" value="text field that is skipped" />')
					.append('<a id="b">anchor without href that is always skipped</a>')
					.append('<input id="c" type="text" value="text field that is skipped" />'))
				.append('<input id="end" type="submit" value="submit button that is at the end of the skipped elements" />');

			assertStartACEnd(JoelPurra.SkipOnTab.init);
		});

	} ());

	(function ()
	{
		module("skipOnTab",
		{
			setup: normalSetup
		});

		asyncTest("Element", 9, function ()
		{
			$container
				.append('<input id="start" type="text" value="text field that is the starting point" />')
				.append('<input id="a" type="text" value="text field that is skipped" />')
				.append('<input id="end" type="submit" value="submit button that is at the end of the skipped elements" />');

			assertStartAEnd(function ()
			{
				JoelPurra.SkipOnTab.init();

				JoelPurra.SkipOnTab.skipOnTab($("#a"));
			});
		});

		asyncTest("Container", 9, function ()
		{
			$container
				.append('<input id="start" type="text" value="text field that is the starting point" />')
				.append($('<div id="container" data-skip-on-tab="true" />')
					.append('<input id="a" type="text" value="text field that is skipped" />'))
				.append('<input id="end" type="submit" value="submit button that is at the end of the skipped elements" />');

			assertStartAEnd(function ()
			{
				JoelPurra.SkipOnTab.init();

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

		asyncTest("Element", 9, function ()
		{
			$container
				.append('<input id="start" type="text" value="text field that is the starting point" />')
				.append('<input id="a" type="text" value="text field that is skipped" />')
				.append('<input id="end" type="submit" value="submit button that is at the end of the skipped elements" />');

			assertStartAEnd(function ()
			{
				JoelPurra.SkipOnTab.init();

				$("#a").skipOnTab();
			});
		});

		asyncTest("Container", 9, function ()
		{
			$container
				.append('<input id="start" type="text" value="text field that is the starting point" />')
				.append($('<div id="container" data-skip-on-tab="true" />')
					.append('<input id="a" type="text" value="text field that is skipped" />'))
				.append('<input id="end" type="submit" value="submit button that is at the end of the skipped elements" />');

			assertStartAEnd(function ()
			{
				JoelPurra.SkipOnTab.init();

				$("#container").skipOnTab();
			});
		});

	} ());

	(function ()
	{
		module("Larger scale",
		{
			setup: normalSetup
		});

		asyncTest("Existing elements", 56, function ()
		{
			$container
				.append('<input id="start" type="text" value="text field that is the starting point" />')
				.append('<input id="a" type="text" value="text field that is skipped" class="skip-on-tab" />')
				.append('<input id="b" type="password" value="password field that is skipped" class="skip-on-tab" />')
				.append('<input id="c" type="checkbox" value="checkbox that is skipped" class="skip-on-tab" />')
				.append('<input id="d" type="radio" value="radio button that is skipped" class="skip-on-tab" />')
				.append('<input id="e" type="file" value="file field that is skipped" class="skip-on-tab" />')
				.append('<input id="f" type="hidden" value="hidden field that is always skipped" />')
				.append('<input id="g" type="submit" value="submit button that is skipped" class="skip-on-tab" />')
				.append('<input id="h" type="image" value="image button that is skipped" class="skip-on-tab" />')
				.append('<input id="i" type="reset" value="reset button that is skipped" class="skip-on-tab" />')
				.append('<input id="j" type="button" value="button button that is skipped" class="skip-on-tab" />')
				.append('<button id="k" type="button" value="button button button that is skipped" class="skip-on-tab"></button>')
				.append('<button id="l" type="submit" value="submit button button that is skipped" class="skip-on-tab"></button>')
				.append('<button id="m" type="reset" value="reset button button that is skipped" class="skip-on-tab"></button>')
				.append('<textarea id="n" value="textarea that is skipped" class="skip-on-tab"></textarea>')
				.append('<a id="o">anchor without href that is always skipped</a>')
				.append('<a id="p" href="about:blank" class="skip-on-tab">anchor that is skipped</a>')
				.append('<input id="q" type="text" disabled="disabled" value="disabled input that is always skipped" />')
				.append('<input id="r" type="text" class="disable-skip-on-tab" value="input that will not be skipped" />')
				.append('<input id="s" type="text" data-skip-on-tab="false" value="input that will not be skipped" />')
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
					JoelPurra.SkipOnTab.init();

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

