import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import * as core from '../__fixtures__/core'
import { mockNxProjectDetails } from '../__fixtures__/nx-graph'

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
    jest.spyOn(exec, 'exec').mockImplementation((cmd, args, options) => {
      if (options?.listeners?.stdout) {
        const argsArray = args as string[]
        if (argsArray[1] === 'show' && argsArray[2] === 'projects') {
          options.listeners.stdout(
            Buffer.from(
              JSON.stringify([
                'project-a',
                'project-b',
                'project-c',
                'project-d'
              ])
            )
          )
        } else if (argsArray[1] === 'show' && argsArray[2] === 'project') {
          const projectName = argsArray[3]
          const projectData = mockNxProjectDetails[projectName]
          if (projectData) {
            options.listeners.stdout(Buffer.from(JSON.stringify(projectData)))
          }
        }
      }
      return Promise.resolve(0)
    })

    const result = await getAffectedProjects()

    expect(exec.exec).toHaveBeenCalledWith(
      'npx',
      [
        'nx',
        'show',
        'projects',
        '--affected',
        '--withTarget',
        'test',
        '--json'
      ],
      expect.objectContaining({
        silent: true
      })
    )

    expect(result).toHaveLength(4)
    expect(result).toEqual(
      expect.arrayContaining([
        { name: 'project-a', root: 'libs/project-a' },
        { name: 'project-b', root: 'libs/project-b' },
        { name: 'project-c', root: 'libs/project-c' },
        { name: 'project-d', root: 'libs/project-d' }
      ])
    )
  })

  it('should handle command execution errors', async () => {
    jest.spyOn(exec, 'exec').mockRejectedValue(new Error('Command failed'))

    const result = await getAffectedProjects()

    expect(core.error).toHaveBeenCalledWith(
      expect.stringContaining('Error getting affected projects')
    )

    expect(result).toEqual([])
  })

  it('should handle invalid JSON output', async () => {
    jest.spyOn(exec, 'exec').mockImplementation((cmd, args, options) => {
      if (options?.listeners?.stdout) {
        options.listeners.stdout(Buffer.from('Invalid JSON'))
      }
      return Promise.resolve(0)
    })

    const result = await getAffectedProjects()

    expect(core.error).toHaveBeenCalledWith(
      expect.stringContaining('Error getting affected projects')
    )

    expect(result).toEqual([])
  })

  it('should handle empty project list', async () => {
    jest.spyOn(exec, 'exec').mockImplementation((cmd, args, options) => {
      if (options?.listeners?.stdout) {
        options.listeners.stdout(Buffer.from('[]'))
      }
      return Promise.resolve(0)
    })

    const result = await getAffectedProjects()

    expect(result).toEqual([])
  })

  it('should filter out non-Jest projects', async () => {
    jest.spyOn(exec, 'exec').mockImplementation((cmd, args, options) => {
      if (options?.listeners?.stdout) {
        const argsArray = args as string[]
        if (argsArray[1] === 'show' && argsArray[2] === 'projects') {
          options.listeners.stdout(
            Buffer.from(JSON.stringify(['project-a', 'project-e']))
          )
        } else if (argsArray[1] === 'show' && argsArray[2] === 'project') {
          const projectName = argsArray[3]
          const projectData = mockNxProjectDetails[projectName]
          if (projectData) {
            options.listeners.stdout(Buffer.from(JSON.stringify(projectData)))
          }
        }
      }
      return Promise.resolve(0)
    })

    const result = await getAffectedProjects()

    expect(result).toHaveLength(1)
    expect(result).toEqual([{ name: 'project-a', root: 'libs/project-a' }])
  })

  it('should handle errors getting individual project details', async () => {
    let callCount = 0
    jest.spyOn(exec, 'exec').mockImplementation((cmd, args, options) => {
      if (callCount === 0) {
        if (options?.listeners?.stdout) {
          options.listeners.stdout(
            Buffer.from(JSON.stringify(['project-a', 'project-b']))
          )
        }
        callCount++
        return Promise.resolve(0)
      } else {
        callCount++
        return Promise.reject(new Error('Failed to get project details'))
      }
    })

    const result = await getAffectedProjects()

    expect(core.warning).toHaveBeenCalledWith(
      expect.stringContaining('Error getting details for project')
    )
    expect(result).toEqual([])
  })
})
