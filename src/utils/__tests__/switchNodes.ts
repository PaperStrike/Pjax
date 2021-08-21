import switchNodes from '../switchNodes';

const commonOptions = {
  selectors: ['p'],
  switches: {},
};

test('same structures', async () => {
  document.body.innerHTML = '<p>Original para</p><span>Original span</span>';

  const sourceDoc = document.implementation.createHTMLDocument();
  sourceDoc.body.innerHTML = '<p>New para</p><span>New span</span>';

  await switchNodes(sourceDoc, commonOptions);
  expect(document.body.innerHTML).toBe('<p>New para</p><span>Original span</span>');
});

test('focus to clear', async () => {
  document.body.innerHTML = '<p><input>Original para</p><span>Original span</span>';
  (document.body.querySelector('input') as HTMLInputElement).focus();

  const sourceDoc = document.implementation.createHTMLDocument();
  sourceDoc.body.innerHTML = '<p><input>New para</p><span>New span</span>';

  const { focusCleared } = await switchNodes(sourceDoc, commonOptions);
  expect(focusCleared).toBe(true);
  expect([document.body, null]).toContain(document.activeElement);
});

test('different structures', async () => {
  document.body.innerHTML = '<p>Original para</p><span>Original span</span>';

  const sourceDoc = document.implementation.createHTMLDocument();
  sourceDoc.body.innerHTML = '<p>New para</p><p>More new para</p><span>New span</span>';

  await expect(switchNodes(sourceDoc, commonOptions)).rejects.toThrow(DOMException);
});

describe('switch function', () => {
  const generateDoc = () => {
    const doc = document.implementation.createHTMLDocument();
    doc.body.innerHTML = '<p>New para</p><span>New span</span>';
    return doc;
  };

  beforeEach(() => {
    document.body.innerHTML = '<p>Original para</p><span>Original span</span>';
  });

  describe('return value', () => {
    test('could be non-promise', async () => {
      const spy = jest.fn(() => {});
      const switchPromise = switchNodes(generateDoc(), {
        ...commonOptions,
        switches: {
          p: spy,
        },
      });
      await expect(switchPromise).resolves.not.toThrow();
      expect(spy).toHaveBeenCalled();
    });

    test('being awaited if is promise', async () => {
      jest.useFakeTimers();

      const race = Promise.race([
        switchNodes(generateDoc(), {
          ...commonOptions,
          switches: {
            p: () => new Promise((resolve) => window.setTimeout(resolve, 20)),
          },
        }),
        new Promise((resolve) => window.setTimeout(resolve, 10)).then(() => 'first'),
      ]);

      jest.advanceTimersByTime(30);
      await expect(race).resolves.toBe('first');
      jest.useRealTimers();
    });
  });

  test('errors being ignored', async () => {
    await expect(switchNodes(generateDoc(), {
      ...commonOptions,
      switches: {
        p: () => {
          throw new Error();
        },
      },
    })).resolves.not.toThrow();
    await expect(switchNodes(generateDoc(), {
      ...commonOptions,
      switches: {
        p: () => Promise.reject(),
      },
    })).resolves.not.toThrow();
  });
});

test('on abort', async () => {
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

test('aborted signal', async () => {
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
