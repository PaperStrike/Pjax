import { expect, onfetch, test as base } from '.';
import preparePage from '../src/preparePage';
import type Pjax from '../src';

declare module 'expect' {
  interface Matchers<R> {
    toHaveBeenScrolledToAround(element: Element): R;
    toHaveBeenScrolledToAround(left: number, top: number): R;
    toHaveBeenScrolledToAround(top: number): R;
  }
}

expect.extend({
  toHaveBeenScrolledToAround(
    received: unknown,
    eleOrLeftOrTop: Element | number,
    optTop?: number,
  ) {
    let scrollPort: Element;
    if (received instanceof Window) {
      scrollPort = received.document.documentElement;
    } else if (received instanceof Element) {
      scrollPort = received;
    } else {
      return {
        message: () => `expected ${String(received)} not of type Window nor of type Element`,
        pass: false,
      };
    }
    let pass = true;
    let message = '';
    if (eleOrLeftOrTop instanceof Element) {
      const rect = eleOrLeftOrTop.getBoundingClientRect();
      const scrollRect = scrollPort.getBoundingClientRect();
      const check = (
        diff: number,
        type: string,
      ) => {
        pass = Math.abs(diff) <= 5;
        message += `${message ? ';' : 'expected content'} scrolled ${diff} px from the ${type} edge of the target element, ${pass ? '' : 'not '}to be around the element`;
      };
      check(rect.left - scrollRect.left - scrollPort.scrollLeft, 'left');
      if (pass) check(rect.top - scrollRect.top - scrollPort.scrollTop, 'top');
    } else {
      const [left, top] = optTop !== undefined ? [eleOrLeftOrTop, optTop] : [null, eleOrLeftOrTop];
      const compare = (
        actual: number,
        expected: number,
        type: string,
      ) => {
        pass = Math.abs(actual - expected) <= 5;
        message += `${message ? ';' : 'expected content'} scrolled ${actual} px from its ${type} edge, ${pass ? '' : 'not '}to be around ${expected} px`;
      };
      const { scrollLeft, scrollTop } = scrollPort;
      if (left !== null) compare(scrollLeft, left, 'left');
      if (pass) compare(scrollTop, top, 'top');
    }
    return {
      message: () => message,
      pass,
    };
  },
});

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
        document.body.style.width = `${window.outerWidth * 2}px`;
        document.body.style.height = `${window.outerHeight * 2}px`;
        await use();
        document.body.style.removeProperty('width');
        document.body.style.removeProperty('height');
      },
    });

    ([
      ['same', null, false],
      ['switched', { focusCleared: false }, true],
    ] as const).forEach(([
      pageType,
      switchesResult,
      defaultToTop,
    ]) => {
      scrollTest.describe(`on ${pageType} page`, () => {
        scrollTest('to target position', async ({ pjax }) => {
          window.scrollTo(0, 0);

          await pjax.preparePage(switchesResult, {
            scrollTo: [10, 20],
          });
          expect(window).toHaveBeenScrolledToAround(10, 20);

          await pjax.preparePage(switchesResult, {
            scrollTo: 30,
          });
          expect(window).toHaveBeenScrolledToAround(10, 30);
        });

        scrollTest('to target element and can be disabled', async ({ pjax }) => {
          document.body.innerHTML = '';
          const target = document.createElement('p');
          target.id = 'new';

          /**
           * When using `scrollIntoView`, webkit scrolls horizontally
           * only if the element lies far away from the left edge.
           */
          target.style.cssText = `margin: ${window.outerHeight}px 0 0 ${window.outerWidth}px`;
          document.body.append(target);
          window.location.hash = '#new';

          window.scrollTo(0, 0);
          await pjax.preparePage(switchesResult, {
            scrollTo: true,
          });
          expect(window).toHaveBeenScrolledToAround(target);

          window.scrollTo(0, 0);
          await pjax.preparePage(switchesResult, {
            scrollTo: false,
          });
          expect(window).toHaveBeenScrolledToAround(0, 0);
          window.location.hash = '';
        });

        ['#', '', '#top', '#toP'].forEach((hash) => {
          scrollTest(`to top when hash changes to "${hash}"`, async ({ pjax }) => {
            window.location.hash = hash;
            window.scrollTo(window.outerWidth, window.outerHeight);
            await pjax.preparePage(switchesResult, {
              scrollTo: true,
            });
            expect(window).toHaveBeenScrolledToAround(0, 0);
          });
        });

        scrollTest(
          `${defaultToTop ? 'to top even' : 'no scroll'} when hash changes to "#no-match"`,
          async ({ pjax }) => {
            window.location.hash = '#no-match';
            window.scrollTo(20, 20);
            await pjax.preparePage(switchesResult, {
              scrollTo: true,
            });
            if (defaultToTop) {
              expect(window).toHaveBeenScrolledToAround(0, 0);
            } else {
              expect(window).toHaveBeenScrolledToAround(20, 20);
            }
          },
        );
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
          <script>document.currentScript.parentElement.title = 'executed'</script>
        `;
        document.body.append(container);
        await use(container);
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
    }) => {
      onfetch('/abort.js').reply(async () => {
        controller.abort();
        return null;
      });
      const pendingScript = document.createElement('script');
      pendingScript.src = '/abort.js';

      /**
       * Append it with non-script type to set the "already started" flag
       * to avoid premature evaluation of our script.
       */
      pendingScript.type = 'dont-execute-please';
      container.append(pendingScript);
      pendingScript.type = '';

      // Abort on the first script's execution.
      const preparePromise = pjax.preparePage({ focusCleared: false });

      await expect(preparePromise).rejects.toMatchObject({ name: 'AbortError' });
      expect(container.title).toBe('executed');
    });
  });
});
