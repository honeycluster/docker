import type { JestConfigWithTsJest } from 'ts-jest';

import path from 'path';

const workspaceDir = path.resolve(__dirname, '../../../../..');
console.log(workspaceDir);

const config: JestConfigWithTsJest = {
  testEnvironment: 'node',
  testRegex: '/tests/.*\\.(test|spec)?\\.(ts|tsx)$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  verbose: true,
  projects: [
    `${workspaceDir}/apps/ext/main`,
    `${workspaceDir}/apps/ext/berry`,
    `${workspaceDir}/packages/libs/api`,
    `${workspaceDir}/packages/libs/ext`,
    `${workspaceDir}/packages/libs/kit`,
    `${workspaceDir}/packages/libs/mgmt`,
    `${workspaceDir}/packages/libs/sdk`,
    `${workspaceDir}/packages/libs/typings`,
    `${workspaceDir}/packages/libs/utils`,
    `${workspaceDir}/packages/shared/const`,
    `${workspaceDir}/packages/shared/helpers`,
    `${workspaceDir}/packages/shared/icons`,
    `${workspaceDir}/packages/shared/ui`,
    `${workspaceDir}/packages/configs`,
    `${workspaceDir}/services/srv/graph`,
    `${workspaceDir}/services/srv/static`,
    `${workspaceDir}/services/srv/trpc`,
    `${workspaceDir}/services/db/pg"`,
  ],
  globals: {
    window: {
      localStorage: {},
      location: {},
    },
  },
  /*   moduleNameMapper: {
    'node-forge': path.join(workspaceDir, 'node_modules', 'node-forge'),
  }, */
  transform: {
    '^.+\\.m?[tj]sx?$': [
      'ts-jest',
      {
        // ts-jest configuration goes here
      },
    ], //to process js/ts with `ts-jest`
    // '^.+\\.m?[tj]sx?$' to process js/ts/mjs/mts with `ts-jest`
    /*     '^.+\\.tsx?$': [
      'ts-jest',
      {
        // ts-jest configuration goes here
      },
    ], */
  },
};

export default config;
