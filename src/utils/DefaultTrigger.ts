import type Pjax from '..';

/**
 * Here until
 * https://github.com/microsoft/TypeScript/issues/40811
 */
interface SubmitEvent extends Event {
  readonly submitter: HTMLElement | null;
  readonly target: HTMLFormElement;
}

/**
 * Falsy or matching.
 */
const matchesDefault = (value: any, defaultValue: any) => !value || value === defaultValue;

type Link = HTMLAnchorElement | HTMLAreaElement;

const getLink = (target: EventTarget | null): Link | null => {
  if (!(target instanceof Node)) return null;
  let checkingNode = target;
  const links = [...document.links];
  while (!links.includes(target as any)) {
    const parent = checkingNode.parentElement;
    if (!parent) return null;
    checkingNode = parent;
  }
  return checkingNode as Link;
};

export default class DefaultTrigger {
  pjax: Pjax;

  constructor(pjax: Pjax) {
    this.pjax = pjax;
  }

  onLinkOpen(event: Event, link: Link) {
    if (event.defaultPrevented) return;

    if (event instanceof MouseEvent || event instanceof KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    }

    // External.
    // loadURL checks external but without browsers' attribute related support.
    if (link.origin !== window.location.origin) return;

    event.preventDefault();

    this.pjax.loadURL(link.href).catch(() => {});
  }

  onFormSubmit(event: SubmitEvent) {
    if (event.defaultPrevented) return;

    const { target: form, submitter } = event;
    if (!(form instanceof HTMLFormElement)) return;

    // TODO: Replace "as any".
    const {
      formEnctype = form.enctype,
      formTarget = form.target,
      formMethod = form.method,
    } = submitter as any || {};

    // Handle simple URL redirect only.
    if (!matchesDefault(formEnctype, 'application/x-www-form-urlencoded')
      || !matchesDefault(formTarget, '_self')
      || !matchesDefault(formMethod, 'get')) return;

    const url = new URL(
      submitter?.getAttribute('formaction') || form.action,
      document.URL,
    );

    // External.
    // loadURL checks external while having no browsers' attribute related support.
    if (url.origin !== window.location.origin) return;

    event.preventDefault();

    const convertedEntries = Array.from(
      new FormData(form),
      ([key, value]) => (
        [key, value instanceof File ? value.name : value]
      ),
    );
    url.search = new URLSearchParams(convertedEntries).toString();

    this.pjax.loadURL(url.href).catch(() => {});
  }

  register() {
    document.addEventListener('click', (event) => {
      const link = getLink(event.target);
      if (!link) return;
      this.onLinkOpen(event, link);
    });
    document.addEventListener('keyup', (event) => {
      if (event.key !== 'Enter') return;
      const link = getLink(event.target);
      if (!link) return;
      this.onLinkOpen(event, link);
    });

    // Lacking browser compatibility and small polyfill. - August 2, 2021
    if ('SubmitEvent' in window) {
      document.addEventListener('submit', this.onFormSubmit.bind(this));
    }
  }
}
