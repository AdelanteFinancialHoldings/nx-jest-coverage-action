import * as core from '@actions/core'
import { exec } from '@actions/exec'

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
 * @returns A list of affected projects with Jest as test executor
 */
export async function getAffectedProjects(): Promise<
  Array<{ name: string; root: string }>
> {
  const affectedProjectsCommand = 'nx affected -t=test --graph=stdout'
  core.debug(`Using command: ${affectedProjectsCommand}`)

  let outputBuffer = ''

  const options = {
    silent: true, // Always silent in tests
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

  try {
    const commandParts = affectedProjectsCommand.split(' ')
    const isNxCommand = commandParts[0] === 'nx'

    if (isNxCommand) {
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
    const affectedOutput = JSON.parse(outputBuffer) as NxAffectedOutput

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
