<div align="end"><sub>
  ENGLISH,
  <a title="Simplified Chinese" href="README.zh-Hans.md">简体中文</a>
</sub></div>

# ES6+ Pjax

[![Build Status](https://github.com/PaperStrike/Pjax/actions/workflows/test.yml/badge.svg)](https://github.com/PaperStrike/Pjax/actions/workflows/test.yml)
[![npm Package](https://img.shields.io/npm/v/@sliphua/pjax?logo=npm)](https://www.npmjs.com/package/@sliphua/pjax "@sliphua/pjax")
[![Compressed Minified Size](https://img.badgesize.io/https:/cdn.jsdelivr.net/npm/@sliphua/pjax@latest/dist/pjax.esm.min.js?compression=brotli&label=minzipped&color=ff69b4)](#pick-a-script-in-dist-folder "dist/pjax.esm.min.js, Brotli compressed")

Easily enable fast AJAX navigation ([Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) + [pushState](https://developer.mozilla.org/en-US/docs/Web/API/History_API/Working_with_the_History_API)).

Pjax aims to deliver _app-like_ browsing experiences. No more full page reloads, no more multiple HTTP requests. It does not rely on other libraries, like jQuery or similar. Written in pure TS, transpiled by [Babel](https://babel.dev/) and [Rollup](https://rollupjs.org/).

A maintained, modern, and smaller version of [MoOx/pjax](https://github.com/MoOx/pjax).

---

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

Each script file has a related `.map` file, known as the [source map](https://developer.mozilla.org/en-US/docs/Tools/Debugger/How_to/Use_a_source_map), for debugging. Browsers won't fetch them without DevTools opened, so it won't affect your users' experiences. For more information, click the link to find out.

#### To declare globally

Link to `pjax.js` or `pjax.min.js` in a separate `<script>` tag as:

```html
<script src="./dist/pjax.js"></script>
```

#### To import as ES module

Import the default value from `pjax.esm.js` or `pjax.esm.min.js` as:

```js
import Pjax from './dist/pjax.esm.js';
```

## What Pjax Does

_In short, ONE fetch with a `pushState` call._

Pjax fetches the new content, updates the URL, switches parts of your page, executes newly added scripts and scroll to the right position _without_ refreshing the whole thing.

## How Pjax Works

1. Listen to simple redirections.
2. Fetch the target page via `fetch`.
3. Update current URL using `pushState`.
4. Render the DOM tree using [`DOMParser`](https://developer.mozilla.org/en-US/docs/Web/API/DOMParser).
5. Check if defined selectors select the same amount of elements in current DOM and the new DOM.
    - If no, Pjax uses standard navigation.
    - If yes, Pjax switches the elements in index order.
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
<header class="header">
  <nav>
    <a href="/" class="is-active">Home</a>
    <a href="/about">About</a>
    <a href="/contact">Contact</a>
  </nav>
</header>

<section class="content">
  <h1>My Cool Blog</h1>
  <p>
    Thanks for stopping by!

    <a href="/about">Click Here to find out more about me.</a>
  </p>
</section>

<aside class="sidebar">
  <h3>Recent Posts</h3>
  <!-- sidebar content -->
</aside>

<footer class="footer">
  &copy; My Cool Blog
</footer>

<script src="onDomReady.js"></script>
</body>
</html>
```

We want Pjax to intercept the URL `/about`, and replace `.content` with the resulting content of the request.

Besides, we would like to replace the `<nav>` to show the active `/about` link, as well as update our page meta and the `<aside>` sidebar.

So all in all we want to update the page title and meta, header, content area, and sidebar, **without reloading styles or scripts**.

We can easily achieve this by telling Pjax to use such CSS selectors:

```js
const pjax = new Pjax({
  selectors: [
    'title',
    'meta[name=description]',
    '.header',
    '.content',
    '.sidebar',
  ],
});
```

Now, when someone in a compatible browser clicks a link, the content selected above will switch to the specific content pieces found in the next page.

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

Method | Parameters | Return Value
------ | ---------- | ------------
[Pjax.constructor](#constructor) | options?: **Partial\<[Options](#options)\>** | **Pjax**
[load](#load) | requestInfo: **[RequestInfo][type-request-info]**, overrideOptions?: **Partial\<[Options](#options)\>** | **Promise\<void\>**
[weakLoad](#weakload) | requestInfo: **[RequestInfo][type-request-info]**, overrideOptions?: **Partial\<[Options](#options)\>** | **Promise\<void\>**
[switchDOM](#switchdom) | requestInfo: ****[RequestInfo][type-request-info]****, overrideOptions?: **Partial\<[Options](#options)\>** | **Promise\<void\>**
[preparePage](#preparepage) | switchesResult: **[SwitchesResult](#type-switchesresult) &#124; null**, overrideOptions?: **Partial\<[Options](#options)\>** | **Promise\<void\>**
[Pjax.reload](#reload) | / | **void**

[type-request-info]: https://fetch.spec.whatwg.org/#requestinfo

### constructor

The most basic way to get started.

When instantiating `Pjax`, you can pass options into the constructor as an object:

```js
const pjax = new Pjax({
  selectors: [
    'title',
    '.header',
    '.content',
    '.sidebar',
  ],
});
```

This will enable Pjax on all links and forms, and designate the part to replace using CSS selectors `'title'`, `'.header'`, `'.content'`, and `'.sidebar'`.

To disable the default Pjax trigger, set [`defaultTrigger`](#defaulttrigger) option to `false`.

### load

A call to this method aborts the current Pjax action (if any), and navigates to the target resource in Pjax way.

Any error other than `AbortError` leads to the normal navigation (by `window.location.assign`). Note that `AbortError` happens on fetch timeout, too.

```js
const pjax = new Pjax();

// use case 1
pjax.load('/your-url').catch(() => {});

// use case 2 (with options override)
pjax.load('/your-url', { timeout: 200 }).catch(() => {});

// use case 3 (with further action)
pjax.load('/your-url')
  .then(() => {
    onSuccess();
  })
  .catch(() => {
    onAbort();
  });

// use case 4 (with formed Request object)
const requestToSend = new Request('/your-url', {
  method: 'POST',
  body: 'example',
});
pjax.load(requestToSend);

// use case X, mix brakets above together
```

### weakLoad

This method behaves almost the same as [`load`](#load), except that it throws regardless of the error's type.

Useful when you need to handle all the errors on your own.

```js
const pjax = new Pjax();

// use case
pjax.weakLoad('/your-url')
  .then(() => {
    onSuccess();
  })
  .catch((e) => {
    onError(e);
  });
```

### switchDOM

This method accepts the URL string or the [Request][mdn-request-api] object to fetch. The response should contain the target document.

It returns a promise that resolves when all the following steps have done:

1. Call `pushState` to update the URL.
2. Transform elements selected by [`selectors`](#selectors) with switches defined in [`switches`](#switches).
3. Set _focusCleared_ to `true` if previous step has cleared the page focus, otherwise, `false`.
4. Call and await [`preparePage`](#preparepage) with a new [SwitchesResult](#type-switchesresult) that contains _focusCleared_.

### preparePage

This method accepts a nullable [SwitchesResult](#type-switchesresult).

It returns a promise that resolves when all the following steps have done:

1. Focus the first [`autofocus`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/autofocus) if `focusCleared` (in the given switches result) evaluates to `true`.
2. Execute all newly-loaded and targeted scripts in document order.
3. Wait until the blocking scripts got executed (e.g., inline scripts).
4. Scroll to the position given by [`scrollTo`](#scrollto) option.

#### Type SwitchesResult

```ts
interface SwitchesResult {
  focusCleared: boolean
}
```

### reload

A helper shortcut for `window.location.reload`, a static member of Pjax.

```js
Pjax.reload();
```

## Options

Name | Type | Default Value
---- | ---- | ----
[defaultTrigger](#defaulttrigger) | **boolean &#124; [TriggerOptions](#type-TriggerOptions)** | `true`
[selectors](#selectors) | **string\[\]** | `['title', '.pjax']`
[switches](#switches) | **Record<string, [Switch](#type-switch)>** | `{}`
[scripts](#scripts) | **string** | `script[data-pjax]`
[scrollTo](#scrollto) | **number &#124; \[number, number\] &#124; boolean** | `true`
[scrollRestoration](#scrollrestoration) | **boolean** | `true`
[cache](#cache) | **[RequestCache][mdn-request-cache-api]** | `'default'`
[timeout](#timeout) | **number** | `0`
[hooks](#hooks) | **[Hooks](#type-hooks)** | `{}`

### defaultTrigger

When set to `false` or an object with `enable: false`, disable the default Pjax trigger.

The default trigger alters these redirections:

- Activations of `<a>` and `<area>` that targets a link within the same origin.
- Submissions of `<form>` that redirects to a link within the same origin.

Disable when you only need Pjax in some specific moments. E.g.,

```js
// Set `defaultTrigger` to `false`.
const pjax = new Pjax({ defaultTrigger: false });

// Use `load` on your demand.
document.addEventListener('example', (event) => {
  if (!needsPjax) return;
  event.preventDefault();
  pjax.load('/bingo');
});
```

Use the `exclude` sub-option to disable the trigger only for specific elements:

```js
const pjax = new Pjax({
  defaultTrigger: {
    exclude: 'a[data-no-pjax]',
  },
});
```

#### Type TriggerOptions

```ts
interface TriggerOptions {
  enable?: boolean,
  exclude?: string,
}
```

### selectors

CSS selector list used to target contents to replace. E.g.,

```js
const pjax = new Pjax({
  selectors: [
    'title',
    '.content',
  ],
});
```

If a query returns multiples items, it will just keep the index.

Every selector, in the current page and new page, must select the same amount of DOM elements. Otherwise, Pjax will fall back into normal page load.

### switches

This contains callbacks (of type [Switch](#type-switch)) used to switch old elements with new elements.

The object keys should match one of the defined selectors (from the [`selectors`](#selectors) option).

Examples:

```js
const pjax = new Pjax({
  selectors: ['title', '.Navbar', '.pjax'],
  switches: {
    // default behavior
    'title': Pjax.switches.default,
    '.content': async (oldEle, newEle) => {
      // How you deal with the two elements.
    },
    '.pjax': Pjax.switches.innerText,
  },
});
```

#### Type Switch

```ts
type Switch<T extends Element = Element> = (oldEle: T, newEle: T) => (Promise<void> | void);
```

When it returns a promise, Pjax recognizes when the switch has done. Newly added scripts execute and labeled scripts re-execute after all switches finishes.

#### Existing Switch Callbacks

- `Pjax.switches.default` —
  The default behavior, same as `Pjax.switches.replaceWith`.
- `Pjax.switches.innerHTML` —
  Replace HTML contents by using [`Element.innerHTML`](https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML).
- `Pjax.switches.textContent` —
  Replace all text by using [`Node.textContent`](https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent).
- `Pjax.switches.innerText` —
  Replace readable text by using [`HTMLElement.innerText`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/innerText).
- `Pjax.switches.attributes` —
  Rewrite all attributes, leaving inner HTML untouched.
- `Pjax.switches.replaceWith` —
  Replace elements by using [`ChildNode.replaceWith`](https://developer.mozilla.org/en-US/docs/Web/API/ChildNode/replaceWith).

#### Creating a Switch Callback

Your callback function can do whatever you want. But remember to keep the amount of the elements selected by the [`selectors`](#selectors) option remain the same.

In the example below, `.current` class marks the only switching element, so that the switch elements' amount won't change. Before the returned promise resolves, Pjax will neither execute the script elements nor scroll the page.

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

**NOTE:** _Pjax waits for the switches, but moves on to the next navigation, and forgets the previous one, on matter whether finished or not. Workarounds that try to block user actions may not work as well as hoped, because the user can always use the "back" button, and Pjax always reacts to it._

### scripts

CSS selector used to target **extra** `<script>` to execute after a page switch. For multiple selectors, separate them by a comma. Use the empty string to target nothing. Like:

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

```js
// Only execute new scripts
const pjax = new Pjax({
  scripts: '',
});
```

**NOTE:** _Pjax always executes the newly added scripts in a page switch. You don't have to mark them here._

### scrollTo

When set to a number, this represents the vertical value (in px from the top of the page) to scroll to after a page switch.

When set to an array of 2 numbers (\[x, y\]), this contains the horizontal and vertical values to scroll to after a page switch.

Set this to `true` to make Pjax decide the scroll position. Pjax will try to act as the browsers' default behavior. For example, scroll the element into view when hash changing to its id, scroll to page left top when navigating to a new page without a valid hash.

Set this to `false` to disable all scrolling by Pjax.

**NOTE:** _This does not affect the scroll restoration defined below._

### scrollRestoration

When set to `true`, Pjax attempts to restore the page scroll status when navigating backward or forward.

### cache

This contains the cache mode of Pjax requests, which shares the same available values with [`Request.cache`][mdn-request-cache-api].

### timeout

The time in _milliseconds_ to abort the fetch requests. Set to `0` to disable.

### hooks

This option defines hooks (each of type [Hook](#type-hook)) for modifying the [_request_][mdn-request-api] sent, the [_response_][mdn-response-api] received, the [_document_][mdn-document-api] parsed and the [_switchResult_](#type-switchesresult) created in Pjax. An example for adding a custom header for Pjax requests:

```js
const pjax = new Pjax({
  hooks: {
    request: (request) => {
      request.headers.set('My-Custom-Header', 'ready');
    },
  },
});
```

#### Type Hook

A function that returns `undefined`, the hooked input, or a promise resolving to one of them.

```ts
type Hook<T> = (input: T) => T | void | Promise<T | void>;
```

#### Type Hooks

```ts
interface Hooks {
  request?: Hook<Request>;
  response?: Hook<Response>;
  document?: Hook<Document>;
  switchesResult?: Hook<SwitchesResult>;
}
```

## Status

Accessible by calling on the Pjax instance.

Name | Type | Default Value
---- | ---- | ----
[location](#location) | **[URL][mdn-url-api]** | `new URL(window.location.href)`
[abortController](#abortcontroller) | **[AbortController][mdn-abortcontroller-api] &#124; null** | `null`

### location

The last location recognized by Pjax.

### abortController

The abort controller that can abort the Pjax handling navigation. When Pjax handles nothing, `null`.

For example, to abort Pjax on certain events:

```js
const pjax = new Pjax();

document.addEventListener('example', () => {
  pjax.abortController?.abort();
});
```

## Events

When calling Pjax, Pjax may fire a number of events.

All events fire from the _document_, not the clicked anchor nor the caller function. You can get more detail of the event via `event.detail`.

An ordered list showing the types of these events, and the moment they happen:

1. `pjax:send` event when Pjax sends the request.
2. `pjax:receive` event when Pjax receives the response.
3. Pjax switches the DOM. See [`switchDOM`](#switchdom) method for details.
4. `pjax:error` event if any error happens to previous steps.
5. `pjax:complete` event when previous steps finish.
6. `pjax:success` event if previous steps finish without any error.

If you use a loading indicator (e.g. [topbar](https://buunguyen.github.io/topbar/)), a pair of `send` and `complete` events may suit you well.

```js
document.addEventListener('pjax:send', topbar.show);
document.addEventListener('pjax:complete', topbar.hide);
```

## HTTP Headers

Pjax uses several custom headers when it sends HTTP requests.

- `X-Requested-With: Fetch`
- `X-PJAX: true`
- `X-PJAX-Selectors` —
  A serialized JSON array of selectors, taken from [`selectors`](#selectors). You can use this to send back only the elements that Pjax will use to switch, instead of sending the whole page. Note that you may need to deserialize this on the server (Such as by using `JSON.parse`)

## DOM Ready State

Most of the time, you will have code related to the current DOM that you only execute when the DOM became ready.

Since Pjax doesn't trigger the standard DOM ready events, you'll need to add code to re-trigger the DOM ready code. For example:

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
[mdn-request-api]: https://developer.mozilla.org/en-US/docs/Web/API/Request
[mdn-request-cache-api]: https://developer.mozilla.org/en-US/docs/Web/API/Request/cache
[mdn-response-api]: https://developer.mozilla.org/en-US/docs/Web/API/Response
[mdn-url-api]: https://developer.mozilla.org/en-US/docs/Web/API/URL
[mdn-abortcontroller-api]: https://developer.mozilla.org/en-US/docs/Web/API/AbortController

[q-a]: https://github.com/PaperStrike/Pjax/discussions/categories/q-a
[contributing]: https://github.com/PaperStrike/Pjax/blob/main/.github/CONTRIBUTING.md
