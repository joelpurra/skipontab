/*!
* @license SkipOnTab
* Copyright (c) 2011, 2012 The Swedish Post and Telecom Authority (PTS)
* Developed for PTS by Joel Purra <http://joelpurra.se/>
* Released under the BSD license.
*
* a jQuery plugin to
*	- exempt selected fields from forward tab order
*	- include excluded fields in reverse tab order
*/

/*jslint vars: true, white: true, browser: true*/
/*global jQuery*/

// Set up namespace, if needed
var JoelPurra = JoelPurra || {};

// TODO: put common functions in a common file for
// skipontab.joelpurra.js and plusastab.joelpurra.js?
(function ($, namespace) {

	// Add options defaults here
	var internalDefaults = {
	};

	var options = internalDefaults;

	namespace.SkipOnTab = function () {
	};

	var initDone = false;

	var keyStatus = {};

	// Keys from
	// https://developer.mozilla.org/en/DOM/KeyboardEvent#Virtual_key_codes
	var KEY_TAB = 9;

	// TODO: get code for :focusable, :tabbable from jQuery UI?
	var focusable = ":input, a[href]";
	var disableskipOnTab = ".disable-skip-on-tab, [data-skip-on-tab=false]";

	// Private functions
	{
		function setTabKeyStatus(isTab, isReverse, $target) {

			keyStatus = {
				isTab: isTab,
				isReverse: isReverse,
				$target: $target
			};
		}

		// Copy of function in plusastab.joelpurra.js/skipontab.joelpurra.js
		function findNextFocusable($from, offset) {

			var $focusable = $(focusable)
				.not(":disabled")
				.not(":hidden");

			var currentIndex = $focusable.index($from);

			var nextIndex = (currentIndex + offset) % $focusable.length;

			if (nextIndex <= -1) {

				nextIndex = $focusable.length + nextIndex;
			}

			var $next = $focusable.eq(nextIndex);

			return $next;
		}

		// Copy of function in plusastab.joelpurra.js/skipontab.joelpurra.js
		function emulateTabbing($from, offset) {

			var $next = findNextFocusable($from, offset);

			$next.focus();
		}

		function performEmulatedTabbing() {

			if (keyStatus.isTab
				&& keyStatus.$target !== undefined
				&& keyStatus.$target.length !== 0) {

				if (!keyStatus.isReverse) {

					emulateTabbing(keyStatus.$target, +1);

					return true;
				}
			}

			return false;
		}

		function checkSkipOnTabFocus(event) {

			if (!initDone) {

				return;
			}

			setTabKeyStatus(
				keyStatus.isTab,
				keyStatus.isReverse,
				$(event.target));

			var wasDone = performEmulatedTabbing();

			if (wasDone) {

				event.preventDefault();
				event.stopPropagation();
				event.stopImmediatePropagation();

				return false;
			}

			return;
		}

		function isTabkey(event) {

			// Checked later for reverse tab
			//&& !event.shiftKey

			if (!event.altKey
				&& !event.ctrlKey
				&& !event.metaKey
				&& event.which === KEY_TAB) {

				return true;
			}

			return false;
		}

		function checkTabKeyDown(event) {

			if (!initDone) {

				return;
			}

			if (isTabkey(event)) {

				setTabKeyStatus(true, event.shiftKey);

			} else {

				setTabKeyStatus(false, false, undefined);
			}


			return;
		}

		function checkTabKeyUp(event) {

			function checkTabKeyUpInner() {

				if (!initDone) {

					return;
				}

				setTabKeyStatus(false, false, undefined);
			}

			setTimeout(checkTabKeyUpInner, 1);

			return;
		}

		atStartup = function () {

			setTabKeyStatus(false, false);

			$(document).keydown(checkTabKeyDown);
			$(document).keydown(checkTabKeyUp);

			namespace.SkipOnTab
				.skipOnTab($(".skip-on-tab, [data-skip-on-tab=true]"));
		}
	}

	// Public functions
	{
		namespace.SkipOnTab.init = function (userOptions) {

			// Merge the options onto the current options
			// (usually the default values)
			$.extend(true, options, userOptions);

			atStartup();

			initDone = true;
		};

		namespace.SkipOnTab.skipOnTab = function ($elements) {

			var $onlyFocusable = $elements
									.add($elements
											.find(focusable))
									.filter(focusable);

			$onlyFocusable
				.not(disableskipOnTab)
				.not("[data-skip-on-tab-initialized=true]")
				.attr("data-skip-on-tab-initialized", "true")
				.focus(checkSkipOnTabFocus);
		};
	}

} (jQuery, JoelPurra));