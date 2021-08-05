import nock from 'nock';
import executeScripts from '..';

/**
 * Fix nock memory leak - May 17, 2021
 * https://github.com/nock/nock#memory-issues-with-jest
 * https://github.com/nock/nock/issues/2057#issuecomment-702401375
 */
beforeEach(() => {
  if (!nock.isActive()) {
    nock.activate();
  }
});

afterEach(() => {
  nock.restore();
});

const scriptText = (mark) => `document.body.className += '${mark}';`;

describe('non-array iterable', () => {
  const container = document.createElement('div');
  container.innerHTML = `
    <script>${scriptText('executed')}</script>
    <script>${scriptText(' correctly')}</script>
  `;

  test.each`
    type | value
    ${'NodeList'} | ${container.querySelectorAll('script')}
    ${'HTMLCollection'} | ${container.children}
    ${'Set'} | ${new Set(container.children)}
  `('$type', async ({ value }) => {
    document.body.className = '';
    await executeScripts(value);
    expect(document.body.className).toBe('executed correctly');
  });
});

test('ignore non-blocking execution time', async () => {
  // Lock the time.
  jest.useFakeTimers();

  nock('https://external')
    .get('/async.js')
    .delay(100)
    .reply(200, scriptText(' external async'));

  const container = document.createElement('div');
  container.innerHTML = `
    <script>${scriptText('executed')}</script>
    <script async src="https://external/async.js"></script>
    <script>${scriptText(' correctly')}</script>
  `;

  document.body.className = '';
  await executeScripts(container.children as HTMLCollectionOf<HTMLScriptElement>);
  expect(document.body.className).toBe('executed correctly');
});

/**
 * There seems to be a bug in JSDOM.
 * Some expects are commented out for it. - May 23, 2021
 * https://github.com/jsdom/jsdom/issues/3190
 */
test('external scripts block when needed and keep original order', async () => {
  jest.useRealTimers();
  nock('https://external')
    .get('/blocking.js')
    .reply(200, scriptText(' external blocking'));
  nock('https://external')
    .get('/async.js')
    .times(6)
    .reply(200, scriptText(' external async'));

  const container = document.createElement('div');
  container.innerHTML = `
    <script async src="https://external/async.js"></script>
    <script defer src="https://external/async.js"></script>
    <script>${scriptText('executed')}</script>
    <script async src="https://external/async.js"></script>
    <script defer src="https://external/async.js"></script>
    <script src="https://external/blocking.js"></script>
    <script async src="https://external/async.js"></script>
    <script defer src="https://external/async.js"></script>
    <script>${scriptText(' correctly')}</script>
  `;

  document.body.className = '';
  await expect(executeScripts(container.children as HTMLCollectionOf<HTMLScriptElement>))
    .resolves.not.toThrow();
  // expect(document.body.className.replace(/ external async/g, ''))
  //   .toBe('executed external blocking correctly');
});

test('execution integrated with given signal', async () => {
  // Lock the time.
  jest.useFakeTimers();

  nock('https://external')
    .get('/delayed.js')
    .delay(100)
    .reply(200, scriptText(' delayed'));

  const container = document.createElement('div');
  container.innerHTML = `
    <script>${scriptText('executed')}</script>
    <script src="https://external/delayed.js"></script>
    <script>${scriptText(' correctly')}</script>
  `;

  const abortController = new AbortController();

  document.body.className = '';
  const abortPromise = executeScripts(
    container.children as HTMLCollectionOf<HTMLScriptElement>,
    { signal: abortController.signal },
  );
  abortController.abort();
  await expect(abortPromise).rejects.toMatchObject({ name: 'AbortError' });
  // expect(document.body.className).toBe('executed');

  // Test already aborted.
  document.body.className = '';
  const abortedPromise = executeScripts(
    container.children as HTMLCollectionOf<HTMLScriptElement>,
    { signal: abortController.signal },
  );
  await expect(abortedPromise).rejects.toMatchObject({ name: 'AbortError' });
  expect(document.body.className).toBe('');
});
