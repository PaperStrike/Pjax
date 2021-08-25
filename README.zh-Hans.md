<div align="end"><sub>
  <a title="英文" href="README.md">ENGLISH</a>,
  简体中文
</sub></div>

# ES6+ Pjax

[![CI 状态](https://github.com/PaperStrike/Pjax/actions/workflows/test.yml/badge.svg)](https://github.com/PaperStrike/Pjax/actions/workflows/test.yml)
[![npm 包](https://img.shields.io/npm/v/@sliphua/pjax?logo=npm)](https://www.npmjs.com/package/@sliphua/pjax "@sliphua/pjax")
[![最小压缩](https://img.badgesize.io/https:/cdn.jsdelivr.net/npm/@sliphua/pjax@latest/dist/pjax.esm.min.js?compression=brotli&label=minzipped&color=ff69b4)](#在-dist-文件夹里挑一个 "dist/pjax.esm.min.js, Brotli 压缩")

轻松丝滑 AJAX 切页体验 ([Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) + [pushState](https://developer.mozilla.org/en-US/docs/Web/API/History_API/Working_with_the_History_API)) 。

Pjax 致力于提供 原生 APP 一般 的冲浪效果。抛去整页刷新，减少网路请求。不需要 jQuery 等第三方库。以纯 TS 编写，由 [Babel](https://babel.dev/) 和 [Rollup](https://rollupjs.org/) 编译和打包。

基于 [MoOx/pjax](https://github.com/MoOx/pjax) 的全新版本。

---

🐿️ 跳转到 [用法](#用法), [选项](#选项), [状态](#状态), [Q&A][q-a], 或 [Contributing Guide][contributing]。

## 安装

### 选择来源

#### jsDelivr

进入 [https://www.jsdelivr.com/package/npm/@sliphua/pjax](https://www.jsdelivr.com/package/npm/@sliphua/pjax) 浏览。

#### npm

安装 [@sliphua/pjax](https://www.npmjs.com/package/@sliphua/pjax) 包：

```shell
npm install @sliphua/pjax
```

#### Git

克隆此仓库，然后安装：

```shell
git clone https://github.com/PaperStrike/Pjax.git
cd Pjax
npm install
```

### 在 `dist` 文件夹里挑一个

每个脚本都有一个对应的 `.map` 文件，作为 [Source Map](https://developer.mozilla.org/en-US/docs/Tools/Debugger/How_to/Use_a_source_map) ，用于找 BUG。浏览器不会在没开开发者工具的时候拉取它们，所以它们不会影响用户体验。更多信息，可点击链接了解。

#### 要作为全局变量

用一个 `<script>` 元素链接到 `pjax.js` 或 `pjax.min.js`，像这样：

```html
<script src="./dist/pjax.js"></script>
```

#### 要以 ES 模块导入

导入 `pjax.esm.js` 或 `pjax.esm.min.js` 的默认值，像这样：

```js
import Pjax from './dist/pjax.esm.js';
```

## Pjax 干啥

简单来说，一次 `fetch`，一次 `pushState`。

Pjax 获取新内容，更新 URL，更新页面元素，执行新内容中的脚本，然后滚动到正确的位置。避免整个页面的变动刷新。

## Pjax 如何工作

1. 侦听页面切换。
2. 使用 `fetch` 获取目标页面。
3. 使用 `pushState` 更新 URL。
4. 使用 [`DOMParser`](https://developer.mozilla.org/en-US/docs/Web/API/DOMParser) 解析目标页面 DOM 树。
5. 检查 [`selectors`](#selectors) 选项中的各选择器在当前 DOM 和目标 DOM 中选定元素的数量是否相等。
    - 不相等，Pjax 使用普通切页方式，`window.location.assign`。
    - 相等，Pjax 依序更新这些元素。
6. 按 DOM 次序依次执行 新载入的脚本 和 标记脚本（[`scripts`](#scripts)）。
7. 滚动到设计位置。

## 概览

挑出切页时的变化区域，让 Pjax 处理其他的事务。

比如对于下面这个页面，

```html
<!DOCTYPE html>
<html lang="">
<head>
  <title>我的博客真是太酷了</title>
  <meta name="description" content="来呀来呀">
  <link href="/styles.css" rel="stylesheet">
</head>

<body>
<header class="header">
  <nav>
    <a href="/" class="is-active">主页</a>
    <a href="/about">关于</a>
    <a href="/contact">联系</a>
  </nav>
</header>

<section class="content">
  <h1>我的博客真是太酷了</h1>
  <p>
    常来作客，欢迎欢迎！

    <a href="/about">点这里了解我</a>
  </p>
</section>

<aside class="sidebar">
  <h3>近期推文</h3>
  <!-- 侧边栏内容 -->
</aside>

<footer class="footer">
  &copy; 我的博客真是太酷了
</footer>

<script src="onDomReady.js"></script>
</body>
</html>
```

我们想让 Pjax 拦截 `/about` 的跳转，然后把 `.content` 变更为新内容。

另外，我们还想替换 `<nav>` 以突出显示 `/about`，以及更新页面 meta 描述和 `<aside>` 侧边栏。

总而言之我们想更新页面主标题、meta、header、内容区和侧边栏，**而不想重载样式表和脚本**。

我们可以通过使用下面这样的选择器来轻松实现：

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

现在，在兼容 Pjax 的浏览器里点击一个链接，上述元素就会更新使用目标链接 DOM 里的对应内容。

嗒哒！完成啦！**后端不用动！**

## 兼容性

浏览器 | 兼容版本 | 发布日期
:------ | :----------------: | -----------:
Chrome  | 66+                | Apr 17, 2018
Edge    | 79+                | Jan 15, 2020
Firefox | 60+                | May 9, 2018
Opera   | 53+                | May 10, 2018
Safari  | 12.2+              | Jul 22, 2019

## 用法

方法名 | 参数 | 返回类型
------ | ---------- | ------------
[Pjax.constructor](#constructor) | options?: **Partial\<[Options](#选项)\>** | **Pjax**
[load](#load) | requestInfo: **[RequestInfo][type-request-info]**, overrideOptions?: **Partial\<[Options](#选项)\>** | **Promise\<void\>**
[weakLoad](#weakload) | requestInfo: **[RequestInfo][type-request-info]**, overrideOptions?: **Partial\<[Options](#选项)\>** | **Promise\<void\>**
[switchDOM](#switchdom) | requestInfo: ****[RequestInfo][type-request-info]****, overrideOptions?: **Partial\<[Options](#选项)\>** | **Promise\<void\>**
[preparePage](#preparepage) | switchesResult: **[SwitchesResult](#type-switchesresult) &#124; null**, overrideOptions?: **Partial\<[Options](#选项)\>** | **Promise\<void\>**
[Pjax.reload](#reload) | / | **void**

[type-request-info]: https://fetch.spec.whatwg.org/#requestinfo

### constructor

最基础的构造函数。

实例化 `Pjax` 时，可以使用一个对象向构造函数传递配置：

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

这会在所有的链接和表单上启用 Pjax，并使用 `'title'`、`'.header'`、`'.content'`，和 `'.sidebar'` CSS 选择器选择切换元素。

要禁用默认 Pjax 触发器，将 [`defaultTrigger`](#defaulttrigger) 选项设为 `false`。

### load

调用此方法将中止当前 Pjax 操作，然后以 Pjax 方式切换到给定的资源。

过程中若出现中止错误 `AbortError` 之外的错误，Pjax 会转而使用普通切页方式 `window.location.assign`。注意 `AbortError` 也可能在超时 [`timeout`](#timeout) 时出现。

```js
const pjax = new Pjax();

// 用例 1
pjax.load('/your-url').catch(() => {});

// 用例 2 (覆写此次调用使用的选项)
pjax.load('/your-url', { timeout: 200 }).catch(() => {});

// 用例 3 (添加后续操作)
pjax.load('/your-url')
  .then(() => {
    onSuccess();
  })
  .catch(() => {
    onAbort();
  });

// 用例 4 (使用设定好的 Request 对象)
const requestToSend = new Request('/your-url', {
  method: 'POST',
  body: 'example',
});
pjax.load(requestToSend);

// 用例 X, 多个上述括号配合
```

### weakLoad

此方法行为和 [`load`](#load) 几乎一模一样，只是对于出现的任何错误都是直接抛出。

当需要自己处理各种错误时有用。

```js
const pjax = new Pjax();

// 用例
pjax.weakLoad('/your-url')
  .then(() => {
    onSuccess();
  })
  .catch((e) => {
    onError(e);
  });
```

### switchDOM

此方法接收需要请求的 URL 字符串或 [Request][mdn-request-api] 对象。所给定请求资源的响应需包含目标 DOM 树。

它返回一个在完成下述步骤后 resolve 的 promise：

1. 调用 `pushState` 更新页面 URL。
2. 结合 [`switches`](#switches) 选项中定义的切换函数切换 [`selectors`](#selectors) 选项中选择的元素。
3. 定义 _focusCleared_，如果上一步清除了页面焦点元素，定义为 `true`，反之为 `false`。
4. 以一个包含 _focusCleared_ 的新 [SwitchesResult](#type-switchesresult) 为参调用并等待 [`preparePage`](#preparepage)。

### preparePage

此方法接收一个可以为 `null` 的 [SwitchesResult](#type-switchesresult)。

返回一个在完成下述步骤后 resolve 的 promise：

1. 如果给定的 [SwitchesResult](#type-switchesresult) 中 _focusCleared_ 为 `true`，将页面里的第一个含有 [`autofocus`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/autofocus) 属性的元素设为页面焦点。
2. 按 DOM 次序依次执行 新载入的脚本 和 标记脚本（[`scripts`](#scripts)）。
3. 等待上述脚本中按规范会在页面初载时阻止解析器解析的脚本（例如，内联脚本、没有 `async` 和 `defer` 的普通外部脚本）的执行。
4. 滚动到 [`scrollTo`](#scrollto) 选项规定的位置。

#### Type SwitchesResult

```ts
interface SwitchesResult {
  focusCleared: boolean
}
```

### reload

一个 `window.location.reload` 的简单包装，Pjax 类的静态成员。

```js
Pjax.reload();
```

## 选项

名称 | 类型 | 默认值
---- | ---- | ----
[defaultTrigger](#defaulttrigger) | **boolean** | `true`
[selectors](#selectors) | **string\[\]** | `['title', '.pjax']`
[switches](#switches) | **Record<string, [Switch](#type-switch)>** | `{}`
[scripts](#scripts) | **string** | `script[data-pjax]`
[scrollTo](#scrollto) | **number &#124; \[number, number\] &#124; boolean** | `true`
[scrollRestoration](#scrollrestoration) | **boolean** | `true`
[cache](#cache) | **[RequestCache][mdn-request-cache-api]** | `'default'`
[timeout](#timeout) | **number** | `0`

### defaultTrigger

在设为 `false` 时，禁用默认 Pjax 触发器。

默认触发器拦截处理下列带来页面切换的事件：

- 指向同域链接的 `<a>` 或 `<area>` 元素的触发。
- 导向同域链接的表单提交。

当页面只在某些特定时刻需要 Pjax 时，就禁用。例如，

```js
// 将 `defaultTrigger` 设为 `false`。
const pjax = new Pjax({ defaultTrigger: false });

// 在需要时调用 `load`。
document.addEventListener('example', (event) => {
  if (!needsPjax) return;
  event.preventDefault();
  pjax.load('/bingo');
});
```

### selectors

CSS 选择器列表，用于标注切页时变换的元素。例如，

```js
const pjax = new Pjax({
  selectors: [
    'title',
    '.content',
  ],
});
```

当一个选择器选择多个元素时，会按 DOM 次序依次替换。

每个选择器，在当前页面和新页面，选择的元素数量必须相同。否则 Pjax 会回落使用普通切页方式 `window.location.assign`。

### switches

此选项存放定义新旧元素处理方式的切换函数（[Switch](#type-switch) 类型）。

对象键名应匹配 [`selectors`](#selectors) 选项中定义的选择器。

举个例子:

```js
const pjax = new Pjax({
  selectors: ['title', '.Navbar', '.pjax'],
  switches: {
    // 默认切换函数
    'title': Pjax.switches.default,
    '.content': async (oldEle, newEle) => {
      // 两元素的处理方式
    },
    '.pjax': Pjax.switches.innerText,
  },
});
```

#### Type Switch

```ts
type Switch<T extends Element = Element> = (oldEle: T, newEle: T) => (Promise<void> | void);
```

返回 promise 可以让 Pjax 知道该切换函数何时结束。在所有切换函数结束后，Pjax 才会 执行新载入的、标记过的脚本这样子。

#### 原生切换函数

- `Pjax.switches.default` —
  默认切换函数，与 `Pjax.switches.replaceWith` 一致。
- `Pjax.switches.innerHTML` —
  使用 [`Element.innerHTML`](https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML) 切换元素内容。
- `Pjax.switches.textContent` —
  使用 [`Node.textContent`](https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent) 切换元素文本。
- `Pjax.switches.innerText` —
  使用 [`HTMLElement.innerText`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/innerText) 切换元素可见文本。
- `Pjax.switches.attributes` —
  只重写元素上的属性，不操作元素内容。
- `Pjax.switches.replaceWith` —
  使用 [`ChildNode.replaceWith`](https://developer.mozilla.org/en-US/docs/Web/API/ChildNode/replaceWith) 切换元素。

#### 自定义一个切换函数

在保证 [`selectors`](#selectors) 选项中各选择器在新旧页面中选定的元素数量一致的情况下，一个切换函数干啥都行。

在下面的例子中，`.current` 类标记唯一的切换中的元素，所以给定的 CSS 选择器选定的元素数量不会变。在该函数返回的 promise resolve 前，Pjax 不会执行脚本元素或滚动页面。

```js
const pjax = new Pjax({
  selectors: ['.sidebar.current'],
});

const customSwitch = (oldEle, newEle) => {
  oldEle.classList.remove('current');
  newEle.classList.add('current');
  oldEle.after(newEle);

  return new Promise((resolve) => {
    // 假设元素在插入 DOM 后就开始动画。
    newEle.addEventListener('animationend', () => {
      oldEle.remove();
      resolve();
    }, { once: true });
  });
};
```

**注意：** Pjax 在一次切页过程中会等待切换函数的完成，但会立即处理下一个切页事件，不论当前切页完成与否。尝试在切页过程中屏蔽用户操作的变通方案往往行不通，因为用户总能使用 “返回”、“前进” 之类的按钮。

### scripts

用来标记在切页过程后半段需要执行的**额外** `<script>` 的 CSS 选择器。若需要使用多个选择器，使用英文逗号（,）分隔。使用空字符串来不标记。像这样：

```js
// 单一选择器
const pjax = new Pjax({
  scripts: 'script.pjax',
});
```

```js
// 多个选择器
const pjax = new Pjax({
  scripts: 'script.pjax, script.analytics',
});
```

```js
// 切页时只执行新脚本
const pjax = new Pjax({
  scripts: '',
});
```

**注意：** 切页时 Pjax 总会执行刷新区域载入的新脚本。不需要在这里标记它们。

### scrollTo

若设为一个数字，此选项表示在切页后要滚动到的垂直位置。从页面顶部开始计，以 px 为单位。

若设为两个数字组成的数组 (\[x, y\])，此选项表示切页后要滚动到的水平和垂直位置。

设为 `true` 可让 Pjax 自行决定滚动位置。Pjax 会尽力表现得和浏览器默认行为一致。例如，在 hash 变化到某元素 ID 时滚动到该元素位置，在切换到一个 hash 值不为任一元素 ID 的页面时滚动到页面左上角。

设为 `false` 可让 Pjax 在切页时不进行任何滚动。

**注意：** 此选项不影响下面的滚动位置恢复行为。

### scrollRestoration

在设为 `true` 时，Pjax 会尝试在前进、后退时恢复上次的页面滚动位置状态。

### cache

此选项控制 Pjax 请求所使用的缓存模式，与 [`Request.cache`][mdn-request-cache-api] 的可取值及意义一致。

### timeout

为 fetch 请求附加一个中止时间，以毫秒为单位。设为 `0` 不附加。

## 状态

可在 Pjax 实例上读取。

名称 | 类型 | 默认值
---- | ---- | ----
[location](#location) | **[URL][mdn-url-api]** | `new URL(window.location.href)`
[abortController](#abortcontroller) | **[AbortController][mdn-abortcontroller-api] &#124; null** | `null`

### location

上一个 Pjax 认识的位置。

### abortController

可中止当前 Pjax 行为的中止控制器。若 Pjax 当前空闲，`null`。

例如，在某事件触发时中止 Pjax：

```js
const pjax = new Pjax();

document.addEventListener('example', () => {
  pjax.abortController?.abort();
});
```

## 事件

Pjax 在发送网络请求时，会触发一系列事件。

这些事件都触发于 _document_，与所点击的链接或调用函数无关。你可以通过 `event.detail` 得到事件详情。

下表依序展示了各事件的触发时机：

1. `pjax:send` 事件，在 Pjax 发送请求前触发。
2. Pjax 切换 DOM。[`switchDOM`](#switchdom) 方法有详细描述。
3. 若步骤二中有错误，`pjax:error` 事件。
4. `pjax:complete` 事件，步骤二完成时触发（不论是否有错误）。
5. 若步骤二中无错误，`pjax:success` 事件。

如果页面里有加载指示器 (如 [topbar](https://buunguyen.github.io/topbar/)) ，结合 `send` 和 `complete` 事件会是不错的选择。

```js
document.addEventListener('pjax:send', topbar.show);
document.addEventListener('pjax:complete', topbar.hide);
```

## HTTP 头

Pjax 在构建发送 HTTP 请求时会使用这些头数据：

- `X-Requested-With: Fetch`
- `X-PJAX: true`
- `X-PJAX-Selectors` —
  由 [`selectors`](#selectors) 选项序列化而来的字符串，后端可以据此仅传递变化的元素，而不需要传递整个页面。一般需要使用 `JSON.parse` 之类解析。

## DOM 准备状态

多数时候，页面中会有需要在 DOM 加载完成后执行的代码。

由于 Pjax 不会触发标准 DOM 加载事件，你可能需要添加一些重新触发 DOM 准备后执行函数 的代码。例如：

```js
function whenDOMReady() {
  // 干事儿
}

document.addEventListener('DOMContentLoaded', whenDOMReady);

const pjax = new Pjax();

document.addEventListener('pjax:success', whenDOMReady);
```

**注意：** 不要在 `whenDOMReady` 函数里实例化 Pjax。Pjax 往往只需要实例化一次。

## [Q&A][q-a]

## [CONTRIBUTING][contributing]

## [CHANGELOG](CHANGELOG.md)

## [LICENSE](LICENSE)

[mdn-document-api]: https://developer.mozilla.org/en-US/docs/Web/API/Document
[mdn-request-api]: https://developer.mozilla.org/en-US/docs/Web/API/Request
[mdn-request-cache-api]: https://developer.mozilla.org/en-US/docs/Web/API/Request/cache
[mdn-url-api]: https://developer.mozilla.org/en-US/docs/Web/API/URL
[mdn-abortcontroller-api]: https://developer.mozilla.org/en-US/docs/Web/API/AbortController

[q-a]: https://github.com/PaperStrike/Pjax/discussions/categories/q-a
[contributing]: https://github.com/PaperStrike/Pjax/blob/main/.github/CONTRIBUTING.md
