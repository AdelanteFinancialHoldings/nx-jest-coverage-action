import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import * as core from '../__fixtures__/core'

// Create properly typed mock functions
const mockCreateComment = jest.fn()
const mockUpdateComment = jest.fn()
const mockListComments = jest.fn<(...args: never) => object>()

// Create mock Octokit client
const mockOctokit = {
  rest: {
    issues: {
      createComment: mockCreateComment,
      updateComment: mockUpdateComment,
      listComments: mockListComments
    }
  }
}

// Create mock context
const mockContext = {
  repo: { owner: 'owner', repo: 'repo' },
  payload: { pull_request: { number: 1 } }
}

// Mocks should be declared before the module being tested is imported
jest.unstable_mockModule('@actions/core', () => core)
jest.unstable_mockModule('@actions/github', () => ({
  getOctokit: jest.fn().mockReturnValue(mockOctokit),
  context: mockContext
}))

// The module being tested should be imported dynamically
const { upsertPRComment } = await import('../src/lib/pr-comment')

describe('pr-comment', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('handles API errors gracefully', async () => {
    mockListComments.mockRejectedValueOnce(new Error('API error'))

    await upsertPRComment({
      reportContent: 'Test comment',
      reportAnchor: 'anchor',
      githubToken: 'token'
    })

    expect(core.error).toHaveBeenCalled()
  })
})
