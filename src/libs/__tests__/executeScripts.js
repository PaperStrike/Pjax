import executeScripts from '../executeScripts';

const scriptText = (mark) => `document.body.className += '${mark}';`;

test('execute scripts in non-array iterables', async () => {
  const container = document.createElement('div');
  container.innerHTML = `
    <script>${scriptText('executed')}</script>
    <script>${scriptText(' correctly')}</script>
  `;

  document.body.className = '';
  await executeScripts(container.querySelectorAll('script'));
  expect(document.body.className).toBe('executed correctly');

  document.body.className = '';
  await executeScripts(new Set(container.querySelectorAll('script')));
  expect(document.body.className).toBe('executed correctly');
});
