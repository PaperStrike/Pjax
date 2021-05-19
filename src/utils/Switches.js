const Switches = {

  /**
   * Replace HTML contents by using innerHTML.
   * @param oldNode {Element}
   * @param newNode {Element}
   * @returns {Promise<void>}
   */
  async innerHTML(oldNode, newNode) {
    // eslint-disable-next-line no-param-reassign
    oldNode.innerHTML = newNode.innerHTML;
  },

  /**
   * Replace all text by using textContent.
   * @param oldNode {Node}
   * @param newNode {Node}
   * @returns {Promise<void>}
   */
  async textContent(oldNode, newNode) {
    // eslint-disable-next-line no-param-reassign
    oldNode.textContent = newNode.textContent;
  },

  /**
   * Replace readable text by using innerText.
   * @param oldEle {HTMLElement}
   * @param newEle {HTMLElement}
   * @returns {Promise<void>}
   */
  async innerText(oldEle, newEle) {
    // eslint-disable-next-line no-param-reassign
    oldEle.innerText = newEle.innerText;
  },

  /**
   * Rewrite all attributes.
   * @param oldEle {Element}
   * @param newEle {Element}
   * @returns {Promise<void>}
   */
  async attributes(oldEle, newEle) {
    let existingNames = oldEle.getAttributeNames();
    const targetNames = newEle.getAttributeNames();
    targetNames.forEach((target) => {
      oldEle.setAttribute(target, newEle.getAttribute(target));
      existingNames = existingNames.filter((existing) => existing !== target);
    });
    existingNames.forEach((existing) => {
      oldEle.removeAttribute(existing);
    });
  },

  /**
   * Replace the whole element by using replaceWith.
   * @param oldNode {ChildNode}
   * @param newNode {ChildNode}
   * @returns {Promise<void>}
   */
  async replaceWith(oldNode, newNode) {
    oldNode.replaceWith(newNode);
  },
};

Switches.default = Switches.replaceWith;

export default Switches;
