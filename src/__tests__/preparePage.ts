import MockedPjax, { SwitchesResult } from '..';
import preparePage from '../preparePage';

jest.mock('..');
class Pjax extends MockedPjax {
  preparePage = preparePage;
}

/**
 * For jsdom doesn't have the method at all. - Jun 9, 2021
 * Track at https://github.com/jsdom/jsdom/pull/2332
 */
window.Element.prototype.scrollIntoView = jest.fn();

const scrollSpy = jest.spyOn(window, 'scrollTo');
beforeEach(() => {
  scrollSpy.mockReset();
});

describe('autofocus', () => {
  const prepareUnfocusedAutofocus = () => {
    document.body.innerHTML = '';
    const focus = document.createElement('input');
    focus.setAttribute('autofocus', '');
    document.body.append(focus);
    focus.blur();

    return focus;
  };

  test('not being focused with not switched content', async () => {
    const autofocus = prepareUnfocusedAutofocus();

    const pjax = new Pjax();

    await pjax.preparePage(null);
    expect(document.activeElement).not.toBe(autofocus);
  });

  test('not being focused with previous focus remained', async () => {
    const autofocus = prepareUnfocusedAutofocus();

    const pjax = new Pjax();

    await pjax.preparePage({ focusCleared: false });
    expect(document.activeElement).not.toBe(autofocus);
  });

  test('being focused with previous focus cleared', async () => {
    const autofocus = prepareUnfocusedAutofocus();

    const pjax = new Pjax();

    await pjax.preparePage({ focusCleared: true });
    expect(document.activeElement).toBe(autofocus);
  });
});

describe('scripts', () => {
  beforeEach(() => {
    document.body.className = 'should not keep';
    document.body.innerHTML = `
      <script data-pjax>document.body.className = '1';</script>
      <p>
        <script>document.body.className += ' 2';</script>
        <script>document.body.className += ' 3';</script>
      </p>
      <div>
        <pre data-pjax>document.body.className += ' should ignore';</pre>
        <script data-pjax>document.body.className += ' 4';</script>
        <script>document.body.className += ' 5';</script>
      </div>
      <script data-in-selector>document.body.className += ' 6';</script>
      <script>document.body.className = '0';</script>
    `;
  });

  test('switched or labeled being evaluated and only evaluate once', async () => {
    const pjax = new Pjax({
      selectors: ['p', 'div', '[data-in-selector]'],
      scripts: '[data-pjax]',
    });

    await pjax.preparePage({ focusCleared: false });
    expect(document.body.className).toBe('1 2 3 4 5 6');
  });

  test('unordered selected being evaluated in order', async () => {
    const pjax = new Pjax({
      selectors: ['[data-in-selector]', 'div', 'p'],
      scripts: 'script[data-pjax]',
    });

    await pjax.preparePage({ focusCleared: false });
    expect(document.body.className).toBe('1 2 3 4 5 6');
  });
});

describe('scroll', () => {
  beforeEach(() => {
    scrollSpy.mockReset();
  });

  document.body.innerHTML = '<p id="new">A para</p>';

  const pjax = new Pjax();

  test('to target position', async () => {
    await pjax.preparePage(null, {
      scrollTo: [1, 2],
    });
    expect(scrollSpy).toHaveBeenLastCalledWith(1, 2);

    await pjax.preparePage(null, {
      scrollTo: 3,
    });
    expect(scrollSpy).toHaveBeenLastCalledWith(window.scrollX, 3);
  });

  test('to element with match hash and disabled when desired', async () => {
    document.body.innerHTML = '<p id="new">A para</p>';
    window.location.hash = '#new';
    // A simple no throw as jsdom doesn't support real scrolling. - Jun 9, 2021
    await expect(pjax.preparePage(null, {
      scrollTo: true,
    })).resolves.not.toThrow();

    scrollSpy.mockReset();
    await pjax.preparePage(null, {
      scrollTo: false,
    });
    expect(scrollSpy).not.toHaveBeenCalled();
  });

  interface PageTypePara {
    switchesResult: SwitchesResult;
    expectation: () => void;
  }

  describe.each`
    pageType | switchesResult | expectation
    ${'same'} | ${null} | ${() => expect(scrollSpy).not.toHaveBeenCalled()}
    ${'different'} | ${{ focusCleared: false }} | ${() => expect(scrollSpy).toHaveBeenLastCalledWith(0, 0)}
  `('invalid hash on $pageType page', ({ switchesResult, expectation }: PageTypePara) => {
    document.body.innerHTML = '';
    test.each`
      type | hash
      ${'no match'} | ${'#no-match'}
      ${'single #'} | ${'#'}
      ${'empty'} | ${''}
    `('$type', async ({ hash }: { hash: string }) => {
      expect.assertions(1);
      scrollSpy.mockReset();
      window.location.hash = hash;
      await pjax.preparePage(switchesResult, {
        scrollTo: true,
      });
      expectation();
    });
  });
});
