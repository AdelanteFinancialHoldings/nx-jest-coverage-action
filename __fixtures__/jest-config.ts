import type * as jestTypes from 'jest'
import { jest } from '@jest/globals'

// Mock Jest configuration objects
export const mockJestConfig = {
  globalConfig: {
    coverageDirectory: '/path/to/coverage',
    coverageReporters: ['json', 'lcov', 'text', 'clover', 'json-summary']
  }
}

export const mockJestConfigNoJsonSummary = {
  globalConfig: {
    coverageDirectory: '/path/to/coverage',
    coverageReporters: ['json', 'lcov', 'text', 'clover']
  }
}

export const mockJestConfigNoCoverageDir = {
  globalConfig: {
    coverageReporters: ['json', 'lcov', 'text', 'clover', 'json-summary']
  }
}

// Mock Jest functions
export const runCLI = jest.fn<typeof jestTypes.runCLI>()
