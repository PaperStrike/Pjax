/**
 * Here until
 * https://github.com/microsoft/TypeScript/issues/40811
 * @typedef {Event} SubmitEvent
 * @property {HTMLElement|null} submitter
 * @property {HTMLFormElement} target
 */

const isFalsyOrDefault = (value, defaultValue) => !value || value === defaultValue;

/**
 * @typedef {HTMLAnchorElement|HTMLAreaElement} Link
 */

const getLink = (ele) => {
  let checkingEle = ele;
  const links = [...document.links];
  while (!links.includes(checkingEle)) {
    const parent = checkingEle.parentElement;
    if (!parent) return null;
    checkingEle = parent;
  }
  return checkingEle;
};

export default class DefaultTrigger {
  pjax;

  /**
   * @param {Pjax} pjax
   */
  constructor(pjax) {
    this.pjax = pjax;
  }

  /**
   * @param {Event} event
   * @param {Link} link
   */
  onLinkOpen(event, link) {
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

  /**
   * @param {SubmitEvent} event
   */
  onFormSubmit(event) {
    if (event.defaultPrevented) return;

    const { target: form } = event;
    if (!(form instanceof HTMLFormElement)) return;

    const {
      formEnctype = form.enctype,
      formTarget = form.target,
      formMethod = form.method,
    } = event.submitter || {};

    // Handle simple URL redirect only.
    if (!isFalsyOrDefault(formEnctype, 'application/x-www-form-urlencoded')
      || !isFalsyOrDefault(formTarget, '_self')
      || !isFalsyOrDefault(formMethod, 'get')) return;

    const url = new URL(
      event.submitter?.getAttribute('formaction') || form.action,
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
    if ('SubmitEvent' in window) {
      document.addEventListener('submit', this.onFormSubmit.bind(this));
    }
  }
}
