import Script from './Script';

// Evaluate script regardless of the result.
const evalScript = (script) => script.eval().catch(() => {});

// Find and execute scripts in order (used for newly added elements).
// Needed since innerHTML does not run scripts
export default function executeScripts(scriptEleList) {
  const validScripts = [...scriptEleList]
    .map((scriptEle) => new Script(scriptEle))
    .filter((script) => script.evaluable);

  const blockingScripts = [];
  const asyncScripts = [];
  validScripts.forEach((script) => {
    (script.blocking ? blockingScripts : asyncScripts).push(script);
  });

  // Evaluate external blocking scripts first
  // to help browsers fetch them in parallel.
  // Each inline blocking script will be evaluated as soon as
  // all its previous blocking scripts are executed.
  const blockingPromise = blockingScripts.reduce((promise, script) => {
    if (script.external) {
      return Promise.all([promise, evalScript(script)]);
    }
    return promise.then(() => evalScript(script));
  }, Promise.resolve());

  return Promise.all([
    blockingPromise,
    ...asyncScripts.map(evalScript),
  ]);
}
