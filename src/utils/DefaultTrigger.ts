import type Pjax from '..';
import Submission, { SubmitButton } from '../libs/Submission';

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

  /**
   * Check if the current trigger options apply to the element.
   */
  test(element: Element): boolean {
    const { defaultTrigger } = this.pjax.options;
    if (typeof defaultTrigger === 'boolean') return defaultTrigger;
    const { enable, exclude } = defaultTrigger;
    return enable !== false && (!exclude || !element.matches(exclude));
  }

  /**
   * Load a resource with element attribute support.
   * @see [Follow the hyperlink | HTML Standard]{@link https://html.spec.whatwg.org/multipage/links.html#following-hyperlinks-2}
   * @see [Plan to navigate | HTML Standard]{@link https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#plan-to-navigate}
   */
  load(
    resource: RequestInfo,
    subject: Link | HTMLFormElement,
  ): void {
    /**
     * The RequestInit to align the request to send by the element.
     */
    const requestInit: RequestInit = {};

    /**
     * Referrer policy that specified on the element.
     * Will cause a TypeError in the later Request constructing step if the attribute is invalid.
     * Not bypassing forms here as it is supposed to be supported in the future.
     * @see [Add referrerpolicy to &lt;form&gt; · whatwg/html]{@link https://github.com/whatwg/html/issues/4320}
     */
    const referrerPolicy = subject.getAttribute('referrerpolicy')?.toLowerCase();
    if (referrerPolicy !== undefined) requestInit.referrerPolicy = referrerPolicy as ReferrerPolicy;

    /**
     * Use no referrer if specified in the link types.
     * Not reading from `.relList` here as browsers haven't shipped it for forms yet.
     * @see [Add &lt;form rel&gt; initial compat data · mdn/browser-compat-data]{@link https://github.com/mdn/browser-compat-data/pull/9130}
     */
    if (subject.getAttribute('rel')?.split(/\s+/)
      .some((type) => type.toLowerCase() === 'noreferrer')) {
      requestInit.referrer = '';
    }

    this.pjax.load(new Request(resource, requestInit)).catch(() => {});
  }

  onLinkOpen(event: Event): void {
    if (event.defaultPrevented) return;

    const { target } = event;
    if (!(target instanceof Element)) return;

    const link: Link | null = target.closest('a[href], area[href]');
    if (!link) return;

    if (!this.test(link)) return;

    if (event instanceof MouseEvent || event instanceof KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    }

    if (getBrowsingContext(link.target) !== window) return;

    // External.
    if (link.origin !== window.location.origin) return;

    event.preventDefault();

    this.load(link.href, link);
  }

  onFormSubmit(event: SubmitEvent): void {
    if (event.defaultPrevented) return;

    const { target: form, submitter } = event;
    if (!(form instanceof HTMLFormElement)) return;

    if (!this.test(form)) return;

    const submission = new Submission(form, submitter as SubmitButton | null);

    if (getBrowsingContext(submission.getAttribute('target')) !== window) return;

    const requestInfo = submission.getRequestInfo();
    if (!requestInfo) return;

    const url = new URL(typeof requestInfo === 'string' ? requestInfo : requestInfo.url);

    // External.
    if (url.origin !== window.location.origin) return;

    event.preventDefault();

    this.load(requestInfo, form);
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
