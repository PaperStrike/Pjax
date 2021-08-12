import nock from 'nock';
import Script from '../Script';

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
  scriptEle.id = 'removeSelf';
  scriptEle.text = `
    const script = document.querySelector('#removeSelf');
    script.parentNode.removeChild(script);
  `;

  return expect(new Script(scriptEle).eval()).resolves.not.toThrow();
});

describe('document.currentScript match', () => {
  const testAccessibleScriptText = `
    if (document.currentScript === document.querySelector('#findSelf')) {
      document.body.className = 'found';
    }
  `;

  beforeAll(() => {
    nock('https://external')
      .persist()
      .get('/match.js')
      .reply(200, testAccessibleScriptText);
  });
  afterAll(() => {
    nock.cleanAll();
  });

  const testAccessible = async (sourceType: string, connected: boolean, connectType?: string) => {
    document.body.innerHTML = '';

    const scriptEle = document.createElement('script');
    scriptEle.id = 'findSelf';

    if (sourceType === 'external') {
      scriptEle.src = 'https://external/match.js';
    } else {
      scriptEle.text = testAccessibleScriptText;
    }

    if (connected) {
      if (connectType === 'current') {
        document.body.append(scriptEle);
      } else {
        document.implementation.createHTMLDocument('').body.append(scriptEle);
        expect(document.contains(scriptEle)).toBeFalsy();
      }
      expect(scriptEle.isConnected).toBeTruthy();
    }

    document.body.className = 'not found';

    await new Script(scriptEle).eval();
    expect(document.body.className)
      .toBe('found');
  };

  describe.each(['external', 'inline'])('%s scripts', (sourceType) => {
    describe('connected', () => {
      test.each(['current', 'other'])('in %s doc', async (connectType) => {
        await expect(testAccessible(sourceType, true, connectType)).resolves.not.toThrow();
      });
    });
    test('unconnected', async () => {
      await expect(testAccessible(sourceType, false)).resolves.not.toThrow();
    });
  });
});
