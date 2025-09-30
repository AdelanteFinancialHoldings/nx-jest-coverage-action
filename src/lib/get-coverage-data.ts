import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import * as core from '@actions/core'

export interface CoverageMetric {
  total: number
  covered: number
  skipped: number
  pct: number
}

export interface CoverageSummary {
  lines: CoverageMetric
  statements: CoverageMetric
  functions: CoverageMetric
  branches: CoverageMetric
}

export interface ProjectCoverage {
  projectName: string
  projectRoot: string
  coverageData: CoverageSummary
}

/**
 * Gets the coverage data for a project
 * @param projectName The name of the project
 * @param projectRoot The root path of the project
 * @param coverageDirectory The coverage directory path (absolute path)
 * @returns The coverage data for the project or null if not found
 */
export async function getProjectCoverage(
  projectName: string,
  projectRoot: string,
  coverageDirectory: string
): Promise<ProjectCoverage | null> {
  const coverageSummaryPath = path.join(
    coverageDirectory,
    'coverage-summary.json'
  )

  try {
    const coverageSummaryContent = await fs.readFile(
      coverageSummaryPath,
      'utf-8'
    )
    const coverageSummary = JSON.parse(coverageSummaryContent)

    if (!coverageSummary.total) {
      core.warning(`No total coverage data found in ${coverageSummaryPath}`)
      return null
    }

    return {
      projectName,
      projectRoot,
      coverageData: coverageSummary.total as CoverageSummary
    }
  } catch (error) {
    core.warning(
      `Error reading coverage summary for ${projectName}: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
    return null
  }
}

/**
 * Calculates the average coverage across all projects
 * @param projectCoverages The coverage data for all projects
 * @returns The average coverage data
 */
export function calculateAverageCoverage(
  projectCoverages: ProjectCoverage[]
): CoverageSummary {
  if (projectCoverages.length === 0) {
    return {
      lines: { total: 0, covered: 0, skipped: 0, pct: 0 },
      statements: { total: 0, covered: 0, skipped: 0, pct: 0 },
      functions: { total: 0, covered: 0, skipped: 0, pct: 0 },
      branches: { total: 0, covered: 0, skipped: 0, pct: 0 }
    }
  }

  const totals = {
    lines: { total: 0, covered: 0, skipped: 0 },
    statements: { total: 0, covered: 0, skipped: 0 },
    functions: { total: 0, covered: 0, skipped: 0 },
    branches: { total: 0, covered: 0, skipped: 0 }
  }

  for (const coverage of projectCoverages) {
    totals.lines.total += coverage.coverageData.lines.total
    totals.lines.covered += coverage.coverageData.lines.covered
    totals.lines.skipped += coverage.coverageData.lines.skipped

    totals.statements.total += coverage.coverageData.statements.total
    totals.statements.covered += coverage.coverageData.statements.covered
    totals.statements.skipped += coverage.coverageData.statements.skipped

    totals.functions.total += coverage.coverageData.functions.total
    totals.functions.covered += coverage.coverageData.functions.covered
    totals.functions.skipped += coverage.coverageData.functions.skipped

    totals.branches.total += coverage.coverageData.branches.total
    totals.branches.covered += coverage.coverageData.branches.covered
    totals.branches.skipped += coverage.coverageData.branches.skipped
  }

  const calculatePercentage = (covered: number, total: number): number => {
    if (total === 0) return 100
    return Math.round((covered / total) * 10000) / 100
  }

  return {
    lines: {
      ...totals.lines,
      pct: calculatePercentage(totals.lines.covered, totals.lines.total)
    },
    statements: {
      ...totals.statements,
      pct: calculatePercentage(
        totals.statements.covered,
        totals.statements.total
      )
    },
    functions: {
      ...totals.functions,
      pct: calculatePercentage(totals.functions.covered, totals.functions.total)
    },
    branches: {
      ...totals.branches,
      pct: calculatePercentage(totals.branches.covered, totals.branches.total)
    }
  }
}
