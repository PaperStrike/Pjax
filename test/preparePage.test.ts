import { expect, onfetch, test as base } from '#tester';
import preparePage from '#preparePage';
import type Pjax from '#';

const test = base.extend<{ pjax: Pjax }>({
  pjax: async ({ MockedPjax }, use) => {
    const pjax = new MockedPjax();
    pjax.preparePage = preparePage;

    // test cases here may change the URL.
    const originalURL = document.URL;
    await use(pjax);
    window.history.replaceState(null, '', originalURL);
  },
});

test.describe('prepare page', () => {
  test.describe('autofocus', () => {
    const autofocusTest = test.extend<{ unfocusedAutofocus: HTMLInputElement }>({
      unfocusedAutofocus: async (_, use) => {
        const normal = document.createElement('input');
        const focus = document.createElement('input');
        focus.setAttribute('autofocus', '');
        document.body.append(normal, focus);

        // Ensure it is not the focus.
        normal.focus();
        focus.blur();

        await use(focus);

        // Clean up.
        normal.remove();
        focus.remove();
      },
    });

    autofocusTest('not being focused with not switched content', async ({ unfocusedAutofocus, pjax }) => {
      await pjax.preparePage(null);
      expect(document.activeElement).not.toBe(unfocusedAutofocus);
    });

    autofocusTest('not being focused with previous focus remained', async ({ unfocusedAutofocus, pjax }) => {
      await pjax.preparePage({ focusCleared: false });
      expect(document.activeElement).not.toBe(unfocusedAutofocus);
    });

    autofocusTest('being focused with previous focus cleared', async ({ unfocusedAutofocus, pjax }) => {
      await pjax.preparePage({ focusCleared: true });
      expect(document.activeElement).toBe(unfocusedAutofocus);
    });
  });

  test.describe('scripts', () => {
    const scriptsTest = test.extend<{ getMarkedText:() => string }>({
      getMarkedText: async ({ uid }, use) => {
        const container = document.createElement('section');
        container.title = '';
        container.id = uid;

        const mark = (text: string) => (
          `document.getElementById('${uid}').title += '${text}'`
        );
        container.innerHTML = `
          <script data-pjax>${mark('1')}</script>
          <p>
            <script>${mark(' 2')}</script>
            <script>${mark(' 3')}</script>
          </p>
          <div>
            <pre data-pjax>${mark(' should ignore')}</pre>
            <script data-pjax>${mark(' 4')}</script>
            <script>${mark(' 5')}</script>
          </div>
          <script data-in-selector>${mark(' 6')}</script>
          <script>${mark(' 7')}</script>
        `;
        document.body.append(container);

        await use(() => container.title);

        container.remove();
      },
    });

    scriptsTest('switched or labeled being evaluated and only evaluate once', async ({ pjax, uid, getMarkedText }) => {
      await pjax.preparePage({ focusCleared: false }, {
        selectors: [`#${uid} p`, `#${uid} div`, `#${uid} [data-in-selector]`],
        scripts: `#${uid} [data-pjax]`,
      });
      expect(getMarkedText()).toBe('1 2 3 4 5 6');
    });

    scriptsTest('unordered selected being evaluated in order', async ({ pjax, uid, getMarkedText }) => {
      await pjax.preparePage({ focusCleared: false }, {
        selectors: [`#${uid} [data-in-selector]`, `#${uid} div`, `#${uid} p`],
        scripts: `#${uid} [data-pjax]`,
      });
      expect(getMarkedText()).toBe('1 2 3 4 5 6');
    });
  });

  test.describe('scroll', () => {
    const scrollTest = test.extend<{ prepareViewport: void }>({
      prepareViewport: async (_, use) => {
        document.body.style.width = `${window.outerWidth + 100}px`;
        document.body.style.height = `${window.outerHeight + 100}px`;
        await use();
        document.body.style.removeProperty('width');
        document.body.style.removeProperty('height');
      },
    });

    scrollTest('to target position', async ({ pjax }) => {
      window.scrollTo(0, 0);

      await pjax.preparePage(null, {
        scrollTo: [10, 20],
      });
      expect([window.scrollX, window.scrollY].map(Math.round)).toMatchObject([10, 20]);

      await pjax.preparePage(null, {
        scrollTo: 30,
      });
      expect([window.scrollX, window.scrollY].map(Math.round)).toMatchObject([10, 30]);
    });

    scrollTest('to element with match hash. Disable on desire', async ({ pjax }) => {
      document.body.innerHTML = '';
      const target = document.createElement('p');
      target.id = 'new';
      target.style.cssText = 'margin: 10px 0 0 20px';
      document.body.append(target);
      window.location.hash = '#new';

      window.scrollTo(0, 0);
      await pjax.preparePage(null, {
        scrollTo: true,
      });
      const rect = target.getBoundingClientRect();
      expect([rect.x, rect.y].map(Math.round)).toMatchObject([0, 0]);

      window.scrollTo(0, 0);
      await pjax.preparePage(null, {
        scrollTo: false,
      });
      expect([window.scrollX, window.scrollY].map(Math.round)).toMatchObject([0, 0]);
      window.location.hash = '';
    });

    ([
      ['same', null, [10, 10]],
      ['different', { focusCleared: false }, [0, 0]],
    ] as [string, Parameters<typeof preparePage>[0], [number, number]][]).forEach(([
      pageType,
      switchesResult,
      expectedPosition,
    ]) => {
      scrollTest.describe(`on ${pageType} page`, () => {
        ['#no-match', '#', ''].forEach((hash) => {
          scrollTest(`to ${expectedPosition.join()} when hash changes to "${hash}"`, async ({ pjax }) => {
            window.location.hash = hash;
            window.scrollTo(10, 10);
            await pjax.preparePage(switchesResult, {
              scrollTo: true,
            });
            expect([window.scrollX, window.scrollY].map(Math.round))
              .toMatchObject(expectedPosition);
          });
        });
      });
    });
  });

  test.describe('abort', () => {
    const abortTest = test.extend<{ controller: AbortController, container: HTMLElement }>({
      controller: (_, use) => use(new AbortController()),
      pjax: async ({ pjax, controller, uid }, use) => {
        pjax.abortController = controller;
        pjax.options.selectors = [`#${uid} script`];
        await use(pjax);
      },
      container: async ({ uid }, use) => {
        const container = document.createElement('div');
        container.id = uid;
        container.innerHTML = `
          <script>window.dispatchEvent(new Event('${uid}'))</script>
        `;
        const listener = () => {
          container.title = 'executed';
        };
        window.addEventListener(uid, listener);
        document.body.append(container);
        await use(container);
        window.removeEventListener(uid, listener);
        container.remove();
      },
    });

    abortTest('already', async ({ controller, pjax, container }) => {
      controller.abort();
      const preparePromise = pjax.preparePage({ focusCleared: false });
      await expect(preparePromise).rejects.toMatchObject({ name: 'AbortError' });
      expect(container.title).not.toBe('executed');
    });

    abortTest('ongoing', async ({
      controller,
      pjax,
      container,
      uid,
    }) => {
      // Append a pending-controllable script.
      // Resolve instead of reject at the end
      // as browsers won't abort the fetch or cancel the evaluation due to the removal
      // and if we reject there will be a network error or a syntax error.
      let stopPending = () => {};
      const pendingPromise = new Promise<never>((_, reject) => {
        stopPending = reject;
      }).catch(() => null);
      onfetch('/pending.js').reply(() => pendingPromise);
      const pendingScript = document.createElement('script');
      pendingScript.src = '/pending.js';
      container.append(pendingScript);

      // Abort on the first script's execution.
      const preparePromise = pjax.preparePage({ focusCleared: false });
      window.addEventListener(uid, () => controller.abort(), { once: true });

      await expect(preparePromise).rejects.toMatchObject({ name: 'AbortError' });
      expect(container.title).toBe('executed');

      stopPending();
    });
  });
});
