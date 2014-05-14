function timerGame(callback) {
  console.log('Ready....go!');
  setTimeout(function() {
    console.log('Times up -- stop!');

    callback && callback();
  }, 1000);
}

module.exports = timerGame;
