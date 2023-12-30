/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

function cardTransform(offset, handWidth) {
  const transform = `rotate(${offset * 4}deg) translateX(${
    (offset - (Math.abs(offset) * offset) / 7) * Math.min(140, handWidth / 8)
  }px)`;
  return transform;
}

// Docusaurus v1 animation, reworked a bit for the Docusaurus v2 migration
// TODO maybe we can use React code instead of Vanilla JS now?
export function setupLandingAnimation() {
  /* global document, window, localStorage */
  // Allow taking a bit longer on the first run
  const firstRun = localStorage.getItem('firstRun');
  localStorage.setItem('firstRun', 'true');
  const baseMinimalTime = firstRun ? 3000 : 1500;

  const hand = document.querySelector('.jest-hand');
  const cards = hand.querySelectorAll('.jest-card');

  function positionCards() {
    const handWidth = hand.offsetWidth;
    for (const card of cards) {
      const offset = Number.parseInt(card.dataset.index, 10) - 2;
      card.parentElement.style.transform = cardTransform(offset, handWidth);
    }
  }

  const results = [];
  const timeouts = [];

  function resolveRun(card, index, minTime = 500) {
    setTimeout(() => {
      if (index === 2) {
        results[index] = null;
        card.classList.add('jest-card-run');
      } else if (results[index]) {
        card.classList.remove('jest-card-fail');
        card.classList.add('jest-card-pass');
        for (const el of card.querySelectorAll('.jest-card-label')) {
          el.innerHTML = 'PASS';
        }
      } else {
        card.classList.remove('jest-card-pass');
        card.classList.add('jest-card-fail');
        for (const el of card.querySelectorAll('.jest-card-label')) {
          el.innerHTML = 'FAIL';
        }
      }
    }, minTime);

    if (timeouts[index]) {
      clearTimeout(timeouts[index]);
    }

    timeouts[index] = setTimeout(
      () => {
        card.classList.remove('jest-card-running');
        card.classList.add('jest-card-popping');
        setTimeout(() => {
          results[index] = results[index] || null;
          card.classList.remove('jest-card-popping');
        }, 400);
      },
      index === 2
        ? baseMinimalTime + minTime
        : Math.random() * baseMinimalTime + minTime
    );
  }

  function forceRun(minTime) {
    let fails = 0;
    for (const [index, card] of cards.entries()) {
      card.classList.add('jest-card-running');
      const result = index === 2 || fails > 1 || Math.random() > 0.25;
      if (!result) {
        fails += 1;
      }
      results[index] = result;
      resolveRun(card, index, minTime);
    }
  }

  function runTest(card, index) {
    if (!card.classList.contains('jest-card-running') && !results[index]) {
      if (index === 2) {
        return forceRun(1000);
      }
      card.classList.add('jest-card-running');
      if (results[index] == null) {
        results[index] = Math.random() > 0.2;
        resolveRun(card, index);
      }
    }
    return undefined;
  }

  function handleHandClick(ev) {
    let card;
    if (ev.target.classList.contains('jest-card-hitslop')) {
      card = ev.target.firstChild;
    } else if (ev.target.classList.contains('jest-card')) {
      card = ev.target;
    } else if (ev.target.classList.contains('jest-card-front')) {
      card = ev.target.parentElement;
    }
    if (card) {
      const index = Number.parseInt(card.dataset.index, 10);
      runTest(card, index);
    }
  }

  function setUpMatcherButtons() {
    const matcherSection = document.querySelector('.matchers .blockContent');
    const screenshotImg = document.querySelector('.matchers img');
    const buttonWrapper = document.createElement('p');
    buttonWrapper.className = 'buttons-wrapper';

    const buttons = [
      {
        title: 'toBe',
        url: '/img/content/matchers/toBe.png',
      },
      {
        title: 'toBeCloseTo',
        url: '/img/content/matchers/toBeCloseTo.png',
      },
      {
        title: 'toEqual',
        url: '/img/content/matchers/toEqual.png',
      },
      {
        title: 'toStrictEqual',
        url: '/img/content/matchers/toStrictEqual.png',
      },
      {
        title: 'toHaveProperty',
        url: '/img/content/matchers/toHaveProperty.png',
      },
      {
        title: 'toMatchSnapshot',
        url: '/img/content/matchers/toMatchSnapshot.png',
      },
      {
        title: 'toThrowError',
        url: '/img/content/matchers/toThrowError.png',
      },
    ];

    screenshotImg.addEventListener('load', () => {
      screenshotImg.style.opacity = 1;
    });

    for (const button of buttons) {
      const clickButton = document.createElement('a');
      clickButton.text = button.title;
      clickButton.className = 'button button--primary button--outline landing';
      clickButton.addEventListener('click', () => {
        for (const b of document.querySelectorAll('.matchers .button.landing'))
          b.className = 'button button--primary button--outline landing';
        clickButton.className =
          'button button--primary button--outline landing button--active';
        screenshotImg.style.opacity = 0.5;
        screenshotImg.src = button.url;
      });
      buttonWrapper.append(clickButton);
    }

    matcherSection.append(buttonWrapper);

    const firstButton = document.querySelector(
      '.matchers .blockContent .button'
    );
    firstButton.click();
  }

  // Without forking Docusaurus which is on route to a breaking major semver,
  // we can't make the screenshots clickable. This fixes that with client-side
  // JS. Let's call it progressive enhancement, sure.
  function makeScreenshotsClickable() {
    for (const img of document.querySelectorAll('.blockImage img')) {
      img.style.cursor = 'pointer';
      img.addEventListener('click', () => {
        document.location = img.src;
      });
    }
  }

  let resizeTimeout;
  function handleResize() {
    if (!resizeTimeout) {
      resizeTimeout = setTimeout(() => {
        resizeTimeout = null;
        positionCards();
      }, 500);
    }
  }

  forceRun(2000);
  positionCards();
  setUpMatcherButtons();
  makeScreenshotsClickable();

  window.addEventListener('resize', handleResize);
  hand.addEventListener('click', handleHandClick);

  return () => {
    window.removeEventListener('resize', handleResize);
    hand.removeEventListener('click', handleHandClick);
  };
}
