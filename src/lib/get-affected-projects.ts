import * as core from '@actions/core'
import { exec } from '@actions/exec'

interface NxProjectDetails {
  root: string
  name: string
  targets?: {
    test?: {
      executor?: string
    }
  }
}

/**
 * Executes a command and captures its output
 * @param command The command to execute
 * @param args The command arguments
 * @returns The command output as a string
 */
async function executeCommand(
  command: string,
  args: string[]
): Promise<string> {
  let outputBuffer = ''

  const options = {
    silent: true,
    listeners: {
      stdout: (data: Buffer) => {
        outputBuffer += data.toString()
        core.debug(data.toString())
      },
      stderr: (data: Buffer) => {
        core.debug(`stderr: ${data.toString()}`)
      }
    }
  }

  core.debug(`Executing: ${command} ${args.join(' ')}`)
  await exec(command, args, options)

  return outputBuffer.trim()
}

/**
 * Gets the list of affected projects that use Jest for testing
 * @returns A list of affected projects with Jest as test executor
 */
export async function getAffectedProjects(): Promise<
  Array<{ name: string; root: string }>
> {
  try {
    const output = await executeCommand('npx', [
      'nx',
      'show',
      'projects',
      '--affected',
      '--withTarget',
      'test',
      '--json'
    ])

    const affectedProjectNames = JSON.parse(output) as string[]
    core.debug(
      `Found ${affectedProjectNames.length} affected projects with test target`
    )

    const projectsWithDetails: Array<{ name: string; root: string }> = []

    for (const projectName of affectedProjectNames) {
      try {
        const projectDetailsOutput = await executeCommand('npx', [
          'nx',
          'show',
          'project',
          projectName,
          '--json'
        ])

        const projectDetails = JSON.parse(
          projectDetailsOutput
        ) as NxProjectDetails

        const isJestProject =
          projectDetails.targets?.test?.executor === '@nx/jest:jest' ||
          projectDetails.targets?.test?.executor === '@nrwl/jest:jest'

        if (isJestProject) {
          projectsWithDetails.push({
            name: projectDetails.name,
            root: projectDetails.root
          })
          core.debug(`Project ${projectName} uses Jest`)
        } else {
          core.debug(
            `Project ${projectName} does not use Jest (executor: ${projectDetails.targets?.test?.executor})`
          )
        }
      } catch (error) {
        core.warning(
          `Error getting details for project ${projectName}: ${error instanceof Error ? error.message : String(error)}`
        )
      }
    }

    core.debug(
      `Found ${projectsWithDetails.length} affected projects using Jest`
    )
    return projectsWithDetails
  } catch (error) {
    core.error(
      `Error getting affected projects: ${error instanceof Error ? error.message : String(error)}`
    )
    return []
  }
}
