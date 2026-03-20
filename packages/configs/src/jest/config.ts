import type { JestConfigWithTsJest } from 'ts-jest';

const config: JestConfigWithTsJest = {
  setupFiles: ['jest-localstorage-mock'],
  testEnvironment: 'node',
  testRegex: '/tests/.*\\.(test|spec)?\\.(ts|tsx)$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  verbose: true,
  transform: {
    '^.+\\.m?[tj]sx?$': ['ts-jest', {}],
  },
};

export default config;
