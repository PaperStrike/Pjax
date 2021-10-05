import {
  test,
  expect,
  onfetch,
} from '#tester';
import Script from '#libs/executeScripts/Script';

test.describe('script', () => {
  test('without both src attribute and content', () => {
    const emptyScriptEle = document.createElement('script');

    expect(new Script(emptyScriptEle).evaluable).toBe(false);
  });

  test('with space filled type attribute', () => {
    const spaceTypeScriptEle = document.createElement('script');
    spaceTypeScriptEle.setAttribute('type', '   ');
    spaceTypeScriptEle.text = 'somethingMakeItNotEmpty()';

    expect(new Script(spaceTypeScriptEle).evaluable).toBe(false);
  });

  test('with noModule attribute', () => {
    const noModuleScriptEle = document.createElement('script');
    noModuleScriptEle.noModule = true;
    noModuleScriptEle.text = 'somethingMakeItNotEmpty()';

    expect(new Script(noModuleScriptEle).evaluable).toBe(false);
  });

  test('with invalid src attribute', () => {
    const srcInvalidScriptEle = document.createElement('script');
    srcInvalidScriptEle.text = 'somethingMakeItNotEmpty()';

    ['', 'https://'].forEach((invalidValue) => {
      srcInvalidScriptEle.setAttribute('src', invalidValue);

      expect(new Script(srcInvalidScriptEle).evaluable).toBe(false);
    });
  });

  test('normal module', () => {
    ['module', 'modUle'].forEach((validModuleTypeStrings) => {
      const moduleScriptEle = document.createElement('script');
      moduleScriptEle.text = '()';
      moduleScriptEle.type = validModuleTypeStrings;

      const moduleScript = new Script(moduleScriptEle);
      expect(moduleScript.type).toBe('module');
      expect(moduleScript.evaluable).toBe(true);
      expect(moduleScript.blocking).toBe(false);
    });
  });

  test('normal internal', () => {
    const internalScriptEle = document.createElement('script');
    internalScriptEle.text = '()';

    const internalScript = new Script(internalScriptEle);
    expect(internalScript.type).toBe('classic');
    expect(internalScript.evaluable).toBe(true);
    expect(internalScript.blocking).toBe(true);
  });

  test('normal external', () => {
    const externalScriptEle = document.createElement('script');
    externalScriptEle.src = 'https://example.com/index.js';

    const externalScript = new Script(externalScriptEle);
    expect(externalScript.type).toBe('classic');
    expect(externalScript.evaluable).toBe(true);
    expect(externalScript.blocking).toBe(true);
  });

  test('eval method', async ({ uid }) => {
    let executed = false;
    window.addEventListener(uid, () => {
      executed = true;
    }, { once: true });

    const scriptEle = document.createElement('script');
    scriptEle.text = `window.dispatchEvent(new Event('${uid}'))`;

    await new Script(scriptEle).eval();
    expect(executed).toBeTruthy();
  });

  test('no throw if the script removed itself', async ({ uid }) => {
    const scriptEle = document.createElement('script');
    scriptEle.id = uid;
    scriptEle.text = `
      const script = document.getElementById('${uid}');
      script.parentNode.removeChild(script);
    `;

    await expect(new Script(scriptEle).eval()).resolves.not.toThrow();
    expect(scriptEle.isConnected).toBeFalsy();
  });

  test.describe('document.currentScript match', () => {
    ['external', 'inline'].forEach((scriptType) => {
      ['current', 'other', undefined].forEach((connectedDoc) => {
        test(
          `${scriptType} script ${connectedDoc ? `connected in ${connectedDoc} doc` : 'unconnected'}`,
          async ({ uid }) => {
            let matched = false;
            window.addEventListener(uid, () => {
              matched = true;
            }, { once: true });
            const scriptEleText = `
              if (document.currentScript.id === '${uid}') {
                window.dispatchEvent(new Event('${uid}'));
              }
            `;
            const scriptEle = document.createElement('script');
            scriptEle.id = uid;
            if (scriptType === 'external') {
              onfetch(uid).reply(scriptEleText);
              scriptEle.src = uid;
            } else {
              scriptEle.text = scriptEleText;
            }
            switch (connectedDoc) {
              case 'current': {
                document.body.append(scriptEle);
                break;
              }
              case 'other': {
                document.implementation.createHTMLDocument('').body.append(scriptEle);
                break;
              }
              default: {
                break;
              }
            }
            await new Script(scriptEle).eval();
            expect(matched).toBeTruthy();
          },
        );
      });
    });
  });
});
