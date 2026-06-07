module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.js'],
  // Don't run the copies of these tests that get bundled into the packaged app.
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};
