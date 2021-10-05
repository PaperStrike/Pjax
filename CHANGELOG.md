# 2.2.0

## 🚀 Enhancements

* Use regex to match script types ([#191](https://github.com/PaperStrike/Pjax/pull/191))
* 'exclude' option for triggers, 'receive' event ([#176](https://github.com/PaperStrike/Pjax/pull/176))
* Support hooks ([#177](https://github.com/PaperStrike/Pjax/pull/177))

## 🐛 Bug Fixes

* Use case-insensitive match to parse script type ([#192](https://github.com/PaperStrike/Pjax/pull/192))

# 2.1.0

## 🚀 Enhancements

* Conform with standard fragment navigation ([#171](https://github.com/PaperStrike/Pjax/pull/171))

# 2.0.3

* Small improvements to distributions

# 2.0.2

* Add Simplified Chinese README ([#113](https://github.com/PaperStrike/Pjax/pull/113))

## 🐛 Bug Fixes

* Fix broken cacheMode option and rename to cache ([#114](https://github.com/PaperStrike/Pjax/pull/114))

# 2.0.1

## 🚀 Enhancements

* Conform with standard History API ([#109](https://github.com/PaperStrike/Pjax/pull/109))

# 2.0.0

## 💥 Breaking Changes

* Support Request objects in methods ([#103](https://github.com/PaperStrike/Pjax/pull/103))

## 🚀 Enhancements

* Simplify history state storage ([#107](https://github.com/PaperStrike/Pjax/pull/107))
* Use declare fields to reduce bundle size ([#104](https://github.com/PaperStrike/Pjax/pull/104))
* Support Request objects in methods ([#103](https://github.com/PaperStrike/Pjax/pull/103))
* Eval directly selected scripts in page switch ([#99](https://github.com/PaperStrike/Pjax/pull/99))

# 1.1.0

## 🚀 Enhancements

* Adapt recommended TS rules ([#95](https://github.com/PaperStrike/Pjax/pull/95))

## 🐛 Bug Fixes

* Avoid write to session storage when init ([#89](https://github.com/PaperStrike/Pjax/pull/89))

# 1.0.1

* Small improvements to distributions

# 1.0.0

## 🚀 Enhancements

* Support target attr of links in default trigger ([#84](https://github.com/PaperStrike/Pjax/pull/84))
* Migrate to TypeScript ([#80](https://github.com/PaperStrike/Pjax/pull/80))

## 🐛 Bug Fixes

* Migrate to TypeScript ([#80](https://github.com/PaperStrike/Pjax/pull/80))

# 0.14.0

## 🚀 Enhancements

* Add form submit support in default trigger ([#70](https://github.com/PaperStrike/Pjax/pull/70))

# 0.13.0

## 🚀 Enhancements

* Use event listeners in Script lib ([#61](https://github.com/PaperStrike/Pjax/pull/61))
* Ignore asynchronous execution time ([#58](https://github.com/PaperStrike/Pjax/pull/58))

## 🐛 Bug Fixes

* Prepare page before complete and success events ([#57](https://github.com/PaperStrike/Pjax/pull/57))

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
