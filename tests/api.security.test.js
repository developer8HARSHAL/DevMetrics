const axios = require('axios');

describe('API key security', () => {
  test('Rejects missing API key', async () => {
    await expect(
      axios.post(`${global.TEST_BACKEND_URL}/track`, {})
    ).rejects.toHaveProperty('response.status');

    try {
      await axios.post(`${global.TEST_BACKEND_URL}/track`, {});
    } catch (err) {
      expect(err.response.status).toBeGreaterThanOrEqual(400);
    }
  });

  test('Rejects invalid API key', async () => {
    try {
      await axios.post(
        `${global.TEST_BACKEND_URL}/track`,
        {},
        { headers: { 'x-api-key': 'invalid_key' } }
      );
    } catch (err) {
      expect(err.response.status).toBeGreaterThanOrEqual(400);
    }
  });
});
