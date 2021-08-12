import switchNodes from '../switchNodes';

const commonOptions = {
  selectors: ['p'],
  switches: {},
};

test('switchNodes with same structures', async () => {
  document.body.innerHTML = '<p>Original para</p><span>Original span</span>';

  const sourceDoc = document.implementation.createHTMLDocument();
  sourceDoc.body.innerHTML = '<p>New para</p><span>New span</span>';

  await switchNodes(sourceDoc, commonOptions);
  expect(document.body.innerHTML).toBe('<p>New para</p><span>Original span</span>');
});

test('switchNodes with focus to clear', async () => {
  document.body.innerHTML = '<p><input>Original para</p><span>Original span</span>';
  (document.body.querySelector('input') as HTMLInputElement).focus();

  const sourceDoc = document.implementation.createHTMLDocument();
  sourceDoc.body.innerHTML = '<p><input>New para</p><span>New span</span>';

  const { focusCleared } = await switchNodes(sourceDoc, commonOptions);
  expect(focusCleared).toBe(true);
  expect([document.body, null]).toContain(document.activeElement);
});

test('switchNodes with different structures', async () => {
  document.body.innerHTML = '<p>Original para</p><span>Original span</span>';

  const sourceDoc = document.implementation.createHTMLDocument();
  sourceDoc.body.innerHTML = '<p>New para</p><p>More new para</p><span>New span</span>';

  await expect(switchNodes(sourceDoc, commonOptions)).rejects.toThrow(DOMException);
});

test('switchNodes on abort', async () => {
  document.body.innerHTML = '<p>Original para</p>';

  const sourceDoc = document.implementation.createHTMLDocument();
  sourceDoc.body.innerHTML = '<p>New para</p>';

  const abortController = new AbortController();

  const abortPromise = switchNodes(sourceDoc, {
    ...commonOptions,
    switches: {
      // Switch and return a never resolve promise.
      p: (oldNode, newNode) => {
        oldNode.replaceWith(newNode);
        return Promise.race([]);
      },
    },
    signal: abortController.signal,
  });

  abortController.abort();
  await expect(abortPromise).rejects.toMatchObject({ name: 'AbortError' });
  expect(document.body.innerHTML).toBe('<p>New para</p>');
});

test('switchNodes with aborted signal', async () => {
  document.body.innerHTML = '<p>Original para</p>';

  const sourceDoc = document.implementation.createHTMLDocument();
  sourceDoc.body.innerHTML = '<p>New para</p>';

  const abortController = new AbortController();

  const options = {
    ...commonOptions,
    signal: abortController.signal,
  };

  abortController.abort();
  await expect(switchNodes(sourceDoc, options)).rejects.toMatchObject({ name: 'AbortError' });
  expect(document.body.innerHTML).toBe('<p>Original para</p>');
});
