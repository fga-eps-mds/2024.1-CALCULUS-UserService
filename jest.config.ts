import type { Config } from 'jest';
import * as dotenv from 'dotenv';

dotenv.config(); 
const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  reporters: [
    'default',
    [
      'jest-sonar',
      {
        outputDirectory: 'reports',
        outputName: 'sonar-report.xml',
      },
    ],
  ],
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  setupFiles: ['dotenv/config'], 
};

export default config;
