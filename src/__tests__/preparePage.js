import preparePage from '../preparePage';

const pjax = {
  options: {
    selectors: [],
    scripts: 'script[data-pjax]',
    scrollTo: false,
  },
  status: {
    location: window.location,
  },
  history: {
    push() {},
  },
};

test('prepare page with changed url', async () => {
  const push = jest.fn();

  await preparePage.bind({
    ...pjax,
    status: {
      location: new URL('https://example.com/new'),
    },
    // Since jsdom doesn't support related History API - May 14, 2021
    history: {
      push,
    },
  })(null);

  expect(push.mock.calls[0][2]).toBe('https://example.com/new');
});

const prepareUnfocusedAutofocus = () => {
  const focus = document.createElement('input');
  focus.autofocus = true;
  document.body.append(focus);
  focus.blur();

  return focus;
};

test('prepare page with not switched content', async () => {
  document.body.className = 'should keep';
  document.body.innerHTML = `
    <script data-pjax>document.body.className = '';</script>
  `;
  const autofocus = prepareUnfocusedAutofocus();

  await preparePage.bind(pjax)();

  expect(document.body.className).toBe('should keep');
  expect(document.activeElement).not.toBe(autofocus);
});

test('prepare page with cleared focus', async () => {
  document.body.className = 'should not keep';
  document.body.innerHTML = `
    <script data-pjax>document.body.className = '';</script>
  `;
  const autofocus = prepareUnfocusedAutofocus();

  await preparePage.bind(pjax)({ focusCleared: true });

  expect(document.body.className).toBe('');
  expect(document.activeElement).toBe(autofocus);
});

const prepareScripts = () => {
  document.body.innerHTML = `
    <script data-pjax>document.body.className = '1';</script>
    <p>
      <script>document.body.className += ' 2';</script>
      <script>document.body.className += ' 3';</script>
    </p>
    <div>
      <script>document.body.className += ' 4';</script>
      <script>document.body.className += ' 5';</script>
    </div>
    <script>document.body.className = '0';</script>
  `;
};

test('prepare page with switched and labeled scripts', async () => {
  document.body.className = 'should not keep';
  prepareScripts();

  await preparePage.bind(pjax)({ focusCleared: false }, {
    selectors: ['p', 'div'],
  });

  expect(document.body.className).toBe('1 2 3 4 5');
});

test('prepare page with unordered selectors', async () => {
  document.body.className = 'should not keep';
  prepareScripts();

  await preparePage.bind(pjax)({ focusCleared: false }, {
    selectors: ['div', 'p'],
  });

  expect(document.body.className).toBe('1 2 3 4 5');
});

test('prepare page with target scroll position', async () => {
  // Since jsdom doesn't support scrollTo - May 14, 2021
  window.scrollTo = jest.fn();

  await preparePage.bind(pjax)(null, {
    scrollTo: [1, 2],
  });
  expect(window.scrollTo).toHaveBeenLastCalledWith(1, 2);

  await preparePage.bind(pjax)(null, {
    scrollTo: 3,
  });
  expect(window.scrollTo).toHaveBeenLastCalledWith(window.scrollX, 3);
});

test('prepare page without scroll', async () => {
  // Since jsdom doesn't support scrollTo - May 14, 2021
  window.scrollTo = jest.fn();

  await preparePage.bind(pjax)(null, {
    scrollTo: false,
  });

  expect(window.scrollTo).not.toHaveBeenCalled();
});

test('prepare page with auto scroll position', async () => {
  // Since jsdom doesn't support scrollTo - May 14, 2021
  window.scrollTo = jest.fn();

  const newHashURL = new URL(window.location.href);
  document.body.innerHTML = '<p id="new">A para</p>';

  const scrollPjax = {
    ...pjax,
    status: {
      location: newHashURL,
    },
  };

  // With valid hash
  // A simple no throw as jsdom doesn't support getBoundingClientRect - May 14, 2021
  newHashURL.hash = '#new';
  await expect(preparePage.bind(scrollPjax)(null, {
    scrollTo: true,
  })).resolves.not.toThrow();

  // With not existed hash
  newHashURL.hash = 'not-exist';
  await preparePage.bind(scrollPjax)(null, {
    scrollTo: true,
  });
  expect(window.scrollTo).toHaveBeenLastCalledWith(0, 0);

  // With empty hash
  newHashURL.hash = '#';
  await preparePage.bind(scrollPjax)(null, {
    scrollTo: true,
  });
  expect(window.scrollTo).toHaveBeenLastCalledWith(0, 0);
});
