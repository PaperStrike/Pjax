import executeScripts from './libs/executeScripts';

/**
 * After page elements are updated.
 * @this {Pjax}
 * @param {?SwitchResult} switchResults
 * @param {Partial<Pjax.options>} overrideOptions
 * @return {Promise<void>}
 */
export default async function preparePage(switchResults = null, overrideOptions = {}) {
  const options = { ...this.options, ...overrideOptions };

  // Push history state if URL not matched.
  if (this.status.location.href !== window.location.href) {
    this.history.push({}, document.title, this.status.location.href);
  }

  // If page elements are switched.
  if (switchResults) {
    // Focus the FIRST autofocus if the previous focus is cleared.
    // https://html.spec.whatwg.org/multipage/interaction.html#the-autofocus-attribute
    if (switchResults.focusCleared) {
      const autofocusEl = document.querySelectorAll('[autofocus]')[0];
      if (autofocusEl && document.activeElement !== autofocusEl) {
        autofocusEl.focus();
      }
    }

    // List newly added and labeled scripts
    const scripts = [...document.querySelectorAll(options.scripts)];
    options.selectors.forEach((selector) => {
      document.body.querySelectorAll(selector).forEach((element) => {
        element.querySelectorAll('script').forEach((script) => {
          if (scripts.includes(script)) return;
          scripts.push(script);
        });
      });
    });

    // Sort by document position.
    // https://stackoverflow.com/a/22613028
    scripts.sort((a, b) => (
      // Bitwise AND operator is required here.
      // eslint-disable-next-line no-bitwise
      a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_PRECEDING || -1
    ));

    // Execute.
    await executeScripts(scripts);
  }

  // Parse required scroll position.
  const { scrollTo } = options;

  // When required to scroll.
  if (scrollTo !== false) {
    // If switched, default to left top. Otherwise, default to no scroll.
    let parsedScrollTo = switchResults ? [0, 0] : false;

    if (Array.isArray(scrollTo)) {
      parsedScrollTo = scrollTo;
    } else if (typeof scrollTo === 'number') {
      parsedScrollTo = [window.scrollX, scrollTo];
    } else {
      // Parse target.
      const hashId = decodeURIComponent(this.status.location.hash.slice(1));

      if (hashId) {
        const target = document.getElementById(hashId) || document.getElementsByName(hashId)[0];
        if (target) {
          parsedScrollTo = [window.scrollX, target.getBoundingClientRect().top + window.scrollY];
        }
      }
    }

    // Scroll.
    if (parsedScrollTo) window.scrollTo(parsedScrollTo[0], parsedScrollTo[1]);
  }
}
