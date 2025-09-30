import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import * as core from '../__fixtures__/core'
import {
  mockEmptyCoverageSummary,
  mockProjectCoverages
} from '../__fixtures__/coverage-data'
import type { ProjectCoverage } from '../src/lib/get-coverage-data'

// Mock fs module
const fs = {
  readFile: jest.fn<(path: string, encoding: string) => Promise<string>>()
}

// Mock path module
const originalPath = jest.requireActual('node:path') as Record<string, unknown>
const path = {
  ...originalPath,
  join: jest.fn((...paths: string[]) => paths.join('/'))
}

// Mocks should be declared before the module being tested is imported
jest.unstable_mockModule('@actions/core', () => core)
jest.unstable_mockModule('node:fs/promises', () => fs)
jest.unstable_mockModule('node:path', () => path)

// The module being tested should be imported dynamically
const { getProjectCoverage, calculateAverageCoverage } = await import(
  '../src/lib/get-coverage-data'
)

describe('get-coverage-data', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  describe('getProjectCoverage', () => {
    it('should return null when file does not exist', async () => {
      // Mock fs.readFile to throw an error
      jest.spyOn(fs, 'readFile').mockRejectedValue(new Error('File not found'))

      const result = await getProjectCoverage(
        'project-a',
        'libs/project-a',
        '/path/to/coverage'
      )

      // Verify warning was logged
      expect(core.warning).toHaveBeenCalledWith(
        expect.stringContaining('Error reading coverage summary for project-a')
      )

      // Should return null when file doesn't exist
      expect(result).toBeNull()
    })

    it('should return null when coverage data is invalid', async () => {
      // Mock fs.readFile to return invalid JSON
      jest.spyOn(fs, 'readFile').mockResolvedValue('Invalid JSON' as string)

      const result = await getProjectCoverage(
        'project-a',
        'libs/project-a',
        '/path/to/coverage'
      )

      // Verify warning was logged
      expect(core.warning).toHaveBeenCalledWith(
        expect.stringContaining('Error reading coverage summary for project-a')
      )

      // Should return null when JSON is invalid
      expect(result).toBeNull()
    })
  })

  describe('calculateAverageCoverage', () => {
    it('should calculate average coverage correctly', () => {
      const result = calculateAverageCoverage(mockProjectCoverages)

      // Calculate expected values
      const expectedLines = {
        total: 100, // 50 + 50
        covered: 85, // 45 + 40
        skipped: 0,
        pct: 85 // (85/100) * 100
      }

      const expectedStatements = {
        total: 120, // 60 + 60
        covered: 96, // 54 + 42
        skipped: 0,
        pct: 80 // (96/120) * 100
      }

      const expectedFunctions = {
        total: 30, // 15 + 15
        covered: 27, // 14 + 13
        skipped: 0,
        pct: 90 // (27/30) * 100
      }

      const expectedBranches = {
        total: 40, // 20 + 20
        covered: 32, // 18 + 14
        skipped: 0,
        pct: 80 // (32/40) * 100
      }

      // Verify the calculated averages
      expect(result.lines).toEqual(expectedLines)
      expect(result.statements).toEqual(expectedStatements)
      expect(result.functions).toEqual(expectedFunctions)
      expect(result.branches).toEqual(expectedBranches)
    })

    it('should handle empty project coverages', () => {
      const result = calculateAverageCoverage([])

      // Should return zeros for all metrics
      expect(result).toEqual(mockEmptyCoverageSummary)
    })

    it('should handle zero totals', () => {
      // Create a project coverage with zero totals
      const zeroCoverage: ProjectCoverage = {
        projectName: 'zero-project',
        projectRoot: 'libs/zero-project',
        coverageData: {
          lines: { total: 0, covered: 0, skipped: 0, pct: 0 },
          statements: { total: 0, covered: 0, skipped: 0, pct: 0 },
          functions: { total: 0, covered: 0, skipped: 0, pct: 0 },
          branches: { total: 0, covered: 0, skipped: 0, pct: 0 }
        }
      }

      const result = calculateAverageCoverage([zeroCoverage])

      // Should return 100% for all metrics when total is 0
      expect(result.lines.pct).toBe(100)
      expect(result.statements.pct).toBe(100)
      expect(result.functions.pct).toBe(100)
      expect(result.branches.pct).toBe(100)
    })
  })
})
