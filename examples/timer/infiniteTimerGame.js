// Copyright (c) Meta Platforms, Inc. and affiliates.. All Rights Reserved.

function infiniteTimerGame(callback) {
  console.log('Ready....go!');

  setTimeout(() => {
    console.log('Times up! 10 seconds before the next game starts...');
    callback && callback();

    // Schedule the next game in 10 seconds
    setTimeout(() => {
      infiniteTimerGame(callback);
    }, 10000);
  }, 1000);
}

module.exports = infiniteTimerGame;
