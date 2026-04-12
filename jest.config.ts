import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src", "<rootDir>/test"],
  testMatch: ["**/*.test.ts", "**/*.spec.ts"],
  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts"],
  moduleNameMapper: {
    '^@src/(.*)$': '<rootDir>/src/$1',
  },
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  globals: {
    'ts-jest': {
      astTransformers: {
        before: [{
          path: '@fultslop/axiom/dist/src/transformer',
          options: {
            allowIdentifiers: ['Priority', 'Status', 'Mode', 'MAX_RETRIES', 'MIN_TIMEOUT', 'DEFAULT_RESULT', 'STRICT_THRESHOLD', 'MAX_LIMIT']
          }
        }]
      }
    }
  }
};

module.exports = config;