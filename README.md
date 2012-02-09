# SkipOnTab javascript library

* A [jQuery](http://jquery.com/) plugin to
 * exempt selected fields from the forward tab order.
 * include excluded fields in the reverse tab order.

Skipped fields can still be navigated to by keyboard; once skipped and focusing the next form field, use <kbd>shift</kbd>-<kbd>tab</kbd> to step back. Mouse or touch navigation is unaffected.

This library is most useful when the users are familiar with the form, and uses it regularly. Casual users may not feel as comfortable - then again, if they are already using the <kbd>tab</kbd> button, they might see it as an optimization.

## Demos
* `examples/demo.html`: Simple demo for playing around.
* `examples/skip-some-fields-in-order-form.html`: Expanded demo with some thoughts on what fields to skip.

## Original purpose
Developed to skip less used form fields in a web application for registering and administering letters. Examples of skipped fields are dropdowns with sensible defaults, the second address line fields in address forms and buttons for seldom used actions.

## Usage
Both static html fields and dynamically added fields can be skipped. The static html fields have, or are contained within elements that have, the attribute `data-skip-on-tab="true"`. They are initialized with `JoelPurra.SkipOnTab.init();`. Dynamic fields are initialized in code after adding them to the DOM.

Elements that can be focused/tabbed are `<input>`, `<select>`, `<textarea>`, `<button>` and `<a href="...">` (the `href` attribute must exist). These are also the elements that can be skipped.

```html
<!-- Can be applied to skippable elements one by one -->
<input type="text" data-skip-on-tab="true" />
<textarea data-skip-on-tab="true"></textarea>
<a href="http://joelpurra.se/" data-skip-on-tab="true">Joel Purra</a>

<input type="button" value="This button is not skipped" />

<!-- Can be applied to all skippable elements within a container -->
<ol data-skip-on-tab="true">
	<li><input type="checkbox" /> Textbox</li>
	<li><input type="checkbox" /> Another textbox</li>
</ol>

<!-- Can be applied using a class name -->
<button type="submit" class="skip-on-tab">Click me</button>

<!-- Can be explicitly exluded from initialization -->
<input type="text" data-skip-on-tab="false" value="Try shift-tab from here" />
```

```javascript
// Enable skip on tab for existing elements marked with
// class .skip-on-tab or attribute [data-skip-on-tab=true]
JoelPurra.SkipOnTab.init();

// Apply skip on tab to the selected elements
JoelPurra.SkipOnTab.skipOnTab($(selector));

// NOTE: Elements marked with class .disable-skip-on-tab or
// attribute [data-skip-on-tab=false] are always excluded.
```

## Dependencies
SkipOnTab's only runtime dependencies is [jQuery](http://jquery.com/).

## Todo

* [jQuery UI](http://jqueryui.com/) has better code for `:focusable`/`:tabbable`. Investigate how to implement it.
* Investigate `contenteditable="true"`.
* Investigate replacing per-element `.focus()` event listeners with a `$(document).focus()` listener.
* Break out reusable key press functions from tests.

## License
Developed for PTS by Joel Purra <http://joelpurra.se/>

Copyright (c) 2011, 2012, The Swedish Post and Telecom Authority (PTS)
All rights reserved.

Released under the BSD license.
