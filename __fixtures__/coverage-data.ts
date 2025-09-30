import { CoverageSummary, ProjectCoverage } from '../src/lib/get-coverage-data'
import { jest } from '@jest/globals'
import type * as fs from 'fs'
import type * as path from 'path'

// Mock functions
export const readFileSync = jest.fn<typeof fs.readFileSync>()
export const existsSync = jest.fn<typeof fs.existsSync>()
export const join = jest.fn<typeof path.join>()

// Define AffectedProject type locally since it's not exported from get-affected-projects
type AffectedProject = {
  name: string
  root: string
}

export const mockCoverageSummary: CoverageSummary = {
  lines: { total: 100, covered: 85, skipped: 0, pct: 85 },
  statements: { total: 120, covered: 96, skipped: 0, pct: 80 },
  functions: { total: 30, covered: 27, skipped: 0, pct: 90 },
  branches: { total: 40, covered: 32, skipped: 0, pct: 80 }
}

export const mockProjectCoverages: ProjectCoverage[] = [
  {
    projectName: 'project-a',
    projectRoot: 'libs/project-a',
    coverageData: {
      lines: { total: 50, covered: 45, skipped: 0, pct: 90 },
      statements: { total: 60, covered: 54, skipped: 0, pct: 90 },
      functions: { total: 15, covered: 14, skipped: 0, pct: 93.33 },
      branches: { total: 20, covered: 18, skipped: 0, pct: 90 }
    }
  },
  {
    projectName: 'project-b',
    projectRoot: 'libs/project-b',
    coverageData: {
      lines: { total: 50, covered: 40, skipped: 0, pct: 80 },
      statements: { total: 60, covered: 42, skipped: 0, pct: 70 },
      functions: { total: 15, covered: 13, skipped: 0, pct: 86.67 },
      branches: { total: 20, covered: 14, skipped: 0, pct: 70 }
    }
  }
]

export const mockEmptyCoverageSummary: CoverageSummary = {
  lines: { total: 0, covered: 0, skipped: 0, pct: 0 },
  statements: { total: 0, covered: 0, skipped: 0, pct: 0 },
  functions: { total: 0, covered: 0, skipped: 0, pct: 0 },
  branches: { total: 0, covered: 0, skipped: 0, pct: 0 }
}

export const mockCoverageSummaryJson = {
  total: mockCoverageSummary
}

export const mockAffectedProjects: AffectedProject[] = [
  {
    name: 'project-a',
    root: 'libs/project-a'
  },
  {
    name: 'project-b',
    root: 'libs/project-b'
  }
]

export const mockJestConfig = {
  coverageDirectory: 'coverage',
  coverageReporters: ['json', 'lcov', 'text', 'clover', 'json-summary']
}
