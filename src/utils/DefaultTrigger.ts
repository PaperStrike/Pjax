import type Pjax from '..';
import Submission from '../libs/Submission';

type Link = HTMLAnchorElement | HTMLAreaElement;

/**
 * Get the target browsing context chosen by anchors or forms
 * @see [The rules for choosing a browsing context | HTML Standard]{@link https://html.spec.whatwg.org/multipage/browsers.html#the-rules-for-choosing-a-browsing-context-given-a-browsing-context-name}
 */
const getBrowsingContext = (target: string) => {
  if (target === window.name) return window;
  switch (target.toLowerCase()) {
    case '':
    case '_self':
      return window;
    case '_parent':
      return window.parent;
    case '_top':
      return window.top;
    default:
      return undefined;
  }
};

export default class DefaultTrigger {
  declare pjax: Pjax;

  constructor(pjax: Pjax) {
    this.pjax = pjax;
  }

  onLinkOpen(event: Event): void {
    if (event.defaultPrevented) return;

    const { target } = event;
    if (!(target instanceof Element)) return;

    const link: Link | null = target.closest('a[href], area[href]');
    if (!link) return;

    if (event instanceof MouseEvent || event instanceof KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    }

    if (getBrowsingContext(link.target) !== window) return;

    // External.
    if (link.origin !== window.location.origin) return;

    // Check if excluded
    let matchedExclusion = false;
    this.pjax.options.excludedTriggers.every((selector) => {
      if (link.matches(selector)) {
        matchedExclusion = true;
        return false;
      }
      return true;
    });
    if (matchedExclusion) return;

    event.preventDefault();

    this.pjax.load(link.href).catch(() => {
    });
  }

  onFormSubmit(event: SubmitEvent): void {
    if (event.defaultPrevented) return;

    const { target: form, submitter } = event;
    if (!(form instanceof HTMLFormElement)) return;

    const submission = new Submission(form, submitter);

    if (getBrowsingContext(submission.getAttribute('target')) !== window) return;

    const requestInfo = submission.getRequestInfo();
    if (!requestInfo) return;

    const url = new URL(typeof requestInfo === 'string' ? requestInfo : requestInfo.url);

    // External.
    if (url.origin !== window.location.origin) return;

    event.preventDefault();
    this.pjax.load(requestInfo).catch(() => {});
  }

  register(): void {
    document.addEventListener('click', (event) => {
      this.onLinkOpen(event);
    });
    document.addEventListener('keyup', (event) => {
      if (event.key !== 'Enter') return;
      this.onLinkOpen(event);
    });

    // Lacking browser compatibility and small polyfill. - August 2, 2021
    if ('SubmitEvent' in window) {
      document.addEventListener('submit', (event) => {
        this.onFormSubmit(event);
      });
    }
  }
}
