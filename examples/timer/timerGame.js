// Copyright 2004-present Facebook. All Rights Reserved.

function timerGame(callback) {
  console.log('Ready....go!');
  setTimeout(() => {
    console.log('Times up -- stop!');
    callback && callback();
  }, 1000);
}

module.exports = timerGame;
