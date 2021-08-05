import Switches from '../Switches';

test('replaceWith switch', async () => {
  const { replaceWith } = Switches;

  const doc = document.implementation.createHTMLDocument();

  const container = doc.createElement('div');
  container.innerHTML = '<p id="p">Original Text</p>';
  doc.body.appendChild(container);

  const p = doc.createElement('p');
  p.innerHTML = 'New Text';

  await replaceWith(doc.querySelector('p'), p);

  const switchedPara = doc.querySelector('p');
  expect(switchedPara.innerHTML).toBe('New Text');
  expect(switchedPara.id).not.toBe('p');
});

test('innerHTML switch', async () => {
  const doc = document.implementation.createHTMLDocument();

  const container = doc.createElement('div');
  container.innerHTML = '<p id="keep-attr">Original Text</p>';
  doc.body.appendChild(container);

  const p = doc.createElement('p');
  p.innerHTML = 'New Text';

  await Switches.innerHTML(doc.querySelector('p'), p);

  const switchedPara = doc.querySelector('p');
  expect(switchedPara.innerHTML).toBe('New Text');
  expect(switchedPara.id).toBe('keep-attr');
});

test('textContent switch', async () => {
  const doc = document.implementation.createHTMLDocument();

  const container = doc.createElement('div');
  container.innerHTML = '<p>Original Text</p>';
  doc.body.appendChild(container);

  const p = doc.createElement('p');
  p.innerHTML = 'New Text<span style="display: none;"> with invisible part</span>';

  await Switches.textContent(doc.querySelector('p'), p);
  expect(doc.querySelector('p').innerHTML).toBe('New Text with invisible part');
});

// Assertion commented out as jsdom doesn't support innerText - Aug 5, 2021
// https://github.com/jsdom/jsdom/issues/1245
// eslint-disable-next-line jest/expect-expect
test('innerText switch', async () => {
  const doc = document.implementation.createHTMLDocument();

  const container = doc.createElement('div');
  container.innerHTML = '<p>Original Text</p>';
  doc.body.appendChild(container);

  const p = doc.createElement('p');
  p.innerHTML = 'New Text<span style="display: none;"> with invisible part</span>';

  await Switches.innerText(doc.querySelector('p'), p);
  // expect(doc.querySelector('p').innerHTML).toBe('New Text');
});

test('attributes switch', async () => {
  const doc = document.implementation.createHTMLDocument();

  const container = doc.createElement('div');
  container.innerHTML = '<p data-common="original" data-old>Original Text</p>';
  doc.body.appendChild(container);

  const p = doc.createElement('p');
  p.setAttribute('data-common', 'new');
  p.setAttribute('data-new', '');
  p.innerHTML = 'New Text';

  await Switches.attributes(doc.querySelector('p'), p);

  const switchedPara = doc.querySelector('p');
  expect(switchedPara.getAttribute('data-common')).toBe('new');
  expect(switchedPara.hasAttribute('data-old')).toBe(false);
  expect(switchedPara.hasAttribute('data-new')).toBe(true);
  expect(switchedPara.innerHTML).toBe('Original Text');
});
