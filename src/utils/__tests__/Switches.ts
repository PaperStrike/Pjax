import Switches from '../Switches';

test('replaceWith switch', async () => {
  const doc = document.implementation.createHTMLDocument();

  const oldPara = doc.createElement('p');
  oldPara.id = 'remove-attr';
  oldPara.innerHTML = 'Original Text';
  doc.body.appendChild(oldPara);

  const newPara = doc.createElement('p');
  newPara.innerHTML = 'New Text';

  await Switches.replaceWith(oldPara, newPara);

  expect(newPara.innerHTML).toBe('New Text');
  expect(newPara.id).not.toBe('remove-attr');
});

test('innerHTML switch', async () => {
  const doc = document.implementation.createHTMLDocument();

  const oldPara = doc.createElement('p');
  oldPara.id = 'keep-attr';
  oldPara.innerHTML = 'Original Text';
  doc.body.appendChild(oldPara);

  const newPara = doc.createElement('p');
  newPara.innerHTML = 'New Text';

  await Switches.innerHTML(oldPara, newPara);

  expect(oldPara.innerHTML).toBe('New Text');
  expect(oldPara.id).toBe('keep-attr');
});

test('textContent switch', async () => {
  const doc = document.implementation.createHTMLDocument();

  const oldPara = doc.createElement('p');
  oldPara.innerHTML = 'Original Text';
  doc.body.appendChild(oldPara);

  const newPara = doc.createElement('p');
  newPara.innerHTML = 'New Text<span style="display: none;"> with invisible part</span>';

  await Switches.textContent(oldPara, newPara);
  expect(oldPara.innerHTML).toBe('New Text with invisible part');
});

// Assertion commented out as jsdom doesn't support innerText - Aug 5, 2021
// https://github.com/jsdom/jsdom/issues/1245
// eslint-disable-next-line jest/expect-expect
test('innerText switch', async () => {
  const doc = document.implementation.createHTMLDocument();

  const oldPara = doc.createElement('p');
  oldPara.innerHTML = 'Original Text';
  doc.body.appendChild(oldPara);

  const newPara = doc.createElement('p');
  newPara.innerHTML = 'New Text<span style="display: none;"> without invisible part</span>';

  await Switches.innerText(oldPara, newPara);
  // expect(doc.querySelector('p').innerHTML).toBe('New Text');
});

test('attributes switch', async () => {
  const doc = document.implementation.createHTMLDocument();

  const oldPara = doc.createElement('p');
  oldPara.setAttribute('data-common', 'original');
  oldPara.setAttribute('data-old', '');
  oldPara.innerHTML = 'Original Text';
  doc.body.appendChild(oldPara);

  const newPara = doc.createElement('p');
  newPara.setAttribute('data-common', 'new');
  newPara.setAttribute('data-new', '');
  newPara.innerHTML = 'New Text';

  await Switches.attributes(oldPara, newPara);

  expect(oldPara.getAttribute('data-common')).toBe('new');
  expect(oldPara.hasAttribute('data-old')).toBe(false);
  expect(oldPara.hasAttribute('data-new')).toBe(true);
  expect(oldPara.innerHTML).toBe('Original Text');
});
