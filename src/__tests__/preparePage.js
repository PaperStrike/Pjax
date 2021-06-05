import preparePage from '../preparePage';

class SimplePjax {
  options = {
    selectors: [],
    scripts: 'script[data-pjax]',
    scrollTo: false,
  };

  preparePage = preparePage;
}

const simpleSwitchResult = { focusCleared: false, outcomes: [] };

describe('autofocus', () => {
  const prepareUnfocusedAutofocus = () => {
    document.body.innerHTML = '';
    const focus = document.createElement('input');
    focus.autofocus = true;
    document.body.append(focus);
    focus.blur();

    return focus;
  };

  test('not being focused with not switched content', async () => {
    const autofocus = prepareUnfocusedAutofocus();

    const pjax = new SimplePjax();

    await pjax.preparePage(null);
    expect(document.activeElement).not.toBe(autofocus);
  });

  test('not being focused with previous focus remained', async () => {
    const autofocus = prepareUnfocusedAutofocus();

    const pjax = new SimplePjax();

    await pjax.preparePage(simpleSwitchResult);
    expect(document.activeElement).not.toBe(autofocus);
  });

  test('being focused with previous focus cleared', async () => {
    const autofocus = prepareUnfocusedAutofocus();

    const pjax = new SimplePjax();

    await pjax.preparePage({ ...simpleSwitchResult, focusCleared: true });
    expect(document.activeElement).toBe(autofocus);
  });
});

describe('scripts', () => {
  const prepareScripts = () => {
    document.body.innerHTML = `
      <script data-pjax>document.body.className = '1';</script>
      <p>
        <script>document.body.className += ' 2';</script>
        <script>document.body.className += ' 3';</script>
      </p>
      <div>
        <script data-pjax>document.body.className += ' 4';</script>
        <script>document.body.className += ' 5';</script>
      </div>
      <script>document.body.className = '0';</script>
    `;
  };

  test('switched or labeled being evaluated and only evaluate once', async () => {
    document.body.className = 'should not keep';
    prepareScripts();

    const pjax = new SimplePjax();

    await pjax.preparePage(simpleSwitchResult, {
      selectors: ['p', 'div'],
    });
    expect(document.body.className).toBe('1 2 3 4 5');
  });

  test('unordered selected being evaluated in order', async () => {
    document.body.className = 'should not keep';
    prepareScripts();

    const pjax = new SimplePjax();

    await pjax.preparePage(simpleSwitchResult, {
      selectors: ['div', 'p'],
    });
    expect(document.body.className).toBe('1 2 3 4 5');
  });
});

describe('scroll', () => {
  window.scrollTo = jest.fn();
  beforeEach(() => {
    window.scrollTo.mockReset();
  });

  document.body.innerHTML = '<p id="new">A para</p>';

  const pjax = new SimplePjax();

  test('to target position', async () => {
    await pjax.preparePage(null, {
      scrollTo: [1, 2],
    });
    expect(window.scrollTo).toHaveBeenLastCalledWith(1, 2);

    await pjax.preparePage(null, {
      scrollTo: 3,
    });
    expect(window.scrollTo).toHaveBeenLastCalledWith(window.scrollX, 3);
  });

  test('to element with match hash and disabled when desired', async () => {
    document.body.innerHTML = '<p id="new">A para</p>';
    window.location.hash = '#new';
    // A simple no throw as jsdom doesn't support getBoundingClientRect - May 14, 2021
    await expect(pjax.preparePage(null, {
      scrollTo: true,
    })).resolves.not.toThrow();

    window.scrollTo.mockReset();
    await pjax.preparePage(null, {
      scrollTo: false,
    });
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  describe.each`
    pageType | switchResult | expectation
    ${'same'} | ${null} | ${() => expect(window.scrollTo).not.toHaveBeenCalled()}
    ${'different'} | ${simpleSwitchResult} | ${() => expect(window.scrollTo).toHaveBeenLastCalledWith(0, 0)}
  `('invalid hash on $pageType page', ({ switchResult, expectation }) => {
    document.body.innerHTML = '';
    test.each`
      type | hash
      ${'no match'} | ${'#no-match'}
      ${'single #'} | ${'#'}
      ${'empty'} | ${''}
    `('$type', async ({ hash }) => {
      window.scrollTo.mockReset();
      window.location.hash = hash;
      await pjax.preparePage(switchResult, {
        scrollTo: true,
      });
      expectation();
    });
  });
});
