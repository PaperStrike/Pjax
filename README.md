# ES6+ Pjax

[MoOx/pjax](https://github.com/MoOx/pjax) ES6+ Edition.

[![Build Status](https://github.com/PaperStrike/Pjax/actions/workflows/test.yml/badge.svg)](https://github.com/PaperStrike/Pjax/actions/workflows/test.yml)

> Easily enable fast AJAX navigation ([Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) + [pushState](https://developer.mozilla.org/en-US/docs/Web/Guide/API/DOM/Manipulating_the_browser_history))

A maintained, modern, and smaller (~3 KB gzipped minified) version of Pjax.

Pjax aims to deliver _app-like_ browsing experiences. It doesn't rely on other libraries like jQuery.

🐿️ Jump to [Usage](#usage), [Options](#options), [Status](#status), [Q&A][q-a], or [Contributing Guide][contributing].

## Installation

### Choose a source

#### jsDelivr

Visit [https://www.jsdelivr.com/package/npm/@sliphua/pjax](https://www.jsdelivr.com/package/npm/@sliphua/pjax).

#### npm

Install package [@sliphua/pjax](https://www.npmjs.com/package/@sliphua/pjax):

```shell
npm install @sliphua/pjax
```

#### Git

Clone this repo and install:

```shell
git clone https://github.com/PaperStrike/Pjax.git
cd Pjax
npm install
```

### Pick a script in `dist` folder

#### `pjax.js` or `pjax.min.js`

To declare Pjax as a global variable, link one of them in a separate `<script>` tag as:

```html
<script src="./dist/pjax.js"></script>
```

#### `pjax.esm.js` or `pjax.esm.min.js`

To use Pjax as an ECMAScript module, import the default value from one of them as:

```js
import Pjax from './dist/pjax.esm';
```

Each script file has a related `.map` file, known as the [source map](https://developer.mozilla.org/en-US/docs/Tools/Debugger/How_to/Use_a_source_map), for debugging. Browsers won't fetch them without DevTools opened, so it won't affect your users' experiences. For more information, click the link to find out.

---

## What Pjax Does

_In short, ONE fetch with a `pushState` call._

Pjax fetches the new content, switches parts of your page, updates the URL, executes newly added scripts and scroll to the right position _without_ refreshing the whole thing.

## How Pjax Works

1. Listen to simple redirections.
2. Fetch the target page via `fetch`.
3. Render the DOM tree using [`DOMParser`](https://developer.mozilla.org/en-US/docs/Web/API/DOMParser).
4. Check if every defined selector selects the same amount of elements in current DOM and the new DOM.
    - If no, Pjax uses standard navigation.
    - If yes, Pjax switches the elements in index order.
5. Update current URL using `pushState`.
6. Execute all newly-added or targeted scripts in document order.
7. Scroll to the defined position.

## Overview

Just designate the elements that differs between navigations.
_Pjax handles all the rest things._

Consider the following page:

```html
<!DOCTYPE html>
<html lang="">
<head>
  <title>My Cool Blog</title>
  <meta name="description" content="Welcome to My Cool Blog">
  <link href="/styles.css" rel="stylesheet">
</head>

<body>
  <header class="the-header">
    <nav>
      <a href="/" class="is-active">Home</a>
      <a href="/about">About</a>
      <a href="/contact">Contact</a>
    </nav>
  </header>

  <section class="the-content">
    <h1>My Cool Blog</h1>
    <p>
      Thanks for stopping by!

      <a href="/about">Click Here to find out more about me.</a>
    </p>
  </section>

  <aside class="the-sidebar">
    <h3>Recent Posts</h3>
    <!-- sidebar content -->
  </aside>

  <footer class="the-footer">
    &copy; My Cool Blog
  </footer>

  <script src="onDomReady.js"></script>
</body>
</html>
```

We want Pjax to intercept the URL `/about`, and replace `.the-content` with the resulting content of the request.

Besides, we would like to replace the `<nav>` to show the active `/about` link, as well as update our page meta and the `<aside>` sidebar.

So all in all we want to update the page title and meta, header, content area, and sidebar, **without reloading styles or scripts**.

We can easily achieve this by telling Pjax to use such CSS selectors:

```js
const pjax = new Pjax({
  selectors: [
    'title',
    'meta[name=description]',
    '.the-header',
    '.the-content',
    '.the-sidebar',
  ],
});
```

Now, when someone in a Pjax-compatible browser clicks an internal link on the page, the content of each of the selectors will transform to the specific content pieces found in the next page.

_Magic! For real!_ **Nothing server-side!**

## Compatibility

Browser | Supported versions | Release date
:------ | :----------------: | -----------:
Chrome  | 66+                | Apr 17, 2018
Edge    | 79+                | Jan 15, 2020
Firefox | 60+                | May 9, 2018
Opera   | 53+                | May 10, 2018
Safari  | 12.2+              | Jul 22, 2019

## Usage

### `new Pjax([options])`

The most basic way to get started.

When instantiating `Pjax`, you can pass options into the constructor as an object:

```js
const pjax = new Pjax({
  // default value, listens on all links and forms
  defaultTrigger: true,
  selectors: [
    'title',
    '.the-header',
    '.the-content',
    '.the-sidebar',
  ],
});
```

This will enable Pjax on all links and forms, and designate the part to replace using CSS selectors `'title', '.the-header', '.the-content', '.the-sidebar'`.

In some cases, you might want to only target some specific elements or specific moments to apply Pjax behavior. In that case:

1. Set `defaultTrigger` to `false`.
2. Use `loadURL` method of the Pjax instance to let Pjax handle the navigation on your demand.

```js
// Set `defaultTrigger` to `false`.
const pjax = new Pjax({ defaultTrigger: false });

// Use `loadURL` on your demand.
document.addEventListener((event) => {
  const { target } = event;
  if (someCondition) {
    event.preventDefault();
    pjax.loadURL(target.href);
  }
});
```

### `loadURL(url, [overrideOptions])`

Calling this method aborts the last call (if unfinished) and navigates to the given URL in Pjax way.

Any error other than `AbortError` leads to a normal navigation (via `window.location.assign`). Note that `AbortError` happens on fetch timeout, too.

```js
const pjax = new Pjax();

// use case 1
pjax.loadURL('/your-url').catch(() => {});

// use case 2 (with options override)
pjax.loadURL('/your-url', { timeout: 200 }).catch(() => {});

// use case 3 (with further action)
pjax.loadURL('/your-url')
  .then(() => {
    onSuccess();
  })
  .catch(() => {
    onAbort();
  });
```

### `weakLoadURL(url, [overrideOptions])`

This method behaves almost the same as `loadURL`, except that it won't use normal navigation on errors — it throws regardless of the error's type.

Useful when you need to handle all the errors on your own.

```js
const pjax = new Pjax();

// use case
pjax.weakLoadURL('/your-url')
  .then(() => {
    onSuccess();
  })
  .catch((e) => {
    onError(e);
  });
```

### `switchDOM(url, [overrideOptions])`

This method accepts the URL string of the target document, set up the fetch timeout, and sends the request with Pjax headers. It also takes the responsibility of firing Pjax related events.

It returns a promise that resolves when all the following steps have done:

- Switch elements selected by `selectors` option.
- Call `pushState` to update the URL.
- Focus the first [`autofocus`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/autofocus) if previous focus has gone.
- Execute all newly-added or targeted scripts in document order, and wait for the blocking ones (e.g., inline scripts).
- Scroll to position given by `scrollTo` option.

### `reload()`

A helper shortcut for `window.location.reload`, a static member of Pjax.

```js
Pjax.reload();
```

## Options

### `defaultTrigger` (Boolean, default: `true`)

When set to `false`, disable the default Pjax trigger.

The default trigger alters these redirections:

- Activations of `<a>` and `<area>` that targets a link within the same origin.
- Submissions of `<form>` that *simply redirects* to a link within the same origin.

Technically, a submission does a *simple redirection* when its:

- Enctype matches `application/x-www-form-urlencoded`.
- Target browsing context matches the form's one.
- Method matches `get`.

### `selectors` (Array, default: `['title', '.pjax']`)

CSS selector list used to target contents to replace.

```js
const pjax = new Pjax({
  selectors: [
    'title',
    '.the-content',
  ],
});
```

If a query returns multiples items, it will just keep the index.

Every selector, in the current page and new page, must select the same amount of DOM elements. Otherwise, Pjax will fall back into normal page load.

### `switches` (Object, default: `{}`)

This contains callbacks used to switch old elements with new elements.

The object keys should match one of the defined selectors (from the `selectors` option).

Examples:

```js
const pjax = new Pjax({
  selectors: ['title', '.Navbar', '.pjax'],
  switches: {
    // default behavior
    'title': Pjax.switches.default,
    '.the-content': async (oldEl, newEl) => {
      // How you deal with the two nodes.
    },
    '.pjax': Pjax.switches.innerText,
  },
});
```

Callbacks may return a promise to make Pjax recognize when the switch has done. Newly added scripts execute and labeled scripts re-execute after all switches finishes.

### Existing Switch Callbacks

- `Pjax.switches.innerHTML` —
  Replace HTML contents by using [`Element.innerHTML`](https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML).
- `Pjax.switches.textContent` —
  Replace all text by using [`Node.textContent`](https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent).
- `Pjax.switches.innerText` —
  Replace readable text by using [`HTMLElement.innerText`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/innerText).
- `Pjax.switches.attributes` —
  Rewrite all attributes, leaving inner HTML untouched.
- `Pjax.switches.replaceWith` —
  The default behavior, replace elements by using [`ChildNode.replaceWith`](https://developer.mozilla.org/en-US/docs/Web/API/ChildNode/replaceWith).

### Creating a Switch Callback

Your callback function can do whatever you want, as long as you keep the amount of the elements selected by the `selectors` option remain the same.

In this example, the `current` class represents the only switching element, so that the switch elements' amount won't change. Before the returned promise resolves, Pjax will neither update the URL, execute the script elements nor scroll the page.

```js
const pjax = new Pjax({
  selectors: ['.sidebar.current'],
});

const customSwitch = (oldEle, newEle) => {
  oldEle.classList.remove('current');
  newEle.classList.add('current');
  oldEle.after(newEle);

  return new Promise((resolve) => {
    // Assume there's animations start right after inserting to DOM.
    newEle.addEventListener('animationend', () => {
      oldEle.remove();
      resolve();
    }, { once: true });
  });
};
```

**NOTE:** _Pjax waits for the switches in a navigation, but may abort the whole navigation when the next one happens (e.g., user triggering the “Back” button)._

### `scripts` (String, default: `'script[data-pjax]'`)

CSS selector used to target scripts to re-execute at page switches. If needing multiple specific selectors, separate them by a comma. Like:

```js
// Single selector
const pjax = new Pjax({
  scripts: 'script.pjax',
});
```

```js
// Multiple selectors
const pjax = new Pjax({
  scripts: 'script.pjax, script.analytics',
});
```

**NOTE:** _Pjax always executes scripts in newly loaded contents. You don't have to mark them here._

### `scrollTo` (Number | \[Number, Number\] | Boolean, default: `true`)

When set to a number, this represents the vertical value (in px from the top of the page) to scroll to after a page switch.

When set to an array of 2 numbers (\[x, y\]), this represents the value to scroll both horizontally and vertically.

Set this to `true` to make Pjax decide the scroll position. Pjax will try to act as the browsers' default behavior. For example, scroll the element into view when hash changing to its id, scroll to page left top when navigating to a new page without a valid hash.

Set this to `false` to disable all scrolling by Pjax.

**NOTE:** _This option does not affect the scroll restoration defined below._

### `scrollRestoration` (Boolean, default: `true`)

When set to `true`, Pjax will attempt to restore the scroll position when navigating backward or forward.

### `cacheMode` (RequestCache, default: `'default'`)

This contains the cache mode of Pjax requests, which shares the same available values with [`Request.cache`](https://developer.mozilla.org/en-US/docs/Web/API/Request/cache).

### `timeout` (Integer, default: `0`)

The time in _milliseconds_ to abort the fetch requests. Set to `0` to disable.

## Status

Accessible by calling on the Pjax instance.

### `location` ([URL][mdn-url-api], default: `new URL(window.location.href)`)

The last location recognized by Pjax.

### `abortController` ([AbortController][mdn-abortcontroller-api] | null, default: `null`)

The abort controller that can abort the page navigation handling by Pjax.

For example, to abort Pjax on certain events:

```js
const pjax = new Pjax();

document.addEventListener('yourCustomEventType', () => {
  pjax.abortController?.abort();
});
```

## Events

When calling Pjax to load a URL that within the same origin while with different path or search string, Pjax fires a number of events.

All events fire from the _document_, not the clicked anchor nor the caller function. You can get more detail of the event via `event.detail`.

An ordered list showing the types of these events, and the moment they happen:

1. `pjax:send` event when Pjax sends the request.
2. Pjax switches the DOM. See `switchDOM` method for details.
3. `pjax:error` event if any error happens to step 2.
4. `pjax:complete` event when step 2 finishes.
5. `pjax:success` event if step 2 finishes without any error.

If you use a loading indicator (e.g. [topbar](https://buunguyen.github.io/topbar/)), a pair of `send` and `complete` events may suit you well.

```js
document.addEventListener('pjax:send', topbar.show);
document.addEventListener('pjax:complete', topbar.hide);
```

## HTTP Headers

Pjax uses several custom headers when it sends HTTP requests. If the requests goes to your server, you can use those headers for some meta information about the response.

- `X-Requested-With: Fetch`
- `X-PJAX: true`
- `X-PJAX-Selectors` —
    A serialized JSON array of selectors, taken from `options.selectors`. You can use this to send back only the elements that Pjax will use to switch, instead of sending the whole page. Note that you may need to deserialize this on the server (Such as by using `JSON.parse`)

## DOM Ready State

Most of the time, you will have code related to the current DOM that you only execute when the DOM became ready.

Since Pjax doesn't trigger the standard DOM ready events, you'll need to add code to re-trigger the DOM ready code. Here's a simple example:

```js
function whenDOMReady() {
  // do your stuff
}

document.addEventListener('DOMContentLoaded', whenDOMReady);

const pjax = new Pjax();

document.addEventListener('pjax:success', whenDOMReady);
```

**NOTE:** _Don't instantiate Pjax in the `whenDOMReady` function._

## [Q&A][q-a]

## [CONTRIBUTING][contributing]

## [CHANGELOG](CHANGELOG.md)

## [LICENSE](LICENSE)

[mdn-document-api]: https://developer.mozilla.org/en-US/docs/Web/API/Document
[mdn-url-api]: https://developer.mozilla.org/en-US/docs/Web/API/URL
[mdn-abortcontroller-api]: https://developer.mozilla.org/en-US/docs/Web/API/AbortController

[q-a]: https://github.com/PaperStrike/Pjax/discussions/categories/q-a
[contributing]: https://github.com/PaperStrike/Pjax/blob/main/.github/CONTRIBUTING.md
