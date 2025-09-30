import { jest, describe, beforeEach, it, expect } from '@jest/globals'
import * as core from '../__fixtures__/core'
import { mockNxGraphOutput } from '../__fixtures__/nx-graph'

// Mock exec module with proper types
type ExecOptions = {
  cwd?: string
  silent?: boolean
  listeners?: {
    stdout?: (data: Buffer) => void
    stderr?: (data: Buffer) => void
  }
}

const exec = {
  exec: jest.fn<
    (cmd: string, args?: string[], options?: ExecOptions) => Promise<number>
  >()
}

// Mocks should be declared before the module being tested is imported
jest.unstable_mockModule('@actions/core', () => core)
jest.unstable_mockModule('@actions/exec', () => exec)

// The module being tested should be imported dynamically
const { getAffectedProjects } = await import('../src/lib/get-affected-projects')

describe('getAffectedProjects', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('should return projects using Jest as test executor', async () => {
    // Mock exec to simulate successful command execution
    jest.spyOn(exec, 'exec').mockImplementation((cmd, args, options) => {
      if (options?.listeners?.stdout) {
        options.listeners.stdout(Buffer.from(JSON.stringify(mockNxGraphOutput)))
      }
      return Promise.resolve(0)
    })

    const result = await getAffectedProjects(
      'nx affected -t=test --graph=stdout'
    )

    expect(exec.exec).toHaveBeenCalledWith(
      'npx',
      ['nx', 'affected', '-t=test', '--graph=stdout'],
      expect.objectContaining({
        silent: true
      })
    )

    // Should return projects with @nx/jest:jest or @nrwl/jest:jest executors
    expect(result).toHaveLength(4)
    expect(result).toEqual(
      expect.arrayContaining([
        { name: 'project-a', root: 'libs/project-a' },
        { name: 'project-b', root: 'libs/project-b' },
        { name: 'project-c', root: 'libs/project-c' },
        { name: 'project-d', root: 'libs/project-d' }
      ])
    )

    // Should not include projects with other executors or no targets
    expect(result).not.toEqual(
      expect.arrayContaining([
        { name: 'project-e', root: 'libs/project-e' },
        { name: 'project-f', root: 'libs/project-f' }
      ])
    )
  })

  it('should handle command execution errors', async () => {
    // Mock exec to simulate command execution failure
    jest.spyOn(exec, 'exec').mockRejectedValue(new Error('Command failed'))

    const result = await getAffectedProjects(
      'nx affected -t=test --graph=stdout'
    )

    // Verify warning was logged
    expect(core.warning).toHaveBeenCalledWith(
      expect.stringContaining('Error executing affected projects command')
    )

    // Should return empty array on command failure
    expect(result).toEqual([])
  })

  it('should handle invalid JSON output', async () => {
    // Mock exec to simulate invalid JSON output
    jest.spyOn(exec, 'exec').mockImplementation((cmd, args, options) => {
      if (options?.listeners?.stdout) {
        options.listeners.stdout(Buffer.from('Invalid JSON'))
      }
      return Promise.resolve(0)
    })

    const result = await getAffectedProjects(
      'nx affected -t=test --graph=stdout'
    )

    // Verify error was logged
    expect(core.error).toHaveBeenCalledWith(
      expect.stringContaining('Error parsing affected projects output')
    )

    // Should return empty array on parsing failure
    expect(result).toEqual([])
  })

  it('should handle missing graph data', async () => {
    // Mock exec to simulate output with missing graph data
    jest.spyOn(exec, 'exec').mockImplementation((cmd, args, options) => {
      if (options?.listeners?.stdout) {
        options.listeners.stdout(Buffer.from('{}'))
      }
      return Promise.resolve(0)
    })

    const result = await getAffectedProjects(
      'nx affected -t=test --graph=stdout'
    )

    // Should return empty array when graph data is missing
    expect(result).toEqual([])
  })
})
