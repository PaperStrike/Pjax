const getAnchor = (ele) => {
  let checkingEle = ele;
  while (!(checkingEle instanceof HTMLAnchorElement)) {
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
   * @param {HTMLAnchorElement} anchor
   */
  onAnchorOpen(event, anchor) {
    if (event.defaultPrevented) return;

    if (event instanceof MouseEvent || event instanceof KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    }

    // External.
    // loadURL checks external but without browsers' attribute related support.
    if (anchor.origin !== window.location.origin) return;

    event.preventDefault();

    this.pjax.loadURL(anchor.href).catch(() => {});
  }

  register() {
    document.addEventListener('click', (event) => {
      const anchor = getAnchor(event.target);
      if (!anchor) return;
      this.onAnchorOpen(event, anchor);
    });
    document.addEventListener('keyup', (event) => {
      if (event.key !== 'Enter') return;
      const anchor = getAnchor(event.target);
      if (!anchor) return;
      this.onAnchorOpen(event, anchor);
    });
  }
}
