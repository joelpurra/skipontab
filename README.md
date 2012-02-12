# SkipOnTab javascript library

* A [jQuery](http://jquery.com/) plugin to
 * exempt selected fields from the forward tab order.
 * include excluded fields in the reverse tab order.

When using <kbd>tab</kbd> to navigate through a form, skipping some fields will reduce key presses for the normal use cases. Skipped fields can still be navigated to by keyboard; once skipped and focusing the next form field, use <kbd>shift</kbd>-<kbd>tab</kbd> to step back. Mouse or touch navigation is unaffected.

This library is most useful when the users are familiar with the form, and uses it regularly. Casual users may not feel as comfortable - then again, if they are already using the <kbd>tab</kbd> button, they might see it as an optimization.

## Demos
* `examples/demo.html`: Simple demo for playing around.
* `examples/skip-some-fields-in-order-form.html`: Expanded demo with some thoughts on what fields to skip.

## Usage

### HTML

```html
<!-- Can be applied to skippable elements one by one -->
<input type="text" data-skip-on-tab="true" />
<textarea data-skip-on-tab="true"></textarea>
<a href="http://joelpurra.se/" data-skip-on-tab="true">Joel Purra</a>

<input type="button" value="This button is not skipped" />

<!-- Can be applied using a class name -->
<input type="text" value="" class="skip-on-tab" />

<!-- Can be applied to all skippable elements within a container -->
<ol data-skip-on-tab="true">
	<li><input type="checkbox" /> Checkbox</li>
	<li><input type="checkbox" /> Another checkbox</li>

	<!-- Can be explicitly exluded from initialization -->
	<li><input type="checkbox" data-skip-on-tab="false" /> Important checkbox</li>
	<li><input type="checkbox" class="disable-skip-on-tab" /> Another important checkbox</li>
</ol>
```

### Javascript

```javascript
// Apply skip on tab to the selected elements
$(selector).skipOnTab();

// Equivalent static function
JoelPurra.SkipOnTab.skipOnTab($(selector));
```

### Skippable elements
Elements that can be focused/tabbed include `<input>`, `<select>`, `<textarea>`, `<button>` and `<a href="...">` (the `href` attribute must exist). These are also the elements that can be skipped.

Note that `<input type="hidden" />`, `<a>` (without `href`), `disabled="disabled"` or `display: none;` elements cannot be focused.

### Static elements
Static skippable html elements can have, or be contained within elements that have, the attribute `data-skip-on-tab="true"` or the class `.skip-on-tab`. They are initialized automatically when the library has been loaded/executed.

### Dynamic elements
Dynamic elements are initialized to SkipOnTab in code after adding them to the DOM; `$("#my-optional-input").skipOnTab()`.

### Containers
When SkipOnTab is applied to html containers, like `<div>`, `<ul>` or `<fieldset>`, all skippable child elements are implicitly skipped.

### Excluded elements
Elements marked with class `.disable-skip-on-tab` or attribute `data-skip-on-tab=false` are not initialized by SkipOnTab.

## Original purpose
Developed to skip less used form fields in a web application for registering and administering letters. Examples of skipped fields are dropdowns with sensible defaults, the second address line fields in address forms and buttons for seldom used actions.

## Dependencies
SkipOnTab's only runtime dependencies is [jQuery](http://jquery.com/).

## Todo

* [jQuery UI](http://jqueryui.com/) has better code for `:focusable`/`:tabbable`. Investigate how to implement it.
* Investigate `contenteditable="true"`.
* Break out reusable key press functions from tests.

## License
Developed for PTS by Joel Purra <http://joelpurra.se/>

Copyright (c) 2011, 2012, The Swedish Post and Telecom Authority (PTS)
All rights reserved.

Released under the BSD license.
