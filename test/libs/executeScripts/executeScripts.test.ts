import {
  test as base,
  expect,
  onfetch,
} from '#tester';
import executeScripts from '#libs/executeScripts';

/**
 * Log script executions via events of different types on window.
 */
class ExecutionLogger extends EventTarget {
  private messages = '';

  private readonly listener = (event: Event) => {
    if (!(event instanceof CustomEvent)) return;
    const { detail } = event as { detail: unknown };
    if (typeof detail !== 'string') return;
    const logEvent = new CustomEvent('receive', event);
    this.dispatchEvent(logEvent);
    this.messages += detail;
  };

  /**
   * Type of the emitted events.
   */
  private readonly type: string;

  constructor(type: string) {
    super();
    this.type = type;
    window.addEventListener(type, this.listener);
  }

  /**
   * Dispose the event listener.
   */
  dispose(): void {
    window.removeEventListener(this.type, this.listener);
  }

  /**
   * Create a script that emits an event with the given message.
   */
  create(message: string): string {
    return `window.dispatchEvent(new CustomEvent('${this.type}', { detail: '${message}' }));`;
  }

  /**
   * Remove and return the logged messages.
   */
  flush(): string {
    const { messages } = this;
    this.messages = '';
    return messages;
  }
}

export const test = base.extend<{ logger: ExecutionLogger }>({
  logger: async ({ uid }, use) => {
    const logger = new ExecutionLogger(uid);
    await use(logger);
    logger.dispose();
  },
});

export const pendingTest = test.extend<{ pendingNULL: Promise<null> }>({
  pendingNULL: async (_, use) => {
    let stopPending = () => {};
    const pendingPromise: Promise<null> = new Promise<void>((resolve) => {
      stopPending = resolve;
    }).then(() => null);
    await use(pendingPromise);
    stopPending();
  },
});

test.describe('execute scripts', () => {
  test('in non-array iterables', async ({ logger }) => {
    const container = document.createElement('div');
    container.innerHTML = `
      <script>${logger.create('first')}</script>
      <script>${logger.create(' second')}</script>
    `;

    await executeScripts(container.querySelectorAll('script'));
    expect(logger.flush()).toBe('first second');

    await executeScripts(container.children as HTMLCollectionOf<HTMLScriptElement>);
    expect(logger.flush()).toBe('first second');

    await executeScripts(new Set(container.children as HTMLCollectionOf<HTMLScriptElement>));
    expect(logger.flush()).toBe('first second');
  });

  pendingTest('ignore non-blocking execution time', async ({ logger, pendingNULL }) => {
    onfetch('/pending-null.js').reply(pendingNULL);

    const container = document.createElement('div');
    container.innerHTML = `
      <script>${logger.create('first')}</script>
      <script async src="/pending-null.js"></script>
      <script>${logger.create(' second')}</script>
    `;

    await executeScripts(container.children as HTMLCollectionOf<HTMLScriptElement>);
    expect(logger.flush()).toBe('first second');
  });

  test('externals block when needed and keep original order', async ({ logger }) => {
    onfetch('/blocking.js')
      .reply(logger.create(' external blocking'));
    onfetch('/async.js')
      .reply(logger.create(' external async'))
      .twice();

    const container = document.createElement('div');
    container.innerHTML = `
      <script async src="/async.js"></script>
      <script>${logger.create('execute')}</script>
      <script defer src="/async.js"></script>
      <script src="/blocking.js"></script>
      <script>${logger.create(' done')}</script>
    `;

    await expect(executeScripts(container.children as HTMLCollectionOf<HTMLScriptElement>))
      .resolves.not.toThrow();
    expect(logger.flush().replace(/ external async/g, ''))
      .toBe('execute external blocking done');
  });

  test('externals being fetched in parallel and keep original order', async ({ logger }) => {
    let resolveFirst: (content: string) => void = () => {};
    onfetch('/former.js')
      .reply(new Promise<string>((resolve) => {
        resolveFirst = resolve;
      }));
    onfetch('/latter.js')
      .reply(() => {
        window.setTimeout(() => {
          resolveFirst(logger.create(' former'));
        });
        return logger.create(' latter');
      });

    const container = document.createElement('div');
    container.innerHTML = `
      <script>${logger.create('start')}</script>
      <script src="/former.js"></script>
      <script>${logger.create(' inline')}</script>
      <script src="/latter.js"></script>
      <script>${logger.create(' done')}</script>
    `;

    await expect(executeScripts(container.children as HTMLCollectionOf<HTMLScriptElement>))
      .resolves.not.toThrow();
    expect(logger.flush())
      .toBe('start former inline latter done');
  });

  pendingTest('integrated with given signal', async ({ logger, pendingNULL }) => {
    onfetch('/pending-null.js').reply(pendingNULL);

    const container = document.createElement('div');
    container.innerHTML = `
      <script>${logger.create('one-and-only')}</script>
      <script src="/pending-null.js"></script>
      <script>${logger.create(' wrong')}</script>
    `;

    const abortController = new AbortController();

    const abortPromise = executeScripts(
      container.children as HTMLCollectionOf<HTMLScriptElement>,
      { signal: abortController.signal },
    );
    logger.addEventListener('receive', () => abortController.abort(), { once: true });
    await expect(abortPromise).rejects.toMatchObject({ name: 'AbortError' });
    expect(logger.flush()).toBe('one-and-only');

    // Test already aborted.
    const abortedPromise = executeScripts(
      container.children as HTMLCollectionOf<HTMLScriptElement>,
      { signal: abortController.signal },
    );
    await expect(abortedPromise).rejects.toMatchObject({ name: 'AbortError' });
    expect(logger.flush()).toBe('');
  });
});
