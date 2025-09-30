import { exec } from '@actions/exec'
import * as core from '@actions/core'
import * as path from 'node:path'
import * as fs from 'node:fs'

interface JestConfig {
  globalConfig: {
    coverageDirectory?: string
    coverageReporters?: string[]
  }
}

/**
 * Gets the Jest configuration for a project
 * @param projectRoot The root path of the project
 * @returns The Jest configuration or null if not found
 */
export async function getJestConfig(
  projectRoot: string
): Promise<JestConfig | null> {
  core.debug(`Getting Jest config for project at: ${projectRoot}`)

  // Create a buffer to store the command output
  let outputBuffer = ''

  // Execute the command and capture the output
  const options = {
    cwd: projectRoot,
    silent: true, // Always silent in tests
    listeners: {
      stdout: (data: Buffer) => {
        outputBuffer += data.toString()
        // Debug output if debug is enabled
        core.debug(data.toString())
      },
      stderr: (data: Buffer) => {
        // Debug stderr output
        core.debug(`stderr: ${data.toString()}`)
      }
    }
  }

  try {
    // Always use npx regardless of package manager
    core.debug(`Executing: npx jest --showConfig in ${projectRoot}`)
    await exec('npx', ['jest', '--showConfig'], options)
  } catch (error) {
    core.warning(
      `Error getting Jest config: ${error instanceof Error ? error.message : String(error)}`
    )
    return null
  }

  try {
    // Parse the JSON output
    const jestConfig = JSON.parse(outputBuffer) as JestConfig

    // Check if the config has the required properties
    if (!jestConfig.globalConfig.coverageDirectory) {
      core.warning(
        `No coverage directory found in Jest config for ${projectRoot}`
      )
      return null
    }

    if (!jestConfig.globalConfig.coverageReporters?.includes('json-summary')) {
      core.warning(
        `json-summary reporter not found in Jest config for ${projectRoot}`
      )
      return null
    }

    return jestConfig
  } catch (error) {
    core.error(
      `Error parsing Jest config: ${error instanceof Error ? error.message : String(error)}`
    )
    core.debug(`Output buffer: ${outputBuffer}`)
    return null
  }
}

/**
 * Checks if a coverage summary file exists for a project
 * @param coverageDirectory The coverage directory path
 * @returns True if the coverage summary file exists, false otherwise
 */
export async function hasCoverageSummary(
  coverageDirectory: string
): Promise<boolean> {
  const coverageSummaryPath = path.join(
    coverageDirectory,
    'coverage-summary.json'
  )

  try {
    fs.accessSync(coverageSummaryPath)
    return true
  } catch {
    core.warning(`Coverage summary file not found at ${coverageSummaryPath}`)
    return false
  }
}
