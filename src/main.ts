import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as github from '@actions/github'
import { generateCoverageReport } from './lib/generate-report.js'
import { getAffectedProjects } from './lib/get-affected-projects.js'
import {
  calculateAverageCoverage,
  getProjectCoverage
} from './lib/get-coverage-data.js'
import { getJestConfig, hasCoverageSummary } from './lib/get-jest-config.js'
import { upsertPRComment } from './lib/pr-comment.js'

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  const originalWorkingDir = process.cwd()

  try {
    const workspaceLocation = core.getInput('workspace-location')
    const affectedProjectsCommand = core.getInput('affected-projects-command')
    const runTests = core.getInput('run-tests') === 'true'
    const reportAnchor = core.getInput('report-anchor')
    const githubToken: string = core.getInput('github-token')

    core.info('Starting NX Jest Coverage Action')
    core.info(`Workspace location: ${workspaceLocation}`)
    core.info(`Run tests: ${runTests}`)

    core.info(`Changing working directory to: ${workspaceLocation}`)
    process.chdir(workspaceLocation)

    if (runTests) {
      core.info('Running tests...')
      try {
        const options = {
          silent: true,
          listeners: {
            stdout: (data: Buffer) => {
              core.debug(data.toString())
            },
            stderr: (data: Buffer) => {
              core.debug(`stderr: ${data.toString()}`)
            }
          }
        }

        core.debug(`Executing: npx nx affected -t=test -c=ci`)
        await exec.exec('npx', ['nx', 'affected', '-t=test', '-c=ci'], options)
      } catch (error) {
        core.warning(
          `Tests failed: ${error instanceof Error ? error.message : String(error)}`
        )
        core.warning('Continuing with coverage report generation')
      }
    }

    // Get affected projects
    const affectedProjects = await getAffectedProjects(affectedProjectsCommand)

    if (affectedProjects.length === 0) {
      core.info('No affected projects found')
      return
    }

    core.info(`Found ${affectedProjects.length} affected projects`)

    const projectCoverages = []

    for (const project of affectedProjects) {
      core.info(`Processing project: ${project.name}`)
      const jestConfig = await getJestConfig(project.root)

      if (!jestConfig || !jestConfig.globalConfig.coverageDirectory) {
        core.info(
          `Skipping project ${project.name}: No valid Jest config found`
        )
        continue
      }

      const hasSummary = await hasCoverageSummary(
        jestConfig.globalConfig.coverageDirectory
      )

      if (!hasSummary) {
        core.info(`Skipping project ${project.name}: No coverage summary found`)
        continue
      }

      const coverage = await getProjectCoverage(
        project.name,
        project.root,
        jestConfig.globalConfig.coverageDirectory
      )

      if (coverage) {
        projectCoverages.push(coverage)
      }
    }

    if (projectCoverages.length === 0) {
      core.info('No coverage data found for any affected projects')
      return
    }

    core.info(`Found coverage data for ${projectCoverages.length} projects`)

    const averageCoverage = calculateAverageCoverage(projectCoverages)

    const report = generateCoverageReport(
      projectCoverages,
      averageCoverage,
      reportAnchor
    )

    core.setOutput(
      'average_line_coverage',
      averageCoverage.lines.pct.toFixed(2)
    )
    core.setOutput(
      'average_statement_coverage',
      averageCoverage.statements.pct.toFixed(2)
    )
    core.setOutput(
      'average_function_coverage',
      averageCoverage.functions.pct.toFixed(2)
    )
    core.setOutput(
      'average_branch_coverage',
      averageCoverage.branches.pct.toFixed(2)
    )

    core.setOutput('coverage-summary', JSON.stringify(averageCoverage))

    const context = github.context
    const isPR = context.payload.pull_request !== undefined

    if (isPR) {
      try {
        const commentCreated = await upsertPRComment({
          reportContent: report,
          reportAnchor,
          githubToken
        })
        if (commentCreated) {
          core.info('PR comment created or updated successfully')
        } else {
          core.info('PR comment was not created or updated')
        }
      } catch (error) {
        core.warning(
          `Failed to upsert PR comment: ${error instanceof Error ? error.message : String(error)}`
        )
      }
    } else {
      core.info('Not running in a PR context, skipping PR comment creation')
      core.info('Coverage report:')
      core.info('-------------')
      core.info(report)
      core.info('-------------')
    }

    core.info('NX Jest Coverage Action completed successfully')
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  } finally {
    if (originalWorkingDir) {
      core.debug(
        `Changing back to original working directory: ${originalWorkingDir}`
      )
      process.chdir(originalWorkingDir)
    }
  }
}
