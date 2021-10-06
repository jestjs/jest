const originalStdoutWrite = process.stdout.write.bind(process.stdout);

global.process.__stdoutWriteMock = global.process.__stdoutWriteMock || null;

/*
  This is a terrible hack to ensure that we monkeyPath stdoutWrite before
  the jest reporter does...
*/
if (!global.process.__stdoutWriteMock) {
  global.process.__stdoutWriteMock = (...args) => {
    global.process.__stdoutWriteMock.text = args[0];
    originalStdoutWrite(...args);
  };

  process.stdout.write = global.process.__stdoutWriteMock;
}

module.exports = global.process.__stdoutWriteMock;
