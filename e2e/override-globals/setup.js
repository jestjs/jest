Date.now = () => 0;
process.hrtime = () => [0, 5000];
