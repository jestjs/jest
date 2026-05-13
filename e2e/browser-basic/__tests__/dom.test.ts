/**
 * Ported from vitest/test/browser/test/dom.test.ts
 * Adapted for @jest/browser API
 */

import {afterAll, beforeEach, describe, expect, it} from '@jest/globals';

afterAll(() => {
  document.body.removeAttribute('style');
});

describe('DOM manipulation', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('creates and appends elements', () => {
    const div = document.createElement('div');
    div.textContent = 'Hello World!';
    document.body.append(div);

    expect(div.textContent).toBe('Hello World!');
    expect(document.body.contains(div)).toBe(true);
  });

  it('queries elements by selector', () => {
    const span = document.createElement('span');
    span.dataset.testid = 'my-span';
    span.textContent = 'Found me';
    document.body.append(span);

    const found = document.querySelector('[data-testid="my-span"]');
    expect(found).not.toBeNull();
    expect(found?.textContent).toBe('Found me');
  });

  it('handles click events', () => {
    const button = document.createElement('button');
    let clicked = false;
    button.addEventListener('click', () => {
      clicked = true;
    });
    document.body.append(button);

    button.click();
    expect(clicked).toBe(true);
  });

  it('manipulates classes', () => {
    const div = document.createElement('div');
    document.body.append(div);

    div.classList.add('foo', 'bar');
    expect(div.classList.contains('foo')).toBe(true);
    expect(div.classList.contains('bar')).toBe(true);

    div.classList.remove('foo');
    expect(div.classList.contains('foo')).toBe(false);

    div.classList.toggle('baz');
    expect(div.classList.contains('baz')).toBe(true);
  });

  it('manipulates attributes', () => {
    const input = document.createElement('input');
    document.body.append(input);

    input.setAttribute('type', 'email');
    input.setAttribute('placeholder', 'Enter email');

    expect(input.getAttribute('type')).toBe('email');
    expect(input.getAttribute('placeholder')).toBe('Enter email');

    input.removeAttribute('placeholder');
    expect(input.getAttribute('placeholder')).toBeNull();
  });

  it('shadow DOM basics', () => {
    const host = document.createElement('div');
    document.body.append(host);

    const shadow = host.attachShadow({mode: 'open'});
    const inner = document.createElement('span');
    inner.textContent = 'Shadow content';
    shadow.append(inner);

    expect(shadow.querySelector('span')?.textContent).toBe('Shadow content');
    // Host doesn't expose shadow children via querySelector
    expect(host.querySelector('span')).toBeNull();
  });

  it('SVG elements', () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100');
    svg.setAttribute('height', '100');
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('width', '100');
    rect.setAttribute('height', '100');
    rect.setAttribute('fill', 'red');
    svg.append(rect);
    document.body.append(svg);

    expect(svg.namespaceURI).toBe('http://www.w3.org/2000/svg');
    expect(svg.children).toHaveLength(1);
    expect(rect.getAttribute('fill')).toBe('red');
  });

  it('computed styles', () => {
    const div = document.createElement('div');
    div.style.width = '200px';
    div.style.height = '100px';
    div.style.backgroundColor = 'red';
    document.body.append(div);

    const styles = getComputedStyle(div);
    expect(styles.width).toBe('200px');
    expect(styles.height).toBe('100px');
  });

  it('innerHTML and textContent', () => {
    const div = document.createElement('div');
    div.innerHTML = '<span>Hello</span><span>World</span>';
    document.body.append(div);

    expect(div.children).toHaveLength(2);
    expect(div.textContent).toBe('HelloWorld');

    div.textContent = 'Plain text';
    expect(div.children).toHaveLength(0);
    expect(div.textContent).toBe('Plain text');
  });

  it('event bubbling', () => {
    const parent = document.createElement('div');
    const child = document.createElement('button');
    parent.append(child);
    document.body.append(parent);

    const events: Array<string> = [];
    parent.addEventListener('click', () => events.push('parent'));
    child.addEventListener('click', () => events.push('child'));

    child.click();
    expect(events).toEqual(['child', 'parent']);
  });

  it('MutationObserver', async () => {
    const div = document.createElement('div');
    document.body.append(div);

    const mutations: Array<MutationRecord> = [];
    const observer = new MutationObserver(records => {
      mutations.push(...records);
    });
    observer.observe(div, {childList: true});

    const span = document.createElement('span');
    div.append(span);

    // MutationObserver is async
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mutations).toHaveLength(1);
    expect(mutations[0].type).toBe('childList');
    expect(mutations[0].addedNodes[0]).toBe(span);

    observer.disconnect();
  });
});
