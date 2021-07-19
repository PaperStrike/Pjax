import Script from './Script';

/**
 * Find and execute scripts in order.
 * Needed since innerHTML does not run scripts.
 * @param {Iterable<HTMLScriptElement>} scriptEleList
 * @param {Object} [options]
 * @param {AbortSignal} [options.signal]
 */
export default async function executeScripts(scriptEleList, { signal } = {}) {
  if (signal?.aborted) throw new DOMException('Aborted execution', 'AbortError');

  const validScripts = [...scriptEleList]
    .map((scriptEle) => new Script(scriptEle))
    .filter((script) => script.evaluable);

  const blockingScripts = [];
  const asyncScripts = [];
  validScripts.forEach((script) => {
    (script.blocking ? blockingScripts : asyncScripts).push(script);
  });

  // Evaluate script. Throw only when aborted.
  const evalScript = async (script) => {
    if (signal?.aborted) return;
    await script.eval().catch(() => {});
  };

  // Evaluate external blocking scripts first
  // to help browsers fetch them in parallel.
  // Each inline blocking script will be evaluated as soon as
  // all its previous blocking scripts are executed.
  const blockingExecution = blockingScripts.reduce((promise, script) => {
    if (script.external) {
      return Promise.all([promise, evalScript(script)]);
    }
    return promise.then(() => evalScript(script));
  }, Promise.resolve());

  asyncScripts.forEach(evalScript);

  // Reject as soon as possible on abort.
  return Promise.race([
    blockingExecution,
    new Promise((resolve, reject) => {
      signal?.addEventListener('abort', () => {
        reject(new DOMException('Aborted execution', 'AbortError'));
      });
    }),
  ]);
}
