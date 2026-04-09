const axios = require('axios');

describe('Metrics contract (Dashboard)', () => {
  test('Errors endpoint returns only failures', async () => {
    const res = await axios.get(
      `${global.TEST_BACKEND_URL}/logs/metrics/errors`,
      { params: { apiKey: global.TEST_API_KEY } }
    );

    expect(res.status).toBe(200);

    const payload = res.data.data;

    const errors = Array.isArray(payload)
      ? payload
      : payload.errors || [];

    errors.forEach(err => {
      expect(err.status).toBeGreaterThanOrEqual(400);
    });
  });
});
