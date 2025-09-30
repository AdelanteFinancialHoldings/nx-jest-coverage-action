import type { CoverageSummary, ProjectCoverage } from './get-coverage-data.js'

/**
 * Generates a badge color based on coverage percentage
 * @param percentage The coverage percentage
 * @returns A color string (red, yellow, or green)
 */
function getBadgeColor(percentage: number): string {
  if (percentage < 70) return 'red'
  if (percentage < 80) return 'yellow'
  return 'green'
}

/**
 * Generates a coverage badge markdown
 * @param label The badge label
 * @param percentage The coverage percentage
 * @returns Markdown for the badge
 */
function generateCoverageBadge(label: string, percentage: number): string {
  const color = getBadgeColor(percentage)
  return `![${label}: ${percentage}%](https://img.shields.io/badge/${label}-${percentage}%25-${color})`
}

/**
 * Generates a coverage summary table row
 * @param coverage The coverage summary data
 * @returns Markdown table row
 */
function generateCoverageSummaryRow(coverage: CoverageSummary): string {
  return `| ${coverage.statements.pct}% | ${coverage.branches.pct}% | ${coverage.functions.pct}% | ${coverage.lines.pct}% |`
}

/**
 * Generates a project coverage details section
 * @param projectCoverage The project coverage data
 * @returns Markdown for the project coverage details
 */
function generateProjectCoverageDetails(
  projectCoverage: ProjectCoverage
): string {
  return `
<details>
<summary>${projectCoverage.projectName}</summary>

| Statements | Branches | Functions | Lines |
| --- | --- | --- | --- |
${generateCoverageSummaryRow(projectCoverage.coverageData)}

</details>`
}

/**
 * Generates a PR comment with the coverage report
 * @param projectCoverages The coverage data for all projects
 * @param averageCoverage The average coverage data
 * @param reportAnchor The anchor key for the report
 * @returns The PR comment markdown
 */
export function generateCoverageReport(
  projectCoverages: ProjectCoverage[],
  averageCoverage: CoverageSummary,
  reportAnchor: string
): string {
  const timestamp = new Date().toISOString()

  // Generate overall badges
  const statementsBadge = generateCoverageBadge(
    'statements',
    averageCoverage.statements.pct
  )
  const branchesBadge = generateCoverageBadge(
    'branches',
    averageCoverage.branches.pct
  )
  const functionsBadge = generateCoverageBadge(
    'functions',
    averageCoverage.functions.pct
  )
  const linesBadge = generateCoverageBadge('lines', averageCoverage.lines.pct)

  // Generate the report header
  let report = `${reportAnchor}
# Jest Coverage Report 🧪📊

${statementsBadge} ${branchesBadge} ${functionsBadge} ${linesBadge}

## Coverage Summary

| Statements | Branches | Functions | Lines |
| --- | --- | --- | --- |
${generateCoverageSummaryRow(averageCoverage)}

## Project Coverage Details
`

  // Add project details
  if (projectCoverages.length === 0) {
    report += '\nNo projects with coverage data found.\n'
  } else {
    for (const projectCoverage of projectCoverages) {
      report += generateProjectCoverageDetails(projectCoverage)
    }
  }

  // Add timestamp
  report += `\n\n<sub>Last updated: ${timestamp}</sub>`

  return report
}
