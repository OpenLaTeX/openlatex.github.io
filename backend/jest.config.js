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
  verbose: true
};
