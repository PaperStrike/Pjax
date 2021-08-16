import Script from './Script';

class Executor {
  signal: AbortSignal | null;

  constructor(signal: AbortSignal | null) {
    this.signal = signal;
  }

  /**
   * Execute script.
   * Throw only when aborted.
   * Wait only for blocking script.
   */
  async exec(script: Script) {
    if (this.signal?.aborted) throw new DOMException('Execution aborted', 'AbortError');
    const evalPromise = script.eval().catch(() => {});
    if (script.blocking) await evalPromise;
  }
}

/**
 * Find and execute scripts in order.
 * Needed since innerHTML does not run scripts.
 */
export default async function executeScripts(
  scriptEleList: Iterable<HTMLScriptElement>,
  { signal = null }: { signal?: AbortSignal | null } = {},
): Promise<void> {
  if (signal?.aborted) throw new DOMException('Aborted execution', 'AbortError');

  const validScripts = Array.from(scriptEleList, (scriptEle) => new Script(scriptEle))
    .filter((script) => script.evaluable);

  const executor = new Executor(signal);

  // Evaluate external scripts first
  // to help browsers fetch them in parallel.
  // Each inline blocking script will be evaluated as soon as
  // all its previous blocking scripts are executed.
  const execution = validScripts.reduce((promise: Promise<unknown>, script) => {
    if (script.external) {
      return Promise.all([promise, executor.exec(script)]);
    }
    return promise.then(() => executor.exec(script));
  }, Promise.resolve());

  // Reject as soon as possible on abort.
  await Promise.race([
    execution,
    new Promise((resolve, reject) => {
      signal?.addEventListener('abort', () => {
        reject(new DOMException('Aborted execution', 'AbortError'));
      });
    }),
  ]);
}
