import {
  test as base,
  expect,
  onfetch,
  FakeTimers,
} from '#tester';
import switchDOM from '#switchDOM';
import type Pjax from '#';

const test = base.extend<{ pjax: Pjax }>({
  pjax: async ({ MockedPjax }, use) => {
    const pjax = new MockedPjax({
      selectors: ['body'],
    });
    pjax.switchDOM = switchDOM;

    // test cases here may change the URL.
    const originalURL = document.URL;
    await use(pjax);
    window.history.replaceState(null, '', originalURL);
  },
});

test.describe('switch DOM', () => {
  test('partial response', async ({ pjax }) => {
    onfetch('/partial')
      .reply('<body class="partial"></body>');

    await pjax.switchDOM('/partial');
    expect(document.body.className).toBe('partial');
    expect(window.location.pathname).toBe('/partial');
  });

  test('empty response', async ({ pjax }) => {
    onfetch('/empty')
      .reply();

    await pjax.switchDOM('/empty');
    expect(document.body.children).toHaveLength(0);
    expect(window.location.pathname).toBe('/empty');
  });

  test('accept Request object', async ({ pjax }) => {
    onfetch('/request', { method: 'POST' })
      .reply();

    await pjax.switchDOM(new Request('/request', {
      method: 'POST',
    }));
    expect(document.body.children).toHaveLength(0);
    expect(window.location.pathname).toBe('/request');
  });

  test('follow redirect', async ({ pjax }) => {
    onfetch('/from')
      .reply(Response.redirect('/to'));
    onfetch('/to')
      .reply('<body class="redirect"></body>');

    await pjax.switchDOM('/from');
    expect(document.body.className).toBe('redirect');
    expect(window.location.pathname).toBe('/to');
  });

  test('preserve hash', async ({ pjax }) => {
    onfetch('/with')
      .reply('<body class="hash"></body>');

    await pjax.switchDOM('/with#hash');
    expect(document.body.className).toBe('hash');
    expect(window.location.pathname).toBe('/with');
    expect(window.location.hash).toBe('#hash');
  });

  test.describe('pushState', () => {
    test('is called once when URL not updated', async ({ pjax }) => {
      onfetch('/call').reply();

      const originalHistoryLength = window.history.length;

      await pjax.switchDOM('/call');
      expect(window.location.pathname).toBe('/call');
      expect(window.history.length).toBe(originalHistoryLength + 1);
    });

    test('is not called when URL already updated', async ({ pjax }) => {
      onfetch('/no-call').reply();

      window.history.pushState({}, '', '/no-call');

      const originalHistoryLength = window.history.length;

      await pjax.switchDOM('/no-call');
      expect(window.location.pathname).toBe('/no-call');
      expect(window.history.length).toBe(originalHistoryLength);
    });
  });

  test('request headers', async ({ pjax }) => {
    let sentHeaders = new Headers();
    onfetch('/headers')
      .reply((request) => {
        sentHeaders = new Headers(request.headers);
        return null;
      });

    await pjax.switchDOM('/headers');
    expect(sentHeaders.get('X-Requested-With')).toBe('Fetch');
    expect(sentHeaders.get('X-Pjax')).toBe('true');
    expect(sentHeaders.get('X-Pjax-Selectors')).toBe(JSON.stringify(pjax.options.selectors));
  });

  test('cache mode', async ({ pjax }) => {
    let requestCache = '';
    onfetch('/cache-mode')
      .reply((request) => {
        requestCache = request.cache;
        return null;
      });

    await pjax.switchDOM('/cache-mode', {
      cache: 'no-cache',
    });
    expect(requestCache).toBe('no-cache');
  });

  test('throw on signal abort', async ({ pjax }) => {
    onfetch('/delay')
      .delay(500)
      .reply('Not Aborted.', { status: 500 });

    const abortController = new AbortController();
    pjax.abortController = abortController;

    const abortPromise = pjax.switchDOM('/delay');
    abortController.abort();
    await expect(abortPromise).rejects.toMatchObject({ name: 'AbortError' });
  });

  test('throw on aborted signal', async ({ pjax }) => {
    onfetch('/delay')
      .delay(500)
      .reply('Not Aborted.', { status: 500 });

    const abortController = new AbortController();
    pjax.abortController = abortController;
    abortController.abort();

    await expect(pjax.switchDOM('/delay'))
      .rejects.toMatchObject({ name: 'AbortError' });
  });

  type InstalledClock = FakeTimers.BrowserClock & FakeTimers.InstalledMethods;
  const clockTest = test.extend<{ clock: InstalledClock }>({
    clock: async (_, use) => {
      const clock = FakeTimers.install();
      await use(clock as InstalledClock);
      clock.uninstall();
      clock.runToLast();
    },
  });

  clockTest('do abort on timeout while pending', async ({ pjax, clock }) => {
    onfetch('/delay')
      .delay(500)
      .reply('Not Aborted.', { status: 500 });

    pjax.abortController = new AbortController();

    const timeoutPromise = pjax.switchDOM('/delay', {
      timeout: 50,
    });

    clock.tick(100);
    await expect(timeoutPromise).rejects.toMatchObject({ name: 'AbortError' });
    expect(pjax.abortController.signal.aborted).toBe(true);
  });

  clockTest('do not abort on timeout while not pending', async ({ pjax, clock }) => {
    onfetch('/resolve').reply();

    pjax.abortController = new AbortController();

    const resolvePromise = pjax.switchDOM('/resolve', {
      timeout: 50,
    });

    await expect(resolvePromise).resolves.not.toThrow();

    clock.tick(100);
    expect(pjax.abortController.signal.aborted).toBe(false);
  });
});
