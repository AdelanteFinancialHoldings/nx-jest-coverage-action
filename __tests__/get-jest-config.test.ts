import { jest, describe, beforeEach, it, expect } from '@jest/globals'
import type * as execTypes from '@actions/exec'
import type * as pathTypes from 'node:path'
import {
  mockJestConfig,
  mockJestConfigNoJsonSummary,
  mockJestConfigNoCoverageDir
} from '../__fixtures__/jest-config'

// Import mocks from fixtures
import * as core from '../__fixtures__/core'

// Create mocks for modules
const exec = {
  exec: jest.fn<typeof execTypes.exec>()
}

// Create a mock for fs module
const fs = {
  accessSync: jest.fn()
}

const path = {
  join: jest.fn<typeof pathTypes.join>()
}

// Mock modules before importing the module under test
jest.unstable_mockModule('@actions/core', () => core)
jest.unstable_mockModule('@actions/exec', () => exec)
jest.unstable_mockModule('node:fs', () => fs)
jest.unstable_mockModule('node:path', () => path)

describe('get-jest-config', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  describe('getJestConfig', () => {
    it('should return Jest config when command executes successfully', async () => {
      // Mock exec to simulate successful command execution
      exec.exec.mockImplementation((cmd, args, options) => {
        if (options?.listeners?.stdout) {
          options.listeners.stdout(Buffer.from(JSON.stringify(mockJestConfig)))
        }
        return Promise.resolve(0)
      })

      const { getJestConfig } = await import('../src/lib/get-jest-config')

      const result = await getJestConfig('libs/project-a')

      expect(exec.exec).toHaveBeenCalledWith(
        'npx',
        ['jest', '--showConfig'],
        expect.objectContaining({
          cwd: 'libs/project-a',
          silent: true
        })
      )

      // Should return the Jest config
      expect(result).toEqual(mockJestConfig)
    })

    it('should return null when command execution fails', async () => {
      // Mock exec to simulate command execution failure
      exec.exec.mockRejectedValue(new Error('Command failed'))

      // The module being tested should be imported dynamically
      const { getJestConfig } = await import('../src/lib/get-jest-config')

      const result = await getJestConfig('libs/project-a')

      // Verify warning was logged
      expect(core.warning).toHaveBeenCalledWith(
        expect.stringContaining('Error getting Jest config')
      )

      // Should return null on command failure
      expect(result).toBeNull()
    })

    it('should return null when JSON output is invalid', async () => {
      // Mock exec to simulate invalid JSON output
      exec.exec.mockImplementation((cmd, args, options) => {
        if (options?.listeners?.stdout) {
          options.listeners.stdout(Buffer.from('Invalid JSON'))
        }
        return Promise.resolve(0)
      })

      // The module being tested should be imported dynamically
      const { getJestConfig } = await import('../src/lib/get-jest-config')
      const result = await getJestConfig('libs/project-a')

      // Verify error was logged
      expect(core.error).toHaveBeenCalledWith(
        expect.stringContaining('Error parsing Jest config')
      )

      // Should return null on parsing failure
      expect(result).toBeNull()
    })

    it('should return null when coverage directory is missing', async () => {
      // Mock exec to simulate output without coverage directory
      exec.exec.mockImplementation((cmd, args, options) => {
        if (options?.listeners?.stdout) {
          options.listeners.stdout(
            Buffer.from(JSON.stringify(mockJestConfigNoCoverageDir))
          )
        }
        return Promise.resolve(0)
      })

      // The module being tested should be imported dynamically
      const { getJestConfig } = await import('../src/lib/get-jest-config')
      const result = await getJestConfig('libs/project-a')

      // Verify warning was logged
      expect(core.warning).toHaveBeenCalledWith(
        expect.stringContaining('No coverage directory found in Jest config')
      )

      // Should return null when coverage directory is missing
      expect(result).toBeNull()
    })

    it('should return null when json-summary reporter is missing', async () => {
      // Mock exec to simulate output without json-summary reporter
      exec.exec.mockImplementation((cmd, args, options) => {
        if (options?.listeners?.stdout) {
          options.listeners.stdout(
            Buffer.from(JSON.stringify(mockJestConfigNoJsonSummary))
          )
        }
        return Promise.resolve(0)
      })

      // The module being tested should be imported dynamically
      const { getJestConfig } = await import('../src/lib/get-jest-config')
      const result = await getJestConfig('libs/project-a')

      // Verify warning was logged
      expect(core.warning).toHaveBeenCalledWith(
        expect.stringContaining(
          'json-summary reporter not found in Jest config'
        )
      )

      // Should return null when json-summary reporter is missing
      expect(result).toBeNull()
    })

    it('should use npx when package manager is yarn', async () => {
      // Mock exec to simulate successful command execution
      exec.exec.mockImplementation((cmd, args, options) => {
        if (options?.listeners?.stdout) {
          options.listeners.stdout(Buffer.from(JSON.stringify(mockJestConfig)))
        }
        return Promise.resolve(0)
      })

      // The module being tested should be imported dynamically
      const { getJestConfig } = await import('../src/lib/get-jest-config')
      const result = await getJestConfig('libs/project-a', 'yarn')

      // Verify exec was called with npx (now always using npx regardless of package manager)
      expect(exec.exec).toHaveBeenCalledWith(
        'npx',
        ['jest', '--showConfig'],
        expect.objectContaining({
          cwd: 'libs/project-a',
          silent: true
        })
      )

      // Should return the Jest config
      expect(result).toEqual(mockJestConfig)
    })
  })

  describe('hasCoverageSummary', () => {
    beforeEach(() => {
      // Reset all mocks before each test
      jest.resetAllMocks()
      // Setup path.join mock to return the expected path
      path.join.mockImplementation((...args) => args.join('/'))
    })

    it('should return false when coverage summary file does not exist', async () => {
      // Reset mocks before test
      jest.resetAllMocks()

      // Setup path.join mock to return the expected path
      path.join.mockReturnValue('/path/to/coverage/coverage-summary.json')

      // Mock fs.accessSync to simulate file does not exist
      fs.accessSync.mockImplementation(() => {
        throw new Error('File not found')
      })

      // Import the module under test
      const { hasCoverageSummary } = await import('../src/lib/get-jest-config')
      const result = await hasCoverageSummary('/path/to/coverage')

      // Verify warning was logged
      expect(core.warning).toHaveBeenCalledWith(
        expect.stringContaining('Coverage summary file not found')
      )

      // Should return false when file doesn't exist
      expect(result).toBe(false)
    })
  })
})
