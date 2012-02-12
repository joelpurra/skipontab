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

	namespace.SkipOnTab = function () {
	};

	var eventNamespace = ".SkipOnTab";

	var keyStatus = {};

	// Keys from
	// https://developer.mozilla.org/en/DOM/KeyboardEvent#Virtual_key_codes
	var KEY_TAB = 9;

	// TODO: get code for :focusable, :tabbable from jQuery UI?
	var focusable = ":input, a[href]";
	var enableSkipOnTab = ".skip-on-tab, [data-skip-on-tab=true]";
	var disableSkipOnTab = ".disable-skip-on-tab, [data-skip-on-tab=false]";

	// Private functions
	{
		function setTabKeyStatus(isTab, isReverse, $target) {

			keyStatus = {
				isTab: isTab,
				isReverse: isReverse,
				$target: $target
			};
		}

		function resetTabKeyStatus()
		{
			setTabKeyStatus(false, false, undefined);
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
				&& keyStatus.$target.length === 1) {

				if (!keyStatus.isReverse) {

					emulateTabbing(keyStatus.$target, +1);

					return true;
				}
			}

			return false;
		}

		function checkSkipOnTabFocus(event) {

			var $target = $(event.target);

			if ($target.is(disableSkipOnTab)
				|| $target.parents(disableSkipOnTab).length > 0
				|| (!$target.is(enableSkipOnTab)
					&& $target.parents(enableSkipOnTab).length === 0))
			{
				return;
			}

			setTabKeyStatus(keyStatus.isTab, keyStatus.isReverse, $target);

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

		function checkTabKey(event) {

			if (isTabkey(event)) {

				setTabKeyStatus(true, event.shiftKey);

				setTimeout(resetTabKeyStatus, 1);

			} else {

				resetTabKeyStatus();
			}

			return;
		}

		function initializeAtLoad() {

			resetTabKeyStatus();

			$(document).on("keydown" + eventNamespace, checkTabKey);
			$(document).on("focusin" + eventNamespace, checkSkipOnTabFocus);
		}
	}

	// Public functions
	{
		namespace.SkipOnTab.skipOnTab = function ($elements, enable) {

			enable = (enable === undefined ? true : enable === true);

			return $elements.each(function () {
					
				var $this = $(this);

				$this
					.not(disableSkipOnTab)
					.not(enableSkipOnTab)
					.attr("data-skip-on-tab",  enable ? "true" : "false");
			});
		};

		$.fn.extend({
			skipOnTab: function (enable) {

				return namespace.SkipOnTab.skipOnTab(this, enable);
			}
		});
	}

	// SkipOnTab initializes listeners when jQuery is ready
	$(initializeAtLoad);

} (jQuery, JoelPurra));