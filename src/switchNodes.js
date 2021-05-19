/**
 * @callback Pjax.Switch
 * @param {Node} oldNode
 * @param {Node} newNode
 * @return {Promise<*>|void}
 */

/**
 * @typedef {Object} SwitchResult
 * @property {boolean} focusCleared
 * @property {Array<Promise<*>>} outcomes
 */

/**
 * @this {Pjax}
 * @param {Document} sourceDocument
 * @param {Partial<Pjax.options>} overrideOptions
 * @return {Promise<SwitchResult>}
 */
export default async function switchNodes(sourceDocument, overrideOptions = {}) {
  const options = { ...this.options, ...overrideOptions };

  let focusCleared = false;
  const switchesList = [];

  options.selectors.forEach((selector) => {
    const sourceNodeList = sourceDocument.querySelectorAll(selector);
    const targetNodeList = document.querySelectorAll(selector);

    // Throw when the structure is not match.
    if (sourceNodeList.length !== targetNodeList.length) {
      throw new DOMException(
        `Selector '${selector}' does not select the same amount of nodes`,
        'IndexSizeError',
      );
    }

    // Start switching for each match.
    targetNodeList.forEach((targetNode, index) => {
      // Clear out focused controls before switching.
      if (!focusCleared && document.activeElement && targetNode.contains(document.activeElement)) {
        document.activeElement.blur();
        focusCleared = true;
      }

      // Argument defined switch is prior to default switch.
      const targetSwitch = options.switches[selector] || this.constructor.switches.default;

      // Start switching. Package to promise. Ignore results.
      const switchPromise = Promise.resolve()
        .then(() => targetSwitch(targetNode, sourceNodeList[index]))
        .then(() => {
          // Trigger after each switch.
          window.dispatchEvent(new Event('resize'));
          window.dispatchEvent(new Event('scroll'));
        })
        .catch(() => {});
      switchesList.push(switchPromise);
    });
  });

  const outcomes = await Promise.all(switchesList);

  return {
    focusCleared,
    outcomes,
  };
}
