/**
 * Ported from vitest/test/browser/test/userEvent.test.ts
 * Adapted for @jest/browser API
 */

import {beforeEach, describe, expect, it, jest} from '@jest/globals';
import {userEvent} from '@jest/browser';

beforeEach(() => {
  document.body.replaceChildren();
});

describe('userEvent.click', () => {
  it('correctly clicks a button', async () => {
    const button = document.createElement('button');
    button.textContent = 'Click me';
    document.body.append(button);
    const onClick = jest.fn();
    button.addEventListener('click', onClick);

    await userEvent.click(button);

    expect(onClick).toHaveBeenCalled();
  });

  it.skip('click inside shadow dom', async () => {
    const div = document.createElement('div');
    const shadowRoot = div.attachShadow({mode: 'open'});
    document.body.append(div);

    const button = document.createElement('button');
    button.textContent = 'Click me';
    shadowRoot.append(button);

    const onClick = jest.fn();
    button.addEventListener('click', onClick);

    await userEvent.click(button);

    expect(onClick).toHaveBeenCalled();
  });

  it.skip('clicks inside svg', async () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const circle = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'circle',
    );
    circle.setAttribute('cx', '50');
    circle.setAttribute('cy', '50');
    circle.setAttribute('r', '40');
    svg.append(circle);
    document.body.append(svg);

    const onClick = jest.fn();
    circle.addEventListener('click', onClick);

    await userEvent.click(circle);

    expect(onClick).toHaveBeenCalled();
  });

  it.skip('clicks a button with complex HTML ID', async () => {
    const container = document.createElement('div');
    container.id = ':r3:';
    const button = document.createElement('button');
    button.id = 'A:Button';
    button.textContent = 'Click me';
    container.append(button);
    document.body.append(container);

    const onClick = jest.fn();
    button.addEventListener('click', onClick);

    await userEvent.click(button);

    expect(onClick).toHaveBeenCalled();
  });
});

describe('userEvent.hover', () => {
  it('hover and unhover work correctly', async () => {
    const target = document.createElement('div');
    target.style.width = '100px';
    target.style.height = '100px';
    document.body.append(target);

    let mouseEntered = false;

    target.addEventListener('mouseover', () => {
      mouseEntered = true;
    });

    await userEvent.hover(target);

    expect(mouseEntered).toBe(true);
  });

  it.skip('hover works with shadow root', async () => {
    const div = document.createElement('div');
    const shadowRoot = div.attachShadow({mode: 'open'});
    document.body.append(div);

    const target = document.createElement('div');
    target.style.width = '100px';
    target.style.height = '100px';
    shadowRoot.append(target);

    let mouseEntered = false;
    target.addEventListener('mouseover', () => {
      mouseEntered = true;
    });

    await userEvent.hover(target);

    expect(mouseEntered).toBe(true);
  });

  it.skip('hover works with svg', async () => {
    const target = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'svg',
    );
    target.style.width = '100px';
    target.style.height = '100px';
    document.body.append(target);

    let mouseEntered = false;
    target.addEventListener('mouseover', () => {
      mouseEntered = true;
    });

    await userEvent.hover(target);

    expect(mouseEntered).toBe(true);
  });
});

describe('userEvent.type', () => {
  it('types into an input', async () => {
    const input = document.createElement('input');
    input.type = 'text';
    document.body.append(input);

    await userEvent.type(input, 'Hello World!');
    expect(input.value).toBe('Hello World!');
  });

  it('types into a textarea', async () => {
    const textarea = document.createElement('textarea');
    document.body.append(textarea);

    await userEvent.type(textarea, 'Multi\nline');
    expect(textarea.value).toContain('Multi');
  });

  it.skip('types into a shadow root input', async () => {
    const div = document.createElement('div');
    const shadowRoot = div.attachShadow({mode: 'open'});
    document.body.append(div);

    const input = document.createElement('input');
    input.type = 'text';
    shadowRoot.append(input);

    await userEvent.type(input, 'Hello');
    expect(input.value).toBe('Hello');
  });
});

describe('userEvent.clear', () => {
  it('clears input value', async () => {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = 'existing text';
    document.body.append(input);

    await userEvent.clear(input);
    expect(input.value).toBe('');
  });

  it('clears textarea value', async () => {
    const textarea = document.createElement('textarea');
    textarea.value = 'existing text';
    document.body.append(textarea);

    await userEvent.clear(textarea);
    expect(textarea.value).toBe('');
  });
});

describe('userEvent.tab', () => {
  it('tab correctly switches focus', async () => {
    const input1 = document.createElement('input');
    input1.type = 'text';
    const input2 = document.createElement('input');
    input2.type = 'text';
    document.body.append(input1);
    document.body.append(input2);

    input1.focus();
    await userEvent.tab();

    expect(document.activeElement).toBe(input2);
  });
});
