module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'routes/**/*.js',
    'middleware/**/*.js',
    'compiler/**/*.js',
    'db/**/*.js'
  ],
  moduleNameMapper: {
    'prom-client': '<rootDir>/__mocks__/prom-client.js'
  },
  verbose: true
};
