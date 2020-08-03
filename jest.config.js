const getProjectAliases = require('./getProjectAliases');

module.exports = {
  preset: 'ts-jest',
  rootDir: __dirname,
  testMatch: ['<rootDir>/tests/**/*.spec.ts'],
  moduleFileExtensions: ['js', 'ts', 'json'],
  moduleNameMapper: getProjectAliases('jest'),
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  moduleDirectories: [
    'node_modules',
    'src'
  ]
};
