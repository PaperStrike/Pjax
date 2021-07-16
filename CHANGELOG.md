# 0.12.0

## 🚀 Enhancements

* Exclude es.array.sort polyfill ([#47](https://github.com/PaperStrike/Pjax/pull/47))

# 0.11.0

## 🚀 Enhancements

* Add area element support in default trigger ([#29](https://github.com/PaperStrike/Pjax/pull/29))

# 0.10.0

## 🚀 Enhancements

* Use standard scroll into view method ([#20](https://github.com/PaperStrike/Pjax/pull/20))

# 0.9.0

## 🐛 Bug Fixes

* Check parent anchor in default trigger ([#9](https://github.com/PaperStrike/Pjax/pull/9))

# 0.8.0 - 2021.5.26

## 💥 Breaking Changes

- Combine `sendRequest`, `parseResponse`, and `switchNodes` into `switchDOM`.
- Remove `request` and `response` properties from status.

## ⭐ Features

- Make the whole navigate process abortable.
- New ECMAScript Module distributions.
- New `weakLoadURL` method.

# 0.7.1 - 2021-05-19

## 💥 Breaking Changes

- Remove some browsers support.
- Bind event listener on `document` to listen on all `<a>` click and keyup events without the `refresh` method.
- Obsolete `<form>` support and `refresh` method.
- Rewrite prototypes' structure.
- Rewrite switch callbacks and valid structure.
- Obsolete `history` option.
- Remove `/example` folder and examples inside.

## ⭐ Features

- New `scripts` option to mark extra scripts to re-execute after page switches.

## 🐞 Bug Fixes

- Fix scripts re-execute order and separate to `executeScripts` library. ([next-theme/pjax#6](https://github.com/next-theme/pjax/pull/6))
- Fix scroll restoration by introducing `LazyHistory` library.
  
## 🛠️ Improvements

- ES6 refactor, following [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript).
- Use Fetch to send requests.
- Use [Babel](https://babeljs.io/) and [webpack](https://webpack.js.org/) to build.
- Use [Jest](https://jestjs.io/) and [Nock](https://github.com/nock/nock) to test.

# 0.5.0 - 2021-04-29

## 🐞 Bug Fixes

- Fix scroll restoration on reload. ([next-theme/pjax#4](https://github.com/next-theme/pjax/pull/4))

# <= 0.2.8 - 2019-03-09

See [MoOx/pjax/CHANGELOG.md](https://github.com/MoOx/pjax/blob/480334b18253c721ba648675e90261f948e2bca0/CHANGELOG.md).
