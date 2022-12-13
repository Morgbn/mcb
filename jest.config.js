/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: [
    '<rootDir>/src',
    '<rootDir>/test'
  ],
  testMatch: [
    '**/*.[jt]s',
    '!**/src/*.[jt]s'
  ],
  transform: {
    '^.+\\.(js|ts)$': 'ts-jest'
  }
}
