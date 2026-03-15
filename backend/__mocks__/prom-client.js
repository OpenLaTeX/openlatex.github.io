module.exports = {
  Histogram: jest.fn().mockImplementation(() => ({ startTimer: jest.fn(() => jest.fn()) })),
  Counter: jest.fn().mockImplementation(() => ({ inc: jest.fn() })),
};
