globalThis.afterEnvAsyncFunctionFinished = false;

module.exports = async () => {
  await new Promise(resolve =>
    setTimeout(() => {
      globalThis.afterEnvAsyncFunctionFinished = true;
      resolve();
    }, 2000),
  );
};
