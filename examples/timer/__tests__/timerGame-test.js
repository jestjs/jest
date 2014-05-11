jest.dontMock('../timerGame');

describe('timerGame', function() {
  it('waits 1 second before ending the game', function() {
    var timerGame = require('../timerGame');
    timerGame();

    expect(setTimeout.mock.calls.length).toBe(1);
    expect(setTimeout.mock.calls[0][1]).toBe(1000);
  });

  it('calls the callback after 1 second', function() {
    var timerGame = require('../timerGame');
    var callback = jest.genMockFunction();

    timerGame(callback);

    // At this point in time, the callback should not have been called yet
    expect(callback).not.toBeCalled();

    // Fast-forward until all timers have been executed
    jest.runAllTimers();

    // Now our callback should have been called!
    expect(callback).toBeCalled()
    expect(callback.mock.calls.length).toBe(1);
  });

});

