import type { Pjax } from '..';

/**
 * Here until
 * https://github.com/microsoft/TypeScript/issues/40811
 */
interface SubmitEvent extends Event {
  readonly submitter: HTMLElement | null;
  readonly target: HTMLFormElement;
}

type Link = HTMLAnchorElement | HTMLAreaElement;

const submitDefaultAttrs = {
  enctype: 'application/x-www-form-urlencoded',
  target: '_self',
  method: 'get',
};

/**
 * Falsy or matching.
 */
const matchesDefault = (value: unknown, defaultValue: unknown) => !value || value === defaultValue;

export default class DefaultTrigger {
  pjax: Pjax;

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

    if (!matchesDefault(link.target, '_self')) return;

    // External.
    // loadURL checks external while having no browsers' attribute related support.
    if (link.origin !== window.location.origin) return;

    event.preventDefault();

    this.pjax.loadURL(link.href).catch(() => {});
  }

  onFormSubmit(event: SubmitEvent): void {
    if (event.defaultPrevented) return;

    const { target: form, submitter } = event;
    if (!(form instanceof HTMLFormElement)) return;

    /**
     * Parse submission related content attributes.
     * https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#form-submission-attributes
     */
    const submitterButton = submitter === form ? null : submitter;
    const getSubmitAttr = (name: 'action' | 'enctype' | 'method' | 'target') => {
      if (submitterButton) {
        const overrideName = `form${name}`;
        if (submitterButton.hasAttribute(overrideName)) {
          return submitterButton.getAttribute(overrideName);
        }
      }
      return form.getAttribute(name);
    };

    // Handle simple URL redirect only.
    if (!(Object.entries(submitDefaultAttrs) as Array<[keyof typeof submitDefaultAttrs, string]>)
      .every(([attributeName, defaultValue]) => matchesDefault(
        getSubmitAttr(attributeName),
        defaultValue,
      ))
    ) return;

    const url = new URL(getSubmitAttr('action') || '', document.URL);

    // External.
    // loadURL checks external while having no browsers' attribute related support.
    if (url.origin !== window.location.origin) return;

    event.preventDefault();

    /**
     * For files, use their names.
     * https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#converting-an-entry-list-to-a-list-of-name-value-pairs
     */
    const convertedEntries = Array.from(
      new FormData(form),
      ([key, value]) => (
        [key, value instanceof File ? value.name : value]
      ),
    );
    url.search = new URLSearchParams(convertedEntries).toString();

    this.pjax.loadURL(url.href).catch(() => {});
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
        /**
         * A as until
         * https://github.com/microsoft/TypeScript/issues/40811
         */
        this.onFormSubmit(event as SubmitEvent);
      });
    }
  }
}
