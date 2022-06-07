import router from '../router';

describe('Check if all endpoints are declarated', () => {
  test('Should exists path /health', async () => {
    const pathToBeTested = '/health';
    const healthEndpoint = router.stack.find((endpoint: { route: { path: string; }; }) => endpoint.route.path === pathToBeTested);
    expect(healthEndpoint).toBeDefined();
  });
  test('Should exists method GET on /health', async () => {
    const pathToBeTested = '/health';
    const healthMethod = router.stack.some((endpoint: { route: { path: string; methods: { get: any; }; }; }) => endpoint.route.path === pathToBeTested
      && endpoint.route.methods.get);
    expect(healthMethod).toBeTruthy();
  });
});
