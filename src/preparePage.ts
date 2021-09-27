import type Pjax from '.';
import type { Options, SwitchesResult } from '.';

import executeScripts from './libs/executeScripts';

/**
 * Get the indicated part of the document.
 * Not using :target pseudo class here as it may not be updated by pushState.
 * @see [The indicated part of the document | HTML Standard]{@link https://html.spec.whatwg.org/multipage/browsing-the-web.html#the-indicated-part-of-the-document}
 */
const getIndicatedPart = () => {
  let target: Element | null = null;
  const hashId = decodeURIComponent(window.location.hash.slice(1));
  if (hashId) target = document.getElementById(hashId) || document.getElementsByName(hashId)[0];
  if (!target && (!hashId || hashId.toLowerCase() === 'top')) target = document.scrollingElement;
  return target;
};

/**
 * After page elements are updated.
 */
export default async function preparePage(
  this: Pjax,
  switchesResult: SwitchesResult | null,
  overrideOptions: Partial<Options> = {},
): Promise<void> {
  const options = { ...this.options, ...overrideOptions };

  // If page elements are switched.
  if (switchesResult) {
    // Focus the FIRST autofocus if the previous focus is cleared.
    // https://html.spec.whatwg.org/multipage/interaction.html#the-autofocus-attribute
    if (switchesResult.focusCleared) {
      const autofocus = document.querySelectorAll('[autofocus]')[0];
      if (autofocus instanceof HTMLElement || autofocus instanceof SVGElement) {
        autofocus.focus();
      }
    }

    // List newly added and labeled scripts.
    const scripts: HTMLScriptElement[] = [];
    let exclusions: string[] = [];
    if (options.scripts) {
      if (typeof options.scripts === 'object' && !Array.isArray(options.scripts)) {
        if ('forceLoad' in options.scripts) {
          document.querySelectorAll(options.scripts.forceLoad).forEach((element) => {
            if (element instanceof HTMLScriptElement) scripts.push(element);
          });
        }
        if ('exclude' in options.scripts) {
          exclusions = options.scripts.exclude;
        }
      }
      if (typeof options.scripts === 'string') {
        document.querySelectorAll(options.scripts).forEach((element) => {
          if (element instanceof HTMLScriptElement) scripts.push(element);
        });
      }
    }
    options.selectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((element) => {
        if (element instanceof HTMLScriptElement) {
          scripts.push(element);
        } else {
          element.querySelectorAll('script').forEach((script) => {
            if (scripts.includes(script)) return;
            if (exclusions.length > 1) {
              let matchedExclusion = false;
              exclusions.every((exclusionSelector) => {
                if (script.matches(exclusionSelector)) {
                  matchedExclusion = true;
                  return false;
                }
                return true;
              });
              if (matchedExclusion) return;
            }
            scripts.push(script);
          });
        }
      });
    });

    // Sort in document order.
    // https://stackoverflow.com/a/22613028
    scripts.sort((a, b) => (
      // Bitwise AND operator is required here.
      // eslint-disable-next-line no-bitwise
      a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_PRECEDING || -1
    ));

    // Execute.
    await executeScripts(scripts, { signal: this.abortController?.signal || null });
  }

  // Parse required scroll position.
  const { scrollTo } = options;

  // When scroll is allowed.
  if (scrollTo !== false) {
    // If switched, default to left top. Otherwise, default to no scroll.
    let parsedScrollTo: [number, number] | false = switchesResult ? [0, 0] : false;

    if (Array.isArray(scrollTo)) {
      parsedScrollTo = scrollTo;
    } else if (typeof scrollTo === 'number') {
      parsedScrollTo = [window.scrollX, scrollTo];
    } else {
      const target = getIndicatedPart();

      if (target) {
        target.scrollIntoView();
        parsedScrollTo = false;
      }
    }

    // Scroll.
    if (parsedScrollTo) window.scrollTo(parsedScrollTo[0], parsedScrollTo[1]);
  }
}
