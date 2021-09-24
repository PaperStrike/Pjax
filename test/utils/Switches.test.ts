import { test as base, expect } from '#tester';
import Switches from '#utils/Switches';

const test = base.extend<{ target: HTMLElement, replacer: HTMLElement }>({
  target: async (_, use) => {
    const ele = document.createElement('div');
    ele.innerHTML = 'Original Text';
    document.body.append(ele);
    await use(ele);
    ele.remove();
  },
  replacer: async (_, use) => {
    const ele = document.createElement('div');
    ele.innerHTML = 'New Text';
    await use(ele);
    ele.remove();
  },
});

test.describe('switches', () => {
  test('replaceWith switch', async ({ target, replacer }) => {
    target.dataset.attr = 'remove';
    replacer.id = `replacer_${Math.random().toFixed(6)}`;

    await Switches.replaceWith(target, replacer);

    const switched = document.getElementById(replacer.id);
    expect(switched?.innerHTML).toBe('New Text');
    expect(switched?.dataset.attr).not.toBe('remove');
  });

  test('innerHTML switch', async ({ target, replacer }) => {
    target.dataset.attr = 'keep';

    await Switches.innerHTML(target, replacer);

    expect(target.innerHTML).toBe('New Text');
    expect(target.dataset.attr).toBe('keep');
  });

  test.describe('invisible part', () => {
    const visibilityTest = test.extend<{ replacer: HTMLElement }>({
      replacer: async ({ replacer }, use) => {
        const invisible = document.createElement('span');
        invisible.style.display = 'none';
        invisible.innerHTML = ' invisible part';
        replacer.append(invisible);

        // Browser checks visibility only for connected elements.
        document.body.append(replacer);

        await use(replacer);
      },
    });

    visibilityTest('included by textContent switch', async ({ target, replacer }) => {
      await Switches.textContent(target, replacer);
      expect(target.innerHTML).toBe('New Text invisible part');
    });

    visibilityTest('ignored by innerText switch', async ({ target, replacer }) => {
      await Switches.innerText(target, replacer);
      expect(target.innerHTML).toBe('New Text');
    });
  });

  test('attributes switch', async ({ target, replacer }) => {
    Object.assign(target.dataset, {
      common: 'old',
      old: '',
    });

    Object.assign(replacer.dataset, {
      common: 'new',
      new: '',
    });

    await Switches.attributes(target, replacer);

    expect(target.dataset.common).toBe('new');
    expect('old' in target.dataset).toBe(false);
    expect('new' in target.dataset).toBe(true);
    expect(target.innerHTML).toBe('Original Text');
  });
});
