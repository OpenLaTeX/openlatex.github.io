const request = require('supertest');

const mockQueueAdd = jest.fn();
const mockGetWaitingCount = jest.fn();
const mockGetDelayedCount = jest.fn();
const mockPing = jest.fn();

jest.mock('bullmq', () => ({
  Queue: jest.fn(() => ({
    add: mockQueueAdd,
    getWaitingCount: mockGetWaitingCount,
    getDelayedCount: mockGetDelayedCount,
    client: Promise.resolve({ ping: mockPing }),
    close: jest.fn(),
  })),
  QueueEvents: jest.fn(() => ({
    close: jest.fn(),
  })),
}));

const { app } = require('../queue-producer/server');

beforeEach(() => {
  jest.clearAllMocks();
  mockGetWaitingCount.mockResolvedValue(0);
  mockGetDelayedCount.mockResolvedValue(0);
  mockPing.mockResolvedValue('PONG');
});

test('fichiers valides -> POST /compile -> 200 avec PDF', async () => {
  const waitUntilFinished = jest.fn().mockResolvedValue({
    success: true,
    pdf: Buffer.from('%PDF').toString('base64'),
    logs: '',
    hasErrors: false,
  });
  mockQueueAdd.mockResolvedValue({ waitUntilFinished });

  const payload = {
    files: [
      {
        path: 'main.tex',
        content: '\\documentclass{article}\\begin{document}Hello\\end{document}',
      },
    ],
    mainFile: 'main.tex',
  };

  const res = await request(app).post('/compile').send(payload);

  expect(res.status).toBe(200);
  expect(res.body.pdf).toBeDefined();
  expect(mockQueueAdd).toHaveBeenCalledWith('compile', payload, {
    attempts: 1,
    removeOnComplete: true,
    removeOnFail: { age: 3600 },
  });
  expect(waitUntilFinished).toHaveBeenCalledTimes(1);
});

test('compilation en erreur utilisateur -> POST /compile -> 500 avec logs', async () => {
  mockQueueAdd.mockResolvedValue({
    waitUntilFinished: jest.fn().mockResolvedValue({
      success: false,
      error: 'Compilation failed',
      logs: '! Undefined control sequence.',
    }),
  });

  const res = await request(app)
    .post('/compile')
    .send({
      files: [{ path: 'main.tex', content: '\\badcommand' }],
      mainFile: 'main.tex',
    });

  expect(res.status).toBe(500);
  expect(res.body).toEqual({
    error: 'Compilation failed',
    logs: '! Undefined control sequence.',
  });
});
