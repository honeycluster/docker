 
import sharedConfig from '@docs/configs/dist/src/jest/config';
import { pathsToModuleNameMapper } from 'ts-jest';

import { compilerOptions } from './tsconfig.test.json';

const jestConfig = {
  ...sharedConfig,
  rootDir: '../',
  transform: {
    '^.+\\.m?[tj]sx?$': ['ts-jest', { tsconfig: './config/tsconfig.test.json' }],
  },
  roots: ['<rootDir>'],
  modulePaths: [compilerOptions.baseUrl],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }),
};

export default jestConfig;
