describe('group 1', () => {
  test.concurrent('concurrent 1', async () => {
    expect('concurrent 1-1').toMatchSnapshot();
    await new Promise(resolve => setTimeout(resolve, 5000));
  });

  test.concurrent('concurrent 2', async () => {
    expect('concurrent 1-2').toMatchSnapshot();
    await new Promise(resolve => setTimeout(resolve, 5000));
  });
});

describe('group 2', () => {
  test.concurrent('concurrent 1', async () => {
    expect('concurrent 2-1').toMatchSnapshot();
    await new Promise(resolve => setTimeout(resolve, 5000));
  });

  test.concurrent('concurrent 2', async () => {
    expect('concurrent 2-2').toMatchSnapshot();
    await new Promise(resolve => setTimeout(resolve, 5000));
  });
});