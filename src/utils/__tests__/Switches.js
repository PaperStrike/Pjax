import Switches from '../Switches';

test('test replaceWith switch', () => {
  const { replaceWith } = Switches;

  const doc = document.implementation.createHTMLDocument();

  const container = doc.createElement('div');
  container.innerHTML = '<p id="p">Original Text</p>';
  doc.body.appendChild(container);

  const p = doc.createElement('p');
  p.innerHTML = 'New Text';

  return replaceWith(doc.querySelector('p'), p)
    .then(() => {
      expect(doc.querySelector('p').innerHTML).toBe('New Text');
      expect(doc.querySelector('p').id).not.toBe('p');
    });
});

test('test innerHTML switch', () => {
  const doc = document.implementation.createHTMLDocument();

  const container = doc.createElement('div');
  container.innerHTML = '<p id="p">Original Text</p>';
  doc.body.appendChild(container);

  const p = doc.createElement('p');
  p.innerHTML = 'New Text';

  return Switches.innerHTML(doc.querySelector('p'), p)
    .then(() => {
      expect(doc.querySelector('p').innerHTML).toBe('New Text');
      expect(doc.querySelector('p').id).toBe('p');
    });
});

test('test textContent switch', () => {
  const doc = document.implementation.createHTMLDocument();

  const container = doc.createElement('div');
  container.innerHTML = '<p>Original Text</p>';
  doc.body.appendChild(container);

  const p = doc.createElement('p');
  p.innerHTML = 'New Text<span style="display: none;"> with invisible part</span>';

  return Switches.textContent(doc.querySelector('p'), p)
    .then(() => {
      expect(doc.querySelector('p').innerHTML).toBe('New Text with invisible part');
    });
});

test('test innerText switch', () => {
  const doc = document.implementation.createHTMLDocument();

  const container = doc.createElement('div');
  container.innerHTML = '<p>Original Text</p>';
  doc.body.appendChild(container);

  const p = doc.createElement('p');
  p.innerHTML = 'New Text<span style="display: none;"> with invisible part</span>';

  // No assertion as jsdom doesn't support innerText - May 14, 2021
  return Switches.innerText(doc.querySelector('p'), p);
});

test('test attributes switch', () => {
  const doc = document.implementation.createHTMLDocument();

  const container = doc.createElement('div');
  container.innerHTML = '<p data-common="original" data-old>Original Text</p>';
  doc.body.appendChild(container);

  const p = doc.createElement('p');
  p.setAttribute('data-common', 'new');
  p.setAttribute('data-new', '');
  p.innerHTML = 'New Text';

  return Switches.attributes(doc.querySelector('p'), p)
    .then(() => {
      const docP = doc.querySelector('p');
      expect(docP.getAttribute('data-common')).toBe('new');
      expect(docP.hasAttribute('data-old')).toBe(false);
      expect(docP.hasAttribute('data-new')).toBe(true);
      expect(docP.innerHTML).toBe('Original Text');
    });
});
