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
   */
  onAnchorOpen(event) {
    const { target } = event;

    if (event.defaultPrevented) return;

    if (event instanceof MouseEvent || event instanceof KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    }

    // External.
    // loadURL checks external but without browsers' attribute related support.
    if (target.origin !== window.location.origin) return;

    event.preventDefault();

    this.pjax.loadURL(event.target.href).catch(() => {});
  }

  register() {
    document.addEventListener('click', (event) => {
      if (!(event.target instanceof HTMLAnchorElement)) return;
      this.onAnchorOpen(event);
    });
    document.addEventListener('keyup', (event) => {
      if (!(event.target instanceof HTMLAnchorElement)) return;
      if (event.key !== 'Enter') return;
      this.onAnchorOpen(event);
    });
  }
}
