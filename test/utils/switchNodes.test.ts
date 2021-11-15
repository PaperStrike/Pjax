import { test, expect, FakeTimers } from '#tester';
import switchNodes from '#utils/switchNodes';

const commonOptions = {
  selectors: ['p'],
  switches: {},
};

test.describe('switch nodes', () => {
  test('with same structures', async () => {
    document.body.innerHTML = '<p>Original para</p><span>Original span</span>';

    const sourceDoc = document.implementation.createHTMLDocument();
    sourceDoc.body.innerHTML = '<p>New para</p><span>New span</span>';

    await switchNodes(sourceDoc, commonOptions);
    expect(document.body.innerHTML).toBe('<p>New para</p><span>Original span</span>');
  });

  test('with focus to clear', async () => {
    document.body.innerHTML = '<p><input>Original para</p><span>Original span</span>';
    (document.body.querySelector('input') as HTMLInputElement).focus();

    const sourceDoc = document.implementation.createHTMLDocument();
    sourceDoc.body.innerHTML = '<p><input>New para</p><span>New span</span>';

    const { focusCleared } = await switchNodes(sourceDoc, commonOptions);
    expect(focusCleared).toBe(true);
    expect([document.body, null]).toContain(document.activeElement);
  });

  test('with different structures', async () => {
    document.body.innerHTML = '<p>Original para</p><span>Original span</span>';

    const sourceDoc = document.implementation.createHTMLDocument();
    sourceDoc.body.innerHTML = '<p>New para</p><p>More new para</p><span>New span</span>';

    await expect(switchNodes(sourceDoc, commonOptions))
      .rejects.toMatchObject({ name: 'IndexSizeError' });
  });

  test.describe('switch function', () => {
    const switchFuncTest = test.extend<{ switchDoc: Document }>({
      switchDoc: async (context, use) => {
        document.body.innerHTML = '<p>Original para</p><span>Original span</span>';
        const doc = document.implementation.createHTMLDocument();
        doc.body.innerHTML = '<p>New para</p><span>New span</span>';
        await use(doc);
      },
    });
    switchFuncTest.describe('return value', () => {
      switchFuncTest('could be non-promise', async ({ switchDoc }) => {
        let called = false;
        const switchPromise = switchNodes(switchDoc, {
          ...commonOptions,
          switches: {
            p: () => {
              called = true;
            },
          },
        });
        await expect(switchPromise).resolves.not.toThrow();
        expect(called).toBe(true);
      });
      switchFuncTest('being awaited', async ({ switchDoc }) => {
        const clock = FakeTimers.createClock();
        const race = Promise.race([
          switchNodes(switchDoc, {
            ...commonOptions,
            switches: {
              p: () => new Promise((resolve) => {
                clock.setTimeout(resolve, 20);
              }),
            },
          }),
          new Promise((resolve) => {
            clock.setTimeout(resolve, 10);
          }).then(() => 'first'),
        ]);
        clock.tick(30);
        await expect(race).resolves.toBe('first');
      });
    });
    switchFuncTest('errors being ignored', async ({ switchDoc }) => {
      await expect(switchNodes(switchDoc, {
        ...commonOptions,
        switches: {
          p: () => {
            throw new Error();
          },
        },
      })).resolves.not.toThrow();
      await expect(switchNodes(switchDoc, {
        ...commonOptions,
        switches: {
          p: () => Promise.reject(),
        },
      })).resolves.not.toThrow();
    });
  });

  test.describe('integrate with abort signal', () => {
    test('ongoing', async () => {
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

    test('already', async () => {
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
  });
});
