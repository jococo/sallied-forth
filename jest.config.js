module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/Interpreter.test.ts'],
  collectCoverage: false,
  // Enable source maps
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        sourceMap: true,
        inlineSourceMap: true
      }
    ]
  }
};
