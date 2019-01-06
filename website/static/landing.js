document.addEventListener('DOMContentLoaded', () => {
  const hand = document.querySelector('.jest-hand');
  const cards = hand.querySelectorAll('.jest-card');

  function cardTransform(offset, handWidth) {
    const transform =
      'rotate(' +
      offset * 4 +
      'deg) translateX(' +
      (offset - (Math.abs(offset) * offset) / 7) *
        Math.min(140, handWidth / 8) +
      'px)';
    return transform;
  }

  function positionCards() {
    const handWidth = hand.offsetWidth;
    cards.forEach(card => {
      const offset = parseInt(card.dataset.index) - 2;
      card.parentElement.style.transform = cardTransform(offset, handWidth);
    });
  }

  const results = [];
  const timeouts = [];

  function resolveRun(card, index, minTime) {
    minTime = minTime || 500;
    setTimeout(() => {
      if (index === 2) {
        results[index] = null;
        card.classList.add('jest-card-run');
      } else if (results[index]) {
        card.classList.remove('jest-card-fail');
        card.classList.add('jest-card-pass');
        card.querySelectorAll('.jest-card-label').forEach(el => {
          el.innerHTML = 'PASS';
        });
      } else {
        card.classList.remove('jest-card-pass');
        card.classList.add('jest-card-fail');
        card.querySelectorAll('.jest-card-label').forEach(el => {
          el.innerHTML = 'FAIL';
        });
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
      index === 2 ? 3000 + minTime : Math.random() * 3000 + minTime
    );
  }

  function forceRun(minTime) {
    let fails = 0;
    cards.forEach((card, index) => {
      card.classList.add('jest-card-running');
      const result = index === 2 || fails > 1 || Math.random() > 0.25;
      if (!result) {
        fails += 1;
      }
      results[index] = result;
      resolveRun(card, index, minTime);
    });
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
  }

  hand.addEventListener('click', ev => {
    let card;
    if (ev.target.classList.contains('jest-card-hitslop')) {
      card = ev.target.firstChild;
    } else if (ev.target.classList.contains('jest-card')) {
      card = ev.target;
    } else if (ev.target.classList.contains('jest-card-front')) {
      card = ev.target.parentElement;
    }
    const index = parseInt(card.dataset.index);
    runTest(card, index);
  });

  let resizeTimeout;

  window.addEventListener('resize', () => {
    if (!resizeTimeout) {
      resizeTimeout = setTimeout(() => {
        resizeTimeout = null;
        positionCards();
      }, 500);
    }
  });

  forceRun(2000);
  positionCards();
});
