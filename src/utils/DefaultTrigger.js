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
  }
}
