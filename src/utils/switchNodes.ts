import type Pjax from '..';

import Switches from './Switches';

export default async function switchNodes(sourceDocument: Document, {
  selectors,
  switches = null,
  signal = null,
}: {
  selectors: Pjax.Options['selectors'],
  switches?: Pjax.Options['switches']
  signal?: AbortSignal
}): Promise<Pjax.SwitchesResult> {
  if (signal?.aborted) throw new DOMException('Aborted switches', 'AbortError');

  let focusCleared = false;
  const switchesList = [];

  selectors.forEach((selector) => {
    const sourceNodeList = sourceDocument.querySelectorAll(selector);
    const targetNodeList = document.querySelectorAll(selector);

    // Throw when the structure is not match.
    if (sourceNodeList.length !== targetNodeList.length) {
      throw new DOMException(
        `Selector '${selector}' does not select the same amount of nodes`,
        'IndexSizeError',
      );
    }

    const { activeElement } = document;

    // Start switching for each match.
    targetNodeList.forEach((targetNode, index) => {
      // Clear out focused controls before switching.
      if (!focusCleared && activeElement && targetNode.contains(activeElement)) {
        if (activeElement instanceof HTMLElement || activeElement instanceof SVGElement) {
          activeElement.blur();
        }
        focusCleared = true;
      }

      // Argument defined switch is prior to default switch.
      const targetSwitch = switches?.[selector] || Switches.default;

      // Start switching. Package to promise. Ignore switch errors.
      const switchPromise = Promise.resolve()
        .then(() => targetSwitch(targetNode, sourceNodeList[index]))
        .catch(() => {});
      switchesList.push(switchPromise);
    });
  });

  // Reject as soon as possible on abort.
  await Promise.race([
    Promise.all(switchesList),
    new Promise((resolve, reject) => {
      signal?.addEventListener('abort', () => {
        reject(new DOMException('Aborted switches', 'AbortError'));
      });
    }),
  ]);

  return {
    focusCleared,
  };
}
