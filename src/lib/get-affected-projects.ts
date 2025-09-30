import { exec } from '@actions/exec'
import * as core from '@actions/core'

interface NxNode {
  name: string
  type: string
  data: {
    root: string
    targets?: {
      test?: {
        executor?: string
      }
    }
  }
}

interface NxGraph {
  nodes: Record<string, NxNode>
}

interface NxAffectedOutput {
  graph: NxGraph
}

/**
 * Gets the list of affected projects that use Jest for testing
 * @param affectedProjectsCommand The command to run to get affected projects
 * @param packageManager The package manager to use (npm, yarn, or pnpm)
 * @returns A list of affected projects with Jest as test executor
 */
export async function getAffectedProjects(
  affectedProjectsCommand: string,
  packageManager: string = 'npm'
): Promise<Array<{ name: string; root: string }>> {
  core.debug(`Using command: ${affectedProjectsCommand}`)

  // Create a buffer to store the command output
  let outputBuffer = ''

  // Execute the command and capture the output
  const options = {
    silent: true, // Always silent in tests
    listeners: {
      stdout: (data: Buffer) => {
        outputBuffer += data.toString()
        // Debug output
        core.debug(data.toString())
      },
      stderr: (data: Buffer) => {
        // Debug stderr output
        core.debug(`stderr: ${data.toString()}`)
      }
    }
  }

  try {
    // Check if the command starts with nx
    const commandParts = affectedProjectsCommand.split(' ')
    const isNxCommand = commandParts[0] === 'nx'

    core.debug(`Using package manager: ${packageManager}`)

    if (isNxCommand) {
      // Always use npx regardless of package manager
      core.debug(`Executing: npx ${commandParts.join(' ')}`)
      await exec('npx', commandParts, options)
    } else {
      core.debug(`Executing: ${commandParts.join(' ')}`)
      await exec(commandParts[0], commandParts.slice(1), options)
    }
  } catch (error) {
    core.warning(
      `Error executing affected projects command: ${error instanceof Error ? error.message : String(error)}`
    )
    return []
  }

  try {
    // Parse the JSON output
    const affectedOutput = JSON.parse(outputBuffer) as NxAffectedOutput

    // Filter projects that use Jest as test executor
    const jestProjects = Object.values(affectedOutput.graph.nodes)
      .filter(
        (node) =>
          node.data.targets?.test?.executor === '@nx/jest:jest' ||
          node.data.targets?.test?.executor === '@nrwl/jest:jest'
      )
      .map((node) => ({
        name: node.name,
        root: node.data.root
      }))

    core.debug(`Found ${jestProjects.length} affected projects using Jest`)
    return jestProjects
  } catch (error) {
    core.error(
      `Error parsing affected projects output: ${error instanceof Error ? error.message : String(error)}`
    )
    core.debug(`Output buffer: ${outputBuffer}`)
    return []
  }
}
