// Simulates network latency and occasional structure so the rest of the app
// can be written exactly as it would be against a real REST backend.
export const simulateRequest = (data, { delay = 600, failRate = 0 } = {}) =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      if (failRate > 0 && Math.random() < failRate) {
        reject({ response: { status: 500, data: { message: 'Mock server error' } } });
        return;
      }
      resolve({ data });
    }, delay);
  });
