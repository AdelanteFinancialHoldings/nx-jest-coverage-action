/**
 * Unit tests for the action's main functionality, src/main.ts
 *
 * Using jest.unstable_mockModule for mocking dependencies and dynamic imports
 * for the module under test.
 */
import { jest, describe, beforeEach, it, expect } from '@jest/globals'
import * as core from '../__fixtures__/core'
import {
  mockAffectedProjects,
  mockProjectCoverages,
  mockCoverageSummary
} from '../__fixtures__/coverage-data'
import { mockJestConfig } from '../__fixtures__/jest-config'
import { mockContext } from '../__fixtures__/github'
import type * as affectedProjectsOriginal from '../src/lib/get-affected-projects'
import type * as getJestConfigOriginal from '../src/lib/get-jest-config'
import type * as getCoverageDataOriginal from '../src/lib/get-coverage-data'
import type * as generateReportOriginal from '../src/lib/generate-report'
import type * as prCommentOriginal from '../src/lib/pr-comment'

// Type definitions for mocks
type ExecOptions = {
  cwd?: string
  silent?: boolean
  listeners?: {
    stdout?: (data: Buffer) => void
    stderr?: (data: Buffer) => void
  }
}

// Mock modules with proper types
const exec = {
  exec: jest.fn<
    (cmd: string, args?: string[], options?: ExecOptions) => Promise<number>
  >()
}

const github = {
  context: { ...mockContext }
}

const getAffectedProjects = {
  getAffectedProjects:
    jest.fn<typeof affectedProjectsOriginal.getAffectedProjects>()
}

const getJestConfig = {
  getJestConfig: jest.fn<typeof getJestConfigOriginal.getJestConfig>(),
  hasCoverageSummary: jest.fn<typeof getJestConfigOriginal.hasCoverageSummary>()
}

const getCoverageData = {
  getProjectCoverage:
    jest.fn<typeof getCoverageDataOriginal.getProjectCoverage>(),
  calculateAverageCoverage:
    jest.fn<typeof getCoverageDataOriginal.calculateAverageCoverage>()
}

const generateReport = {
  generateCoverageReport:
    jest.fn<typeof generateReportOriginal.generateCoverageReport>()
}

const prComment = {
  upsertPRComment: jest.fn<typeof prCommentOriginal.upsertPRComment>()
}

// Mocks should be declared before the module being tested is imported
jest.unstable_mockModule('@actions/core', () => core)
jest.unstable_mockModule('@actions/exec', () => exec)
jest.unstable_mockModule('@actions/github', () => ({ context: github.context }))
jest.unstable_mockModule(
  '../src/lib/get-affected-projects',
  () => getAffectedProjects
)
jest.unstable_mockModule('../src/lib/get-jest-config', () => getJestConfig)
jest.unstable_mockModule('../src/lib/get-coverage-data', () => getCoverageData)
jest.unstable_mockModule('../src/lib/generate-report', () => generateReport)
jest.unstable_mockModule('../src/lib/pr-comment', () => prComment)

// The module being tested should be imported dynamically
const { run } = await import('../src/main')

describe('main.ts', () => {
  beforeEach(() => {
    jest.resetAllMocks()

    // Mock process.env.GITHUB_TOKEN
    process.env.GITHUB_TOKEN = 'mock-token'

    // Set the action's inputs as return values from core.getInput()
    core.getInput.mockImplementation((name) => {
      switch (name) {
        case 'workspace-location':
          return '.'
        case 'affected-projects-command':
          return 'nx affected -t=test --graph=stdout'
        case 'run-tests':
          return 'false'
        case 'github-token':
          return 'mock-token'
        case 'report-anchor':
          return '<!-- nx-jest-coverage-action report -->'
        default:
          return ''
      }
    })

    // Mock GitHub context
    Object.defineProperty(github, 'context', {
      value: { ...mockContext },
      configurable: true
    })

    // Mock the library functions to return test data
    getAffectedProjects.getAffectedProjects.mockResolvedValue(
      mockAffectedProjects
    )
    getJestConfig.getJestConfig.mockResolvedValue(mockJestConfig)
    getJestConfig.hasCoverageSummary.mockResolvedValue(true)
    getCoverageData.getProjectCoverage.mockImplementation(
      async (projectName, projectRoot, coverageDir) => {
        if (process.env.DEBUG) {
          console.log(
            `Getting coverage for ${projectName} at ${projectRoot} in ${coverageDir}`
          )
        }
        const project = mockProjectCoverages.find(
          (p) => p.projectName === projectName
        )
        return project || null
      }
    )
    getCoverageData.calculateAverageCoverage.mockReturnValue(
      mockCoverageSummary
    )
    generateReport.generateCoverageReport.mockReturnValue(
      '# Jest Coverage Report'
    )
    prComment.upsertPRComment.mockResolvedValue(true)
    exec.exec.mockResolvedValue(0)
  })

  it('should process affected projects and generate coverage report', async () => {
    await run()

    // Verify getAffectedProjects was called with correct arguments
    expect(getAffectedProjects.getAffectedProjects).toHaveBeenCalledWith(
      'nx affected -t=test --graph=stdout'
    )

    // Verify getJestConfig was called for each project
    expect(getJestConfig.getJestConfig).toHaveBeenCalledTimes(
      mockAffectedProjects.length
    )
    mockAffectedProjects.forEach((project, index) => {
      expect(getJestConfig.getJestConfig).toHaveBeenNthCalledWith(
        index + 1,
        project.root
      )
    })

    // Verify getProjectCoverage was called for each project
    expect(getCoverageData.getProjectCoverage).toHaveBeenCalledTimes(
      mockAffectedProjects.length
    )

    // Verify calculateAverageCoverage was called with project coverages
    expect(getCoverageData.calculateAverageCoverage).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ projectName: 'project-a' }),
        expect.objectContaining({ projectName: 'project-b' })
      ])
    )

    // Verify generateCoverageReport was called with correct arguments
    expect(generateReport.generateCoverageReport).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ projectName: 'project-a' }),
        expect.objectContaining({ projectName: 'project-b' })
      ]),
      mockCoverageSummary,
      '<!-- nx-jest-coverage-action report -->'
    )

    // Verify upsertPRComment was called with the report
    expect(prComment.upsertPRComment).toHaveBeenCalledWith({
      reportContent: '# Jest Coverage Report',
      reportAnchor: '<!-- nx-jest-coverage-action report -->',
      githubToken: 'mock-token'
    })

    // Verify the coverage outputs were set
    expect(core.setOutput).toHaveBeenCalledWith(
      'average_line_coverage',
      '85.00'
    )
    expect(core.setOutput).toHaveBeenCalledWith(
      'average_statement_coverage',
      '80.00'
    )
    expect(core.setOutput).toHaveBeenCalledWith(
      'average_function_coverage',
      '90.00'
    )
    expect(core.setOutput).toHaveBeenCalledWith(
      'average_branch_coverage',
      '80.00'
    )
    expect(core.setOutput).toHaveBeenCalledWith(
      'coverage-summary',
      JSON.stringify(mockCoverageSummary)
    )
  })

  it('should handle case when no affected projects are found', async () => {
    // Mock getAffectedProjects to return empty array
    jest.mocked(getAffectedProjects.getAffectedProjects).mockResolvedValue([])

    await run()

    // Verify info was logged instead of warning
    expect(core.info).toHaveBeenCalledWith(
      expect.stringContaining('No affected projects found')
    )

    // Verify other functions were not called
    expect(getJestConfig.getJestConfig).not.toHaveBeenCalled()
    expect(getCoverageData.getProjectCoverage).not.toHaveBeenCalled()
  })

  it('should handle case when run-tests is true', async () => {
    // Mock getInput to return true for run-tests
    jest.mocked(core.getInput).mockImplementation((name) => {
      if (name === 'run-tests') return 'true'
      if (name === 'workspace-location') return '.'
      if (name === 'affected-projects-command')
        return 'nx affected -t=test --graph=stdout'
      if (name === 'report-anchor')
        return '<!-- nx-jest-coverage-action report -->'
      return ''
    })

    await run()

    // Verify info was logged about running tests
    expect(core.info).toHaveBeenCalledWith(
      expect.stringContaining('Running tests')
    )

    // Verify exec was called to run the tests
    expect(exec.exec).toHaveBeenCalledWith(
      'npx',
      ['nx', 'affected', '-t=test', '-c=ci'],
      expect.objectContaining({ silent: true })
    )
  })

  it('should handle test execution failures gracefully', async () => {
    // Mock getInput to return true for run-tests
    jest.mocked(core.getInput).mockImplementation((name) => {
      if (name === 'run-tests') return 'true'
      if (name === 'workspace-location') return '.'
      if (name === 'affected-projects-command')
        return 'nx affected -t=test --graph=stdout'
      if (name === 'report-anchor')
        return '<!-- nx-jest-coverage-action report -->'
      return ''
    })

    // Mock exec to throw an error
    jest.mocked(exec.exec).mockRejectedValue(new Error('Test execution failed'))

    await run()

    // Verify warning was logged about test failure
    expect(core.warning).toHaveBeenCalledWith(
      expect.stringContaining('Tests failed: Test execution failed')
    )
    expect(core.warning).toHaveBeenCalledWith(
      expect.stringContaining('Continuing with coverage report generation')
    )
  })

  it('should handle case when no projects have coverage data', async () => {
    // Mock getProjectCoverage to return null for all projects
    jest.mocked(getCoverageData.getProjectCoverage).mockResolvedValue(null)

    await run()

    // Verify info was logged
    expect(core.info).toHaveBeenCalledWith(
      'No coverage data found for any affected projects'
    )
  })

  it('should handle projects with missing Jest config', async () => {
    // Mock getJestConfig to return null for the first project
    jest
      .mocked(getJestConfig.getJestConfig)
      .mockImplementation(async (projectRoot) => {
        if (projectRoot === mockAffectedProjects[0].root) {
          return null
        }
        return mockJestConfig
      })

    await run()

    // Verify info was logged instead of warning
    expect(core.info).toHaveBeenCalledWith(
      expect.stringContaining(
        `Skipping project ${mockAffectedProjects[0].name}: No valid Jest config found`
      )
    )

    // Verify getProjectCoverage was not called for the project with missing config
    expect(getCoverageData.getProjectCoverage).not.toHaveBeenCalledWith(
      mockAffectedProjects[0].name,
      expect.anything(),
      expect.anything()
    )
  })

  it('should handle projects with invalid coverage summary', async () => {
    // Mock hasCoverageSummary to return false for the first project
    jest
      .mocked(getJestConfig.hasCoverageSummary)
      .mockImplementation(async (coverageDir) => {
        if (coverageDir === mockJestConfig.globalConfig.coverageDirectory) {
          return false
        }
        return true
      })

    await run()

    // Verify info was logged instead of warning
    expect(core.info).toHaveBeenCalledWith(
      expect.stringContaining('No coverage summary found')
    )
  })

  it('should handle PR comment creation failure', async () => {
    // Mock upsertPRComment to return false
    jest.mocked(prComment.upsertPRComment).mockResolvedValue(false)

    await run()

    // Verify info was logged
    expect(core.info).toHaveBeenCalledWith(
      expect.stringContaining('PR comment was not created or updated')
    )
  })

  it('should handle PR comment creation error', async () => {
    // Mock upsertPRComment to throw an error
    jest.mocked(prComment.upsertPRComment).mockImplementation(() => {
      throw new Error('Error creating or updating PR comment')
    })

    await run()

    // Verify warning was logged instead of error
    expect(core.warning).toHaveBeenCalledWith(
      expect.stringContaining('Failed to upsert PR comment')
    )
  })
})
