import switchNodes from '../switchNodes';

const pjax = {
  options: {
    selectors: ['p'],
    switches: {
      p: (oldNode, newNode) => {
        oldNode.replaceWith(newNode);
      },
    },
  },
};

test('switchNodes with same structures', async () => {
  document.body.innerHTML = '<p>Original para</p><span>Original span</span>';

  const sourceDoc = document.implementation.createHTMLDocument();
  sourceDoc.body.innerHTML = '<p>New para</p><span>New span</span>';

  await switchNodes.bind(pjax)(sourceDoc, document);

  expect(document.body.innerHTML).toBe('<p>New para</p><span>Original span</span>');
});

test('switchNodes with focus to clear', async () => {
  document.body.innerHTML = '<p><input>Original para</p><span>Original span</span>';
  document.body.querySelector('input').focus();

  const sourceDoc = document.implementation.createHTMLDocument();
  sourceDoc.body.innerHTML = '<p><input>New para</p><span>New span</span>';

  const { focusCleared } = await switchNodes.bind(pjax)(sourceDoc, document);
  expect(focusCleared).toBe(true);
  expect([document.body, null]).toContain(document.activeElement);
});

test('switchNodes with different structures', () => {
  document.body.innerHTML = '<p>Original para</p><span>Original span</span>';

  const sourceDoc = document.implementation.createHTMLDocument();
  sourceDoc.body.innerHTML = '<p>New para</p><p>More new para</p><span>New span</span>';

  return expect(switchNodes.bind(pjax)(sourceDoc, document)).rejects.toThrow(DOMException);
});
