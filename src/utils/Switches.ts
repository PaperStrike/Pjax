import type Pjax from '..';

/**
 * Replace HTML contents by using innerHTML.
 */
const innerHTML: Pjax.Switch = (oldNode: Element, newNode: Element) => {
  // eslint-disable-next-line no-param-reassign
  oldNode.innerHTML = newNode.innerHTML;
};

/**
 * Replace all text by using textContent.
 */
const textContent: Pjax.Switch = (oldNode: Node, newNode: Node) => {
  // eslint-disable-next-line no-param-reassign
  oldNode.textContent = newNode.textContent;
};

/**
 * Replace readable text by using innerText.
 */
const innerText: Pjax.Switch = (oldEle: HTMLElement, newEle: HTMLElement) => {
  // eslint-disable-next-line no-param-reassign
  oldEle.innerText = newEle.innerText;
};

/**
 * Rewrite all attributes.
 */
const attributes: Pjax.Switch = (oldEle: Element, newEle: Element) => {
  let existingNames = oldEle.getAttributeNames();
  const targetNames = newEle.getAttributeNames();
  targetNames.forEach((target) => {
    oldEle.setAttribute(target, newEle.getAttribute(target));
    existingNames = existingNames.filter((existing) => existing !== target);
  });
  existingNames.forEach((existing) => {
    oldEle.removeAttribute(existing);
  });
};

/**
 * Replace the whole element by using replaceWith.
 */
const replaceWith: Pjax.Switch = (oldNode: ChildNode, newNode: ChildNode) => {
  oldNode.replaceWith(newNode);
};

const Switches = {
  default: replaceWith,
  innerHTML,
  textContent,
  innerText,
  attributes,
  replaceWith,
};

export default Switches;
