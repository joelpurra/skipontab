/*!
* @license SkipOnTab
* Copyright (c) 2011, 2012, 2013, 2014, 2015, 2016, 2017 The Swedish Post and Telecom Authority (PTS)
* Developed for PTS by Joel Purra <https://joelpurra.com/>
* Released under the BSD license.
*
* A jQuery plugin to
*    - exempt selected fields from forward tab order
*    - include excluded fields in reverse tab order
*/

/* global
jQuery,
*/

// Set up namespace, if needed
var JoelPurra = JoelPurra || {};

(function($, namespace) {
    // Private functions
    function setTabKeyStatus(isTab, isReverse, $target) {
        keyStatus = {
            isTab: isTab,
            isReverse: isReverse,
            $target: $target,
        };
    }

    function resetTabKeyStatus() {
        setTabKeyStatus(false, false, undefined);
    }

    function performEmulatedTabbing() {
        if (keyStatus.isTab
                && keyStatus.$target !== undefined
                && keyStatus.$target.length === 1) {
            if (!keyStatus.isReverse) {
                keyStatus.$target.emulateTab(+1);

                return true;
            }
        }

        return false;
    }

    function checkSkipOnTabFocus(event) {
        var $target = $(event.target),
            wasDone = null;

        if ($target.is(disableSkipOnTab)
                || $target.parents(disableSkipOnTab).length > 0
                || (!$target.is(enableSkipOnTab)
                    && $target.parents(enableSkipOnTab).length === 0)) {
            return;
        }

        setTabKeyStatus(keyStatus.isTab, keyStatus.isReverse, $target);

        wasDone = performEmulatedTabbing();

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

        $(document)
            .on("keydown" + eventNamespace, checkTabKey)
            .on("focusin" + eventNamespace, checkSkipOnTabFocus);
    }

    namespace.SkipOnTab = function() {
    };

    var eventNamespace = ".SkipOnTab",

        keyStatus = {},

        // Keys from
        // https://developer.mozilla.org/en/DOM/KeyboardEvent#Virtual_key_codes
        KEY_TAB = 9,

        enableSkipOnTab = ".skip-on-tab, [data-skip-on-tab=true]",
        disableSkipOnTab = ".disable-skip-on-tab, [data-skip-on-tab=false]";

    // Public functions
    namespace.SkipOnTab.skipOnTab = function($elements, enable) {
        enable = (enable === undefined ? true : enable === true);

        return $elements.each(function() {
            var $this = $(this);

            $this
                .not(disableSkipOnTab)
                .not(enableSkipOnTab)
                .attr("data-skip-on-tab", enable ? "true" : "false");
        });
    };

    $.fn.extend({
        skipOnTab: function(enable) {
            return namespace.SkipOnTab.skipOnTab(this, enable);
        },
    });

    // SkipOnTab initializes listeners when jQuery is ready
    $(initializeAtLoad);
}(jQuery, JoelPurra));
