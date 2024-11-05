module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // testMatch: ['**/tests/**/*.test.ts', '**/spec/**/*.spec.ts'],
  // testMatch: ['**/tests/**/*.test.ts'],
  testMatch: ['**/spec/**/maths.spec.ts'],
  collectCoverage: true,
};
