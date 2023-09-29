describe('group 1', () => {
  test.concurrent('concurrent 1', async () => {
    expect('concurrent 1-1').toMatchNamedSnapshot('test1');
    await new Promise(resolve => setTimeout(resolve, 5000));
  });

  test.concurrent('concurrent 2', async () => {
    expect('concurrent 1-2').toMatchNamedSnapshot('test2');
    await new Promise(resolve => setTimeout(resolve, 5000));
  });
});

describe('group 2', () => {
  test.concurrent('concurrent 1', async () => {
    expect('concurrent 2-1').toMatchNamedSnapshot('test3');
    await new Promise(resolve => setTimeout(resolve, 5000));
  });

  test.concurrent('concurrent 2', async () => {
    expect('concurrent 2-2').toMatchNamedSnapshot('test4');
    await new Promise(resolve => setTimeout(resolve, 5000));
  });
});