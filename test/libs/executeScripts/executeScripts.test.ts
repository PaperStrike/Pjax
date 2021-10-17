/**
 * @TODO: Use less document.body
 */
import {
  test,
  expect,
  onfetch,
  FakeTimers,
} from '#tester';
import executeScripts from '#libs/executeScripts';

const scriptText = (mark: string) => `document.body.className += '${mark}'`;

test.describe('execute scripts', () => {
  test('in non-array iterables', async ({ uid }) => {
    const container = document.createElement('div');
    container.innerHTML = `
      <script>window.dispatchEvent(new Event('${uid}'))</script>
      <script>window.dispatchEvent(new Event('${uid}'))</script>
    `;

    let count = 0;
    const listener = () => {
      count += 1;
    };
    window.addEventListener(uid, listener);

    await executeScripts(container.querySelectorAll('script'));
    expect(count).toBe(2);

    await executeScripts(container.children as HTMLCollectionOf<HTMLScriptElement>);
    expect(count).toBe(4);

    await executeScripts(new Set(container.children as HTMLCollectionOf<HTMLScriptElement>));
    expect(count).toBe(6);

    window.removeEventListener(uid, listener);
  });

  test('ignore non-blocking execution time', async ({ uid }) => {
    // Lock the time.
    const clock = FakeTimers.install();
    onfetch('/delay.js')
      .delay(100)
      .reply();

    const container = document.createElement('div');
    container.innerHTML = `
      <script>window.dispatchEvent(new Event('${uid}'))</script>
      <script async src="/delay.js"></script>
      <script>window.dispatchEvent(new Event('${uid}'))</script>
    `;

    let count = 0;
    const listener = () => {
      count += 1;
    };
    window.addEventListener(uid, listener);

    await executeScripts(container.children as HTMLCollectionOf<HTMLScriptElement>);
    expect(count).toBe(2);

    window.removeEventListener(uid, listener);
    clock.uninstall();
    clock.runToLast();
  });

  test('externals block when needed and keep original order', async () => {
    onfetch('/blocking.js')
      .reply(scriptText(' external blocking'));
    onfetch('/async.js')
      .reply(scriptText(' external async'))
      .twice();

    const container = document.createElement('div');
    container.innerHTML = `
      <script async src="/async.js"></script>
      <script>${scriptText('execute')}</script>
      <script defer src="/async.js"></script>
      <script src="/blocking.js"></script>
      <script>${scriptText(' done')}</script>
    `;

    document.body.className = '';
    await expect(executeScripts(container.children as HTMLCollectionOf<HTMLScriptElement>))
      .resolves.not.toThrow();
    expect(document.body.className.replace(/ external async/g, ''))
      .toBe('execute external blocking done');
  });

  test('externals being fetched in parallel and keep original order', async () => {
    const eventTarget = new EventTarget();
    onfetch('/former.js')
      .reply(new Promise<string>((resolve) => {
        eventTarget.addEventListener('latter-fetched', () => {
          resolve(scriptText(' former'));
        });
      }));
    onfetch('/latter.js')
      .reply(() => {
        window.setTimeout(() => {
          eventTarget.dispatchEvent(new Event('latter-fetched'));
        });
        return scriptText(' latter');
      });

    const container = document.createElement('div');
    container.innerHTML = `
      <script>${scriptText('start')}</script>
      <script src="/former.js"></script>
      <script>${scriptText(' inline')}</script>
      <script src="/latter.js"></script>
      <script>${scriptText(' done')}</script>
    `;

    document.body.className = '';
    await expect(executeScripts(container.children as HTMLCollectionOf<HTMLScriptElement>))
      .resolves.not.toThrow();
    expect(document.body.className)
      .toBe('start former inline latter done');
  });

  test('integrated with given signal', async ({ uid }) => {
    // Lock the time.
    const clock = FakeTimers.install();
    onfetch('/delayed.js')
      .delay(100)
      .reply(scriptText(' delayed'));

    const container = document.createElement('div');
    container.innerHTML = `
      <script>${scriptText(uid)};window.dispatchEvent(new Event('${uid}'))</script>
      <script src="/delayed.js"></script>
      <script>${scriptText(' wrong')}</script>
    `;

    const abortController = new AbortController();

    document.body.className = '';
    const abortPromise = executeScripts(
      container.children as HTMLCollectionOf<HTMLScriptElement>,
      { signal: abortController.signal },
    );
    window.addEventListener(uid, () => abortController.abort(), { once: true });
    await expect(abortPromise).rejects.toMatchObject({ name: 'AbortError' });
    expect(document.body.className).toBe(uid);

    // Test already aborted.
    document.body.className = '';
    const abortedPromise = executeScripts(
      container.children as HTMLCollectionOf<HTMLScriptElement>,
      { signal: abortController.signal },
    );
    await expect(abortedPromise).rejects.toMatchObject({ name: 'AbortError' });
    expect(document.body.className).toBe('');

    clock.uninstall();
    clock.runToLast();
  });
});
