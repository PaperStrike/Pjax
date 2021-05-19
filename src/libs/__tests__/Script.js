import Script from '../Script';

test('script without both src attribute and content', () => {
  const emptyScriptEle = document.createElement('script');

  expect(new Script(emptyScriptEle).evaluable).toBe(false);
});

test('script with space filled type attribute', () => {
  const spaceTypeScriptEle = document.createElement('script');
  spaceTypeScriptEle.setAttribute('type', '   ');
  spaceTypeScriptEle.text = 'somethingMakeItNotEmpty()';

  expect(new Script(spaceTypeScriptEle).evaluable).toBe(false);
});

test('script with noModule attribute', () => {
  const noModuleScriptEle = document.createElement('script');
  noModuleScriptEle.noModule = true;
  noModuleScriptEle.text = 'somethingMakeItNotEmpty()';

  expect(new Script(noModuleScriptEle).evaluable).toBe(false);
});

test('script with invalid src attribute', () => {
  const srcInvalidScriptEle = document.createElement('script');
  srcInvalidScriptEle.text = 'somethingMakeItNotEmpty()';

  ['', 'https://'].forEach((invalidValue) => {
    srcInvalidScriptEle.setAttribute('src', invalidValue);

    expect(new Script(srcInvalidScriptEle).evaluable).toBe(false);
  });
});

test('normal module script', () => {
  const moduleScriptEle = document.createElement('script');
  moduleScriptEle.text = '()';
  moduleScriptEle.type = 'module';

  const moduleScript = new Script(moduleScriptEle);
  expect(moduleScript.type).toBe('module');
  expect(moduleScript.evaluable).toBe(true);
  expect(moduleScript.blocking).toBe(false);
});

test('normal internal script', () => {
  const internalScriptEle = document.createElement('script');
  internalScriptEle.text = '()';

  const internalScript = new Script(internalScriptEle);
  expect(internalScript.type).toBe('classic');
  expect(internalScript.evaluable).toBe(true);
  expect(internalScript.blocking).toBe(true);
});

test('normal external script', () => {
  const externalScriptEle = document.createElement('script');
  externalScriptEle.src = 'https://example.com/index.js';

  const externalScript = new Script(externalScriptEle);
  expect(externalScript.type).toBe('classic');
  expect(externalScript.evaluable).toBe(true);
  expect(externalScript.blocking).toBe(true);
});

test('script eval method', async () => {
  document.body.className = '';

  const scriptEle = document.createElement('script');
  scriptEle.text = 'document.body.className = \'executed\'';

  await new Script(scriptEle).eval();
  expect(document.body.className).toBe('executed');
});

test('no throw if the script removed itself', () => {
  const scriptEle = document.createElement('script');
  scriptEle.id = 'myScript';
  scriptEle.text = `
    const script = document.querySelector('#myScript');
    script.parentNode.removeChild(script);
  `;

  return expect(new Script(scriptEle).eval()).resolves.not.toThrow();
});
