describe('SDK → Backend integration (REAL SDK)', () => {
  let init, track;

  beforeAll(async () => {
    const sdk = await import('../devmetrics-sdk/index.js');

    init = sdk.init;
    track = sdk.track;

    init({
      apiKey: global.TEST_API_KEY,
      backendUrl: global.TEST_BACKEND_URL,
      debug: false
    });
  });

  test('SDK tracks a valid request without throwing', async () => {
    await expect(
      track({
        endpoint: '/test/users',
        method: 'GET',
        status: 200,
        responseTime: 42
      })
    ).resolves.not.toThrow();
  });

  test('SDK never crashes host app on failure', async () => {
    await expect(
      track({
        endpoint: '/test/error',
        method: 'GET',
        status: 500,
        responseTime: 10
      })
    ).resolves.not.toThrow();
  });
});
