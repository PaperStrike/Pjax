import switchNodes from '../switchNodes';

class SimplePjax {
  static switches = {
    default: (oldNode, newNode) => {
      oldNode.replaceWith(newNode);
    },
  };

  options = {
    selectors: ['p'],
    switches: {},
  };

  status = {
    abortController: null,
  }

  switchNodes = switchNodes;
}

test('switchNodes with same structures', async () => {
  document.body.innerHTML = '<p>Original para</p><span>Original span</span>';

  const sourceDoc = document.implementation.createHTMLDocument();
  sourceDoc.body.innerHTML = '<p>New para</p><span>New span</span>';

  const pjax = new SimplePjax();

  await pjax.switchNodes(sourceDoc);
  expect(document.body.innerHTML).toBe('<p>New para</p><span>Original span</span>');
});

test('switchNodes with focus to clear', async () => {
  document.body.innerHTML = '<p><input>Original para</p><span>Original span</span>';
  document.body.querySelector('input').focus();

  const sourceDoc = document.implementation.createHTMLDocument();
  sourceDoc.body.innerHTML = '<p><input>New para</p><span>New span</span>';

  const pjax = new SimplePjax();

  const { focusCleared } = await pjax.switchNodes(sourceDoc);
  expect(focusCleared).toBe(true);
  expect([document.body, null]).toContain(document.activeElement);
});

test('switchNodes with different structures', async () => {
  document.body.innerHTML = '<p>Original para</p><span>Original span</span>';

  const sourceDoc = document.implementation.createHTMLDocument();
  sourceDoc.body.innerHTML = '<p>New para</p><p>More new para</p><span>New span</span>';

  const pjax = new SimplePjax();

  await expect(pjax.switchNodes(sourceDoc)).rejects.toThrow(DOMException);
});

test('switchNodes on abort', async () => {
  document.body.innerHTML = '<p>Original para</p>';

  const sourceDoc = document.implementation.createHTMLDocument();
  sourceDoc.body.innerHTML = '<p>New para</p>';

  const pjax = new SimplePjax();
  const abortController = new AbortController();
  pjax.status.abortController = abortController;

  // Return a never resolve promise.
  pjax.options.switches.p = (...args) => {
    SimplePjax.switches.default(...args);
    return Promise.race([]);
  };

  const abortPromise = pjax.switchNodes(sourceDoc);
  abortController.abort();
  await expect(abortPromise).rejects.toMatchObject({ name: 'AbortError' });
  expect(document.body.innerHTML).toBe('<p>New para</p>');
});

test('switchNodes with aborted signal', async () => {
  document.body.innerHTML = '<p>Original para</p>';

  const sourceDoc = document.implementation.createHTMLDocument();
  sourceDoc.body.innerHTML = '<p>New para</p>';

  const pjax = new SimplePjax();
  const abortController = new AbortController();
  pjax.status.abortController = abortController;

  abortController.abort();
  await expect(pjax.switchNodes(sourceDoc)).rejects.toMatchObject({ name: 'AbortError' });
  expect(document.body.innerHTML).toBe('<p>Original para</p>');
});
