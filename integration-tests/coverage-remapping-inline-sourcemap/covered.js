/* eslint-disable no-unused-vars */
module.exports = function doES6Stuff(testObj, multiplier) {
  const {someNumber, ...others} = testObj;
  return someNumber * multiplier;
};
