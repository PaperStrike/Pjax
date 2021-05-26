# ES6+ Pjax

[MoOx/pjax](https://github.com/MoOx/pjax) ES6+ Edition.

[![Build Status](https://github.com/PaperStrike/Pjax/actions/workflows/test.yml/badge.svg)](https://github.com/PaperStrike/Pjax/actions/workflows/test.yml)

> Easily enable fast AJAX navigation ([Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) + [pushState](https://developer.mozilla.org/en-US/docs/Web/Guide/API/DOM/Manipulating_the_browser_history))

A maintained, modern, and smaller (~3 KB gzipped minified) version of Pjax.

Pjax aims to deliver _app-like_ browsing experiences. It doesn't rely on other libraries like jQuery.

## Installation

### Choose a source

#### jsDelivr

Visit [https://cdn.jsdelivr.net/npm/@sliphua/pjax/](https://cdn.jsdelivr.net/npm/@sliphua/pjax/).

#### npm

Install package [@sliphua/pjax](https://www.npmjs.com/package/@sliphua/pjax) as

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

### Pick a file in `dist` folder

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

_Under the hood, it simply does ONE fetch with a `pushState` call._

Pjax fetches the new content, switches parts of your page, updates the URL, executes newly added scripts and scroll to the right position _without_ refreshing the whole thing.

## How Pjax Works

1. Listens to every trigger of anchor elements.
2. Fetches the target page via `fetch`.
3. Renders the DOM tree using [`DOMParser`](https://developer.mozilla.org/en-US/docs/Web/API/DOMParser).
4. Checks if every defined selector selects the same amount of elements in current DOM and the new DOM.
    - If no, Pjax uses standard navigation.
    - If yes, Pjax switches the elements in index order.
5. Updates current URL using `pushState`.
6. Executes all newly-added and targeted scripts in document order.
7. Scroll to the defined position.

## Overview

_Pjax is fully automatic_. You don't need to change anything about your existing HTML,
you just need to designate the elements on your page that you want to update at page navigations.

Consider the following page.

```html
<!DOCTYPE html>
<html lang="">
<head>
  <!-- metas, title, styles, etc -->
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

  <script src="onDomReadystuff.js"></script>
  <script>
    // analytics
  </script>
</body>
</html>
```

We want Pjax to intercept the URL `/about`, and replace `.the-content` with the resulting content of the request.

It would also be nice if we could replace the `<nav>` to show that the `/about` link is active, as well as update our page meta and the `<aside>` sidebar.

So all in all we want to update the page title and meta, header, content area, and sidebar, **without reloading styles or scripts**.

We can easily do this by telling Pjax to listen on all `<a>` tags (which is the default) and use CSS selectors defined above (without forgetting minimal meta):

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

Now, when someone in a Pjax-compatible browser clicks an internal link on the page, the content of each of the selectors will be replaced with the specific content pieces found in the next page's content.

_Magic! For real!_ **There is no need to do anything server-side!**

## Compatibility

Browser | Supported versions | Release date
:------ | :----------------: | -----------:
Edge    | 79+                | Jan 15, 2020
Firefox | 60+                | May 9, 2018
Chrome  | 66+                | Apr 17, 2018
Opera   | 53+                | May 10, 2018
Safari  | 12.2+              | Jul 22, 2019

## Usage

### `new Pjax([options])`

Let's talk more about the most basic way to get started.

When instantiating `Pjax`, you can pass options into the constructor as an object:

```js
const pjax = new Pjax({
  // default value, listens on all <a>
  defaultTrigger: true,
  selectors: [
    'title',
    '.the-header',
    '.the-content',
    '.the-sidebar',
  ],
});
```

This will enable Pjax on all links, and designate the part to replace using CSS selectors `'title', '.the-header', '.the-content', '.the-sidebar'`.

In some cases, you might want to only target some specific elements or specific moments to apply Pjax behavior. In that case:

1. Set `defaultTrigger` to `false`. This will make Pjax not listen to `<a>` click and keyup events.
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

This method accepts the URL string of the target document, set up the fetch timeout, and sends the request with Pjax headers. It also takes the responsibility of firing Pjax related events and calling `pushState` to update the URL.

It returns a promise that resolves with an object of the following properties:

- `focusCleared` (Boolean): Indicate that if the focus element of the document has cleared.
- `outcomes` (Array): An array of each switch callback's return or fulfilled (for promise) value.

If you want to fetch and process the data on your own, override the implementation while keeping:

- [integrated](https://dom.spec.whatwg.org/#abortcontroller-api-integration) with `abortController` property of the Pjax instance.
- the resolve object structure.

Code below shows an extendable example:

```js
const pjax = new Pjax();

pjax.switchDOM = async function customSwitch(url) {
  const res = await fetch(url, {
    signal: this.abortController.signal,
  });
  // `Body.text` integrates with the fetch signal natively.
  const newDocument = new DOMParser().parseFromString(await res.text());
  document.body.replaceWith(newDocument.body);
  window.history.pushState({}, document.title, res.url);
  return {
    focusCleared: true,
    outcomes: [],
  };
};
```

### `reload()`

A helper shortcut for `window.location.reload`, a static member of Pjax. Used to force a page reload.

```js
Pjax.reload();
```

## Options

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

**NOTE:** _Pjax waits for the switches in a navigation, but may abort the whole navigation when the next one happens (e.g. user triggering the “Back” button)._

### `scripts` (String, default: `'script[data-pjax]'`)

CSS selector used to target scripts to re-execute at page switches. If needing multiple specific selectors, separate them by a comma. Like:

```js
// Single element
const pjax = new Pjax({
  elements: 'script.pjax',
});
```

```js
// Multiple elements
const pjax = new Pjax({
  elements: 'script.pjax, script.analytics',
});
```

**NOTE:** _Pjax always executes scripts in newly loaded contents. You don't have to mark them here._

### `scrollTo` (Number | \[Number, Number\] | Boolean, default: `true`)

When set to a number, this represents the vertical value (in px from the top of the page) to scroll to after a page switch.

When set to an array of 2 numbers (\[x, y\]), this represents the value to scroll both horizontally and vertically.

Set this to `true` to make Pjax decide the scroll position. Pjax will try to act as the browsers' default behavior, such as scroll the element into view when hash changing to its id, scroll to page left top when navigating to a new page without a valid hash.

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

The abort controller that can abort the page navigation handling by Pjax, or `null` if Pjax is free.

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
2. Pjax waits for and parses the response, switches elements, updates window URL to the responded one if it doesn't match the last location Pjax recognized.
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

Similarly, if you want to just update a specific part (which is a good idea), you can make the related code a function and call this function on `pjax:success` events.

```js
function whenContainerReady() {
  // do your container related stuff
}

whenContainerReady();

const pjax = new Pjax();

document.addEventListener('pjax:success', whenContainerReady);
```

## FAQ

### Q: Disqus doesn't work anymore, how can I fix that?

#### A: Below shows three methods you may choose from.

Let's start with a simple Disqus snippet.

#### Disqus snippet _before_ Pjax integration

```html
<script>
  const disqus_shortname = 'YOUR_SHORTNAME';
  const disqus_identifier = 'PAGE_ID';
  const disqus_url = 'PAGE_URL';
  const disqus_script = 'embed.js';

  (function(d,s) {
  s = d.createElement('script');s.async=1;s.src = '//' + disqus_shortname + '.disqus.com/'+disqus_script;
  (d.getElementsByTagName('head')[0]).appendChild(s);
  })(document)
</script>
```

#### Disqus snippet _after_ Pjax integration — method one

1. Wrap your Disqus snippet into a DOM element that you will add to the `selector` option (or just wrap it with `class=".pjax"`) and make sure to have at least an empty wrapper on each page (to avoid differences of DOM between pages).

2. Edit your Disqus snippet like below.

```html
<div class="pjax"><!-- needs to be here on every Pjax-ified page, even if empty -->
<!-- if (some condition) { // eventual server-side test to know whether or not you include this script -->
  <script>
    const disqus_shortname = 'YOUR_SHORTNAME';
    const disqus_identifier = 'PAGE_ID';
    const disqus_url = 'PAGE_URL';
    const disqus_script = 'embed.js';

    // here we will only load the disqus <script> if not already loaded
    if (!window.DISQUS) {
      (function(d,s) {
      s = d.createElement('script');s.async=1;s.src = '//' + disqus_shortname + '.disqus.com/'+disqus_script;
      (d.getElementsByTagName('head')[0]).appendChild(s);
      })(document)
    }
    // if disqus <script> is already loaded, we just reset disqus the right way
    // see https://help.disqus.com/developer/using-disqus-on-ajax-sites
    else {
      DISQUS.reset({
        reload: true,
        config: function () {
          this.page.identifier = disqus_identifier
          this.page.url = disqus_url
        }
      })
    }
  </script>
<!-- } -->
</div>
```

**NOTE:** _Pjax only handles `<script>` that lies inside the switching containers or targeted by the `scripts` option._

#### Disqus snippet _after_ Pjax integration — method two

If you dislike wrapping the Disqus snippet in the way of method one, you may:

1. Put your Disqus snippet into every page of your site and make it targeted by the `script` option (or just give it an empty `data-pjax` attribute). Use an earlier defined variable to enable Disqus on demand.

2. Edit your Disqus snippet like below.

```html
<script data-pjax>
  const disqus_shortname = 'YOUR_SHORTNAME';
  const disqus_identifier = 'PAGE_ID';
  const disqus_url = 'PAGE_URL';
  const disqus_script = 'embed.js';

  // Earlier defined variable indicating whether or not you run this part.
  if (someCondition) { 

    // Only load Disqus if haven't.
    if (!window.DISQUS) {
      (function(d,s) {
      s = d.createElement('script');s.async=1;s.src = '//' + disqus_shortname + '.disqus.com/'+disqus_script;
      (d.getElementsByTagName('head')[0]).appendChild(s);
      })(document)
    }
    // Disqus initialized, we just reset it the right way.
    // see https://help.disqus.com/developer/using-disqus-on-ajax-sites
    else {
      DISQUS.reset({
        reload: true,
        config: function () {
          this.page.identifier = disqus_identifier
          this.page.url = disqus_url
        }
      })
    }

  }
</script>
```

#### Disqus snippet _after_ Pjax integration — method three

1. Put your Disqus snippet into every page of your site and DON'T make it either wrapped by any elements added in the `selectors` option (unlike method one), or targeted by the `script` option (unlike method two). Use an earlier defined variable to enable Disqus on demand.

2. Edit your Disqus snippet like below.

```html
<script>
  const disqus_shortname = 'YOUR_SHORTNAME';
  const disqus_identifier = 'PAGE_ID';
  const disqus_url = 'PAGE_URL';
  const disqus_script = 'embed.js';

  const disqus_load = () => {
    // Earlier defined variable indicating whether or not you run this part.
    if (!someCondition) return;

    // Only load Disqus if haven't.
    if (!window.DISQUS) {
      (function(d,s) {
      s = d.createElement('script');s.async=1;s.src = '//' + disqus_shortname + '.disqus.com/'+disqus_script;
      (d.getElementsByTagName('head')[0]).appendChild(s);
      })(document)
    }
    // Disqus initialized, we just reset it the right way.
    // see https://help.disqus.com/developer/using-disqus-on-ajax-sites
    else {
      DISQUS.reset({
        reload: true,
        config: function () {
          this.page.identifier = disqus_identifier
          this.page.url = disqus_url
        }
      })
    }
  };
  
  disqus_load();
  document.addEventListener('pjax:success', disqus_load);
</script>
```

## CONTRIBUTING

- ⇄ Pull requests and ★ Stars are always welcome!
- For questions and feature requests, join our [Discussions](https://github.com/PaperStrike/Pjax/discussions).
- For bugs, check the existing issues and feel free to open one if none similar.
- Pull requests must pass all automatic checks.

## [CHANGELOG](CHANGELOG.md)

## [LICENSE](LICENSE)

[mdn-document-api]: https://developer.mozilla.org/en-US/docs/Web/API/Document
[mdn-url-api]: https://developer.mozilla.org/en-US/docs/Web/API/URL
[mdn-abortcontroller-api]: https://developer.mozilla.org/en-US/docs/Web/API/AbortController
