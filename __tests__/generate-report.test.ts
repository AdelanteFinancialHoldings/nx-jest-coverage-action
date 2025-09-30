import { describe, beforeAll, afterAll, it, expect } from '@jest/globals'
import {
  mockCoverageSummary,
  mockProjectCoverages,
  mockEmptyCoverageSummary
} from '../__fixtures__/coverage-data'

// The module being tested should be imported dynamically
const { generateCoverageReport } = await import('../src/lib/generate-report')

// Mock Date to return a consistent value for tests
const mockDate = new Date('2023-01-01T12:00:00Z')
const originalDate = global.Date

describe('generate-report', () => {
  beforeAll(() => {
    // Mock Date constructor to return a fixed date
    global.Date = class extends Date {
      constructor() {
        super()
        return mockDate
      }
      static now() {
        return mockDate.getTime()
      }
    } as typeof global.Date
  })

  afterAll(() => {
    // Restore original Date
    global.Date = originalDate
  })

  it('should generate a report with project coverages', () => {
    const report = generateCoverageReport(
      mockProjectCoverages,
      mockCoverageSummary,
      '<!-- nx-jest-coverage-action report -->'
    )

    // Verify report contains the anchor
    expect(report).toContain('<!-- nx-jest-coverage-action report -->')

    // Verify report contains the header
    expect(report).toContain('# Jest Coverage Report')

    // Verify report contains badges with correct colors
    expect(report).toContain(
      '![statements: 80%](https://img.shields.io/badge/statements-80%25-green)'
    )
    expect(report).toContain(
      '![branches: 80%](https://img.shields.io/badge/branches-80%25-green)'
    )
    expect(report).toContain(
      '![functions: 90%](https://img.shields.io/badge/functions-90%25-green)'
    )
    expect(report).toContain(
      '![lines: 85%](https://img.shields.io/badge/lines-85%25-green)'
    )

    // Verify report contains summary table
    expect(report).toContain('## Coverage Summary')
    expect(report).toContain('| Statements | Branches | Functions | Lines |')
    expect(report).toContain('| 80% | 80% | 90% | 85% |')

    // Verify report contains project details
    expect(report).toContain('## Project Coverage Details')
    expect(report).toContain('<summary>project-a</summary>')
    expect(report).toContain('<summary>project-b</summary>')
    expect(report).toContain('| 90% | 90% | 93.33% | 90% |') // project-a coverage
    expect(report).toContain('| 70% | 70% | 86.67% | 80% |') // project-b coverage

    // Verify report contains timestamp
    expect(report).toContain(
      '<sub>Last updated: 2023-01-01T12:00:00.000Z</sub>'
    )
  })

  it('should generate a report with no project coverages', () => {
    const report = generateCoverageReport(
      [],
      mockEmptyCoverageSummary,
      '<!-- nx-jest-coverage-action report -->'
    )

    // Verify report contains the header
    expect(report).toContain('# Jest Coverage Report')

    // Verify report contains badges with red color for 0%
    expect(report).toContain(
      '![statements: 0%](https://img.shields.io/badge/statements-0%25-red)'
    )
    expect(report).toContain(
      '![branches: 0%](https://img.shields.io/badge/branches-0%25-red)'
    )
    expect(report).toContain(
      '![functions: 0%](https://img.shields.io/badge/functions-0%25-red)'
    )
    expect(report).toContain(
      '![lines: 0%](https://img.shields.io/badge/lines-0%25-red)'
    )

    // Verify report contains summary table with zeros
    expect(report).toContain('| 0% | 0% | 0% | 0% |')

    // Verify report contains no projects message
    expect(report).toContain('No projects with coverage data found.')
  })

  it('should use correct badge colors based on coverage percentage', () => {
    // Create coverage summaries with different percentages
    const lowCoverage = {
      ...mockCoverageSummary,
      statements: { ...mockCoverageSummary.statements, pct: 65 },
      branches: { ...mockCoverageSummary.branches, pct: 65 },
      functions: { ...mockCoverageSummary.functions, pct: 65 },
      lines: { ...mockCoverageSummary.lines, pct: 65 }
    }

    const mediumCoverage = {
      ...mockCoverageSummary,
      statements: { ...mockCoverageSummary.statements, pct: 75 },
      branches: { ...mockCoverageSummary.branches, pct: 75 },
      functions: { ...mockCoverageSummary.functions, pct: 75 },
      lines: { ...mockCoverageSummary.lines, pct: 75 }
    }

    const highCoverage = {
      ...mockCoverageSummary,
      statements: { ...mockCoverageSummary.statements, pct: 85 },
      branches: { ...mockCoverageSummary.branches, pct: 85 },
      functions: { ...mockCoverageSummary.functions, pct: 85 },
      lines: { ...mockCoverageSummary.lines, pct: 85 }
    }

    // Generate reports for each coverage level
    const lowReport = generateCoverageReport([], lowCoverage, '<!-- report -->')
    const mediumReport = generateCoverageReport(
      [],
      mediumCoverage,
      '<!-- report -->'
    )
    const highReport = generateCoverageReport(
      [],
      highCoverage,
      '<!-- report -->'
    )

    // Verify correct colors are used
    expect(lowReport).toContain('red') // < 70%
    expect(lowReport).not.toContain('yellow')
    expect(lowReport).not.toContain('green')

    expect(mediumReport).toContain('yellow') // 70-80%
    expect(mediumReport).not.toContain('red')
    expect(mediumReport).not.toContain('green')

    expect(highReport).toContain('green') // > 80%
    expect(highReport).not.toContain('red')
    expect(highReport).not.toContain('yellow')
  })
})
