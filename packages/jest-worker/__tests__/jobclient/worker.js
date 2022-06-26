/*
/home/user/src/qtwebengine-everywhere-src-6.3.1/src/3rdparty/chromium/third_party/devtools-frontend/src/node_modules/rollup-plugin-terser/transform.js
*/

const sleep = ms => new Promise(r => setTimeout(r, ms));

const transform = async (code) => {
  //console.log(`worker: starting transform of ${code}`); // not visible
  await sleep(1000);
  return `${code} ${code}`;
};

exports.transform = transform;
