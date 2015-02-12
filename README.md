# [SkipOnTab](http://joelpurra.github.com/skipontab) javascript library

* A [jQuery](http://jquery.com/) plugin to
 * exempt selected fields from the forward tab order.
 * include excluded fields in the reverse tab order.

When using <kbd>tab</kbd> to navigate through a form, skipping some fields will reduce key presses for the normal use cases. Skipped fields can still be navigated to by keyboard; once skipped and focusing the next form field, use <kbd>shift</kbd>-<kbd>tab</kbd> to step back. Mouse or touch navigation is unaffected.

This library is most useful when the users are familiar with the form, and uses it regularly. Casual users may not feel as comfortable - then again, if they are already using the <kbd>tab</kbd> button, they might see it as an optimization.

## Get it

To include dependencies, make sure to get the submodules too.

```
git clone --recursive git://github.com/joelpurra/skipontab.git
```
## Demos
* [`example/demo.html`](http://joelpurra.github.com/skipontab/example/demo.html): Simple demo for playing around.
* [`example/skip-some-fields-in-order-form.html`](http://joelpurra.github.com/skipontab/example/skip-some-fields-in-order-form.html): Expanded demo with some thoughts on what fields to skip.

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

	<!-- Can be explicitly exluded from skipping -->
	<li><input type="checkbox" data-skip-on-tab="false" /> Important checkbox</li>
	<li><input type="checkbox" class="disable-skip-on-tab" /> Another important checkbox</li>
</ol>
```

### Javascript

```javascript
// Apply skip on tab to the selected elements/containers
$(selector).skipOnTab();

// Exclude skip on tab to the selected elements/containers
$(selector).skipOnTab(false);

// Equivalent static function
JoelPurra.SkipOnTab.skipOnTab($(selector));
JoelPurra.SkipOnTab.skipOnTab($(selector), false);
```

### Skippable elements
Elements that can be focused/tabbed include `<input>`, `<select>`, `<textarea>`, `<button>` and `<a href="...">` (the `href` attribute must exist and the tag must have some contents). These are also the elements that can be skipped.

Note that `<input type="hidden" />`, `<a>` (without `href` or empty contents), `disabled="disabled"` or `display: none;` elements cannot be focused.

### Static elements
Static skippable html elements can have, or be contained within elements that have, the attribute `data-skip-on-tab="true"` or the class `.skip-on-tab`. They are enabled automatically when the library has been loaded/executed.

### Dynamic elements
Dynamic elements are initialized to SkipOnTab in code after adding them to the DOM; `$("#my-optional-input").skipOnTab()`. This is not necessary if the added element already is contained within an element that is marked for skipping. You can also call `.skipOnTab()` on containers.

### Containers
When SkipOnTab is applied to html containers, like `<div>`, `<ul>` or `<fieldset>`, all skippable child elements are implicitly skipped. This applies to static html and subsequently added child elements.

### Disabling skipping
Skippable elements, or containers with skippable children, marked with class `.disable-skip-on-tab` or attribute `data-skip-on-tab="false"` are never skipped. Disabling can also be done dynamically on elements/containers with `$(selector).skipOnTab(false)`. If skipping is disabled for the element when it receives focus, or any of its elements parents, it will not be skipped. Disabling skipping takes precedence over enabling skipping.

## Original purpose
Developed to skip less used form fields in a web application for registering and administering letters. Examples of skipped fields are dropdowns with sensible defaults, the second address line fields in address forms and buttons for seldom used actions.

## [SkipOnTab versus tabindex](https://github.com/joelpurra/skipontab/wiki/SkipOnTab-versus-tabindex)
SkipOnTab does *not* rely on setting [`tabindex`](http://www.w3.org/TR/html4/interact/forms.html#h-17.11.1) on elements - it uses javascript events instead. Read more on the wiki page [SkipOnTab versus tabindex](https://github.com/joelpurra/skipontab/wiki/SkipOnTab-versus-tabindex).

## Dependencies
SkipOnTab's runtime dependencies are

* [jQuery](http://jquery.com/)
* [EmulateTab](https://github.com/joelpurra/emulatetab), one of SkipOnTab's sister projects.

## Browser compatibility
Should be about as compatible as jQuery is, since most functions depend on jQuery's normalization. You are engouraged to [run the SkipOnTab test suite](http://joelpurra.github.com/skipontab/test/) and then report any issues.

## Todo
* Break out reusable key press functions from tests.
* Investigate how usable `data-skip-on-tab="#id-of-next-element-in-the-order"` would be.

## See also
PlusAsTab's sister projects.

* [PlusAsTab](https://github.com/joelpurra/plusastab) - use the <kbd>+</kbd> key on the *keypad* as a <kbd>tab</kbd> key equivalent for faster numeric input.
* [EmulateTab](https://github.com/joelpurra/emulatetab) - the tab emulator used by both SkipOnTab and PlusAsTab.

## License
Developed for PTS by Joel Purra <http://joelpurra.se/>

Copyright (c) 2011, 2012, 2013, 2014, 2015, The Swedish Post and Telecom Authority (PTS)
All rights reserved.

Released under the BSD license.
