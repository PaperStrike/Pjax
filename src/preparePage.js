import executeScripts from './libs/executeScripts';

/**
 * After page elements are updated.
 * @this {Pjax}
 * @param {?SwitchResult} switchResult
 * @param {Partial<Pjax.options>} [overrideOptions]
 * @return {Promise<void>}
 */
export default async function preparePage(switchResult, overrideOptions = {}) {
  const options = { ...this.options, ...overrideOptions };

  // If page elements are switched.
  if (switchResult) {
    // Focus the FIRST autofocus if the previous focus is cleared.
    // https://html.spec.whatwg.org/multipage/interaction.html#the-autofocus-attribute
    if (switchResult.focusCleared) {
      document.querySelectorAll('[autofocus]')[0]?.focus();
    }

    // List newly added and labeled scripts
    const scripts = [...document.querySelectorAll(options.scripts)]
      .filter((node) => node instanceof HTMLScriptElement);
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
    await executeScripts(scripts, { signal: this.abortController?.signal });
  }

  // Parse required scroll position.
  const { scrollTo } = options;

  // When required to scroll.
  if (scrollTo !== false) {
    // If switched, default to left top. Otherwise, default to no scroll.
    let parsedScrollTo = switchResult ? [0, 0] : false;

    if (Array.isArray(scrollTo)) {
      parsedScrollTo = scrollTo;
    } else if (typeof scrollTo === 'number') {
      parsedScrollTo = [window.scrollX, scrollTo];
    } else {
      // Parse target.
      const hashId = decodeURIComponent(window.location.hash.slice(1));

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
