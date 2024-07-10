import type {Config} from 'jest';

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    reporters: [
        'default',
        [
            'jest-sonar',
            {
                outputDirectory: 'reports',
                outputName: 'sonar-report.xml'
            }
        ]
    ]
};

export default config;